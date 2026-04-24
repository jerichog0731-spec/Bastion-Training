import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
  useDraggable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Settings2, 
  Trash2, 
  Play, 
  Save, 
  Plus,
  Info,
  ChevronRight,
  Database,
  Search,
  ChevronDown,
  X,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import { AgentConfig, AgentModule } from '../types';
import { PREBUILT_MODULES, ICON_MAP, CORE_AI_MODELS } from '../constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ModuleProperties } from './ModuleProperties';
import { GeminiOrchestrator } from './GeminiOrchestrator';
import { ConnectionLayer } from './ConnectionLayer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_COLORS: Record<string, { bg: string, text: string, border: string, dot: string }> = {
  trigger: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', dot: 'bg-blue-500' },
  action: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30', dot: 'bg-orange-500' },
  logic: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30', dot: 'bg-purple-500' },
  output: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  optimization: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/30', dot: 'bg-rose-500' },
};

interface BuilderProps {
  agent: AgentConfig;
  onUpdate?: (updates: Partial<AgentConfig>) => void;
}

function DragOverlayContent({ activeId, overId, activeModules }: { activeId: string, overId: string | null, activeModules: AgentModule[] }) {
  const isLibraryItem = activeId.startsWith('library-');
  const libModule = isLibraryItem ? PREBUILT_MODULES.find(m => `library-${m.id}` === activeId) : null;
  const pipeModule = !isLibraryItem ? activeModules.find(m => m.id === activeId) : null;
  const module = libModule || pipeModule;
  
  if (!module) return null;
  const isValidDrop = overId === 'canvas-droppable' || activeModules.some(m => m.id === overId);

  return (
    <div className={cn(
      "bg-zinc-950 border rounded-xl p-4 shadow-2xl transition-all duration-200 ring-1 backdrop-blur-md",
      "opacity-90 scale-105",
      !isValidDrop ? "border-rose-500/50 ring-rose-500/20 animate-shake" : "border-orange-500/50 ring-orange-500/20"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg border",
          !isValidDrop ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-orange-500/10 border-orange-500/20 text-orange-500"
        )}>
          <ModuleIcon icon={module.icon} className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-100">{module.name}</p>
          <Badge variant="outline" className={cn(
            "text-[8px] h-3 px-1 border-opacity-30",
            !isValidDrop ? "border-rose-500 text-rose-400" : "border-orange-500 text-orange-400"
          )}>
            {!isValidDrop ? "INVALID TARGET" : isLibraryItem ? "INITIALIZING..." : "REPOSITIONING..."}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function CanvasDroppable({ children, isDragging }: { children: React.ReactNode, isDragging: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas-droppable',
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex-1 bg-zinc-900/30 rounded-xl border border-zinc-800 relative group transition-all duration-300 min-h-[400px]",
        isOver && "border-orange-500/50 bg-orange-500/[0.04] scale-[1.002] ring-1 ring-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.05)]",
        isDragging && !isOver && "opacity-80 border-dashed border-zinc-700"
      )}
    >
        {isOver && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="bg-zinc-950 border border-orange-500/30 px-5 py-2.5 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <Plus className="w-4 h-4 animate-bounce" />
                Initialize Neural Node
              </p>
            </div>
          </div>
        )}
        {children}
    </div>
  );
}

export default function Builder({ agent, onUpdate }: BuilderProps) {
  const [activeModules, setActiveModules] = useState<AgentModule[]>(agent?.modules || []);
  const [coreModel, setCoreModel] = useState(agent?.coreModel || 'Gemini 1.5 Flash');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    optimization: true,
    output: true
  });
  const [moduleErrors, setModuleErrors] = useState<Record<string, string[]>>({});
  const [lastAutoSave, setLastAutoSave] = useState<number>(Date.now());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Infinite scroll simulation
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      // Near bottom, load more
      if (visibleCount < PREBUILT_MODULES.length) {
        setVisibleCount(prev => Math.min(prev + 5, PREBUILT_MODULES.length));
      }
    }
  };

  // Auto-save logic
  useEffect(() => {
    const interval = setInterval(() => {
      handleSave(true);
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [activeModules]);

  const handleSave = (isAuto = false) => {
    // Persist to parent
    if (onUpdate) {
      onUpdate({
        modules: activeModules,
        coreModel: coreModel,
        updatedAt: Date.now()
      });
    }
    setLastAutoSave(Date.now());
    if (!isAuto) {
      toast.success("Neural architecture synchronized");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setOverId(null);
    
    // Handle Library Drop
    if (String(active.id).startsWith('library-')) {
      const isOverCanvas = over && (over.id === 'canvas-droppable' || activeModules.some(m => m.id === over.id));
      if (isOverCanvas) {
        const module = active.data.current as AgentModule;
        if (module) addModule(module);
      }
      setActiveId(null);
      return;
    }

    if (over && active.id !== over.id) {
      setActiveModules((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  };

  const addModule = (module: AgentModule) => {
    const newId = `${module.id}-${Date.now()}`;
    const newModule = { ...module, id: newId };
    setActiveModules([...activeModules, newModule]);
    setRecentlyAddedId(newId);
    setTimeout(() => setRecentlyAddedId(null), 1000);
    toast.success(`Added ${module.name} to pipeline`);
  };

  const removeModule = (id: string) => {
    setActiveModules(activeModules.filter(m => m.id !== id));
    if (selectedModuleId === id) setSelectedModuleId(null);
    setDeleteId(null);
    toast.info("Module removed from pipeline");
  };

  const updateModuleConfig = (id: string, newConfig: Record<string, any>) => {
    setActiveModules(prev => prev.map(m => m.id === id ? { ...m, config: newConfig } : m));
    
    // Clear errors when config changes - they will be re-validated in the properties panel
    if (moduleErrors[id]) {
      const newErrors = { ...moduleErrors };
      delete newErrors[id];
      setModuleErrors(newErrors);
    }
  };

  const setValidationErrors = (id: string, errors: string[]) => {
    setModuleErrors(prev => ({ ...prev, [id]: errors }));
  };

  const handleModuleAction = async (actionId: string, config: Record<string, any>) => {
    if (actionId === 'compile-trigger') {
      const loadingId = toast.loading("Bastion: Accessing export_cbt_block_stablehlo.py...");
      try {
        const response = await fetch('/api/edge/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            precision: config.precision,
            seqLength: config.seqLength,
            agentName: agent.name
          })
        });
        const data = await response.json();
        
        if (data.status === 'success') {
          toast.success(`Package Ready: ${data.path}`, { 
            id: loadingId,
            description: "StableHLO binary successfully exported to edge_deploy/ library." 
          });
        } else {
          throw new Error(data.error);
        }
      } catch (error: any) {
        toast.error("Compilation Error", { 
          id: loadingId,
          description: error.message || "XLA backend failed to initialize StableHLO export."
        });
      }
    }
  };

  const updateModuleDependencies = (id: string, deps: string[]) => {
    setActiveModules(prev => prev.map(m => m.id === id ? { ...m, dependencies: deps } : m));
  };

  const selectedModule = activeModules.find(m => m.id === selectedModuleId);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to remove this module from your pipeline? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteId && removeModule(deleteId)}>
              Delete Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Module Palette */}
      <div className="col-span-3 space-y-4 flex flex-col h-full">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Module Library</h3>
          <Info className="w-4 h-4 text-zinc-600" />
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter modules..." 
            className="bg-zinc-900 border-zinc-800 h-9 pl-9 text-xs focus:ring-1 focus:ring-orange-500/30"
          />
        </div>

        <ScrollArea 
          className="flex-1 bg-zinc-900/50 rounded-xl border border-zinc-800 p-2"
          onScrollCapture={handleScroll}
        >
          <div className="space-y-4 pt-2">
            {Object.entries(
              PREBUILT_MODULES
                .filter(m => 
                  m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  m.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, visibleCount)
                .reduce((acc, module) => {
                  if (!acc[module.type]) acc[module.type] = [];
                  acc[module.type].push(module);
                  return acc;
                }, {} as Record<string, AgentModule[]>)
            ).map(([type, modules]) => (
              <div key={type} className="space-y-2">
                <button 
                  onClick={() => setCollapsedGroups(prev => ({ ...prev, [type]: !prev[type] }))}
                  className="w-full flex items-center justify-between px-2 py-1 hover:bg-zinc-800/50 rounded transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", TYPE_COLORS[type]?.dot || 'bg-zinc-500')} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">
                      {type}s
                    </span>
                    <Badge variant="outline" className="text-[8px] h-3 px-1 border-zinc-800 opacity-50">{modules.length}</Badge>
                  </div>
                  <ChevronDown className={cn("w-3 h-3 text-zinc-600 transition-transform", collapsedGroups[type] ? "-rotate-90" : "rotate-0")} />
                </button>
                
                {!collapsedGroups[type] && (
                  <div className="space-y-2 px-1">
                    {modules.map((module) => (
                      <ModulePaletteItem 
                        key={module.id} 
                        module={module} 
                        onAdd={() => {
                          addModule(module);
                          handleSave(true);
                        }} 
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {visibleCount < PREBUILT_MODULES.length && (
              <div className="py-4 px-2 border-t border-zinc-800/50">
                <Button 
                  variant="ghost" 
                  className="w-full h-8 text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                  onClick={() => setVisibleCount(prev => Math.min(prev + 10, PREBUILT_MODULES.length))}
                >
                  Load More Modules
                  <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

        <div className="col-span-6 flex flex-col gap-4 h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-zinc-100 italic serif">Active Pipeline</h3>
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-none font-mono text-[10px]">
                {activeModules.length} NODES
              </Badge>
              <Badge variant="outline" className="text-[10px] border-zinc-800 bg-zinc-950 flex items-center gap-1.5 px-2 py-0.5">
                <BrainCircuit className="w-3 h-3 text-emerald-500" />
                {coreModel}
              </Badge>
              <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono italic ml-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Auto-saved {new Date(lastAutoSave).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "h-8 border-orange-500/30 text-orange-500 hover:bg-orange-500/10",
                  isChatOpen && "bg-orange-500/10"
                )}
                onClick={() => setIsChatOpen(!isChatOpen)}
              >
                <BrainCircuit className="w-3.5 h-3.5 mr-1.5" />
                Ask Gemini
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-zinc-400 hover:text-white">
                <Play className="w-3.5 h-3.5 mr-1.5" />
                Simulate
              </Button>
              <Button 
                size="sm" 
                className="h-8 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold"
                onClick={() => handleSave()}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </div>
          
          <CanvasDroppable isDragging={!!activeId}>
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]" />
            
            <ScrollArea className="h-full p-6 relative z-10" scrollViewportRef={canvasRef}>
              <ConnectionLayer 
                modules={activeModules} 
                selectedModuleId={selectedModuleId}
                containerRef={canvasRef} 
              />
              <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={activeModules.map(m => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {activeModules.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 animate-pulse">
                        <Database className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-zinc-400 font-medium tracking-tight">Empty Pipeline</p>
                        <p className="text-zinc-600 text-xs">Drag modules from the library to build your agent's brain.</p>
                      </div>
                    </div>
                  )}
                  {activeModules.map((module) => (
                    <SortableModuleItem 
                      key={module.id} 
                      module={module} 
                      selected={selectedModuleId === module.id}
                      recentlyAdded={recentlyAddedId === module.id}
                      hasErrors={!!moduleErrors[module.id] && moduleErrors[module.id].length > 0}
                      onSelect={() => setSelectedModuleId(module.id)}
                      onRemove={() => setDeleteId(module.id)}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeId ? (
                  <DragOverlayContent 
                    activeId={activeId} 
                    overId={overId} 
                    activeModules={activeModules} 
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </ScrollArea>
        </CanvasDroppable>
      </div>

      {/* Properties Panel */}
      <div className="col-span-3 h-full flex flex-col">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 px-1">Neural Configuration</h3>
        
        <Card className="mb-4 bg-zinc-900 border-zinc-800 border-l-2 border-l-orange-500">
           <CardHeader className="py-3">
            <CardTitle className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Foundational Brain</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <Select 
              value={coreModel} 
              onValueChange={(val) => {
                setCoreModel(val);
                if (onUpdate) onUpdate({ coreModel: val, updatedAt: Date.now() });
              }}
            >
              <SelectTrigger className="bg-zinc-950 border-zinc-800 h-8 text-[11px]">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                {CORE_AI_MODELS.map(model => (
                  <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="flex-1 bg-zinc-900 border-zinc-800 overflow-hidden">
          <CardHeader className="pb-4">
            {selectedModule ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <ModuleIcon icon={selectedModule.icon} className="w-4 h-4 text-orange-500" />
                  <Badge variant="outline" className="text-[10px] uppercase tracking-tighter opacity-50">{selectedModule.type}</Badge>
                </div>
                <CardTitle className="text-lg">{selectedModule.name}</CardTitle>
                <CardDescription className="text-xs">{selectedModule.description}</CardDescription>
              </>
            ) : (
              <div className="py-12 text-center space-y-4 opacity-50">
                <Settings2 className="w-8 h-8 mx-auto text-zinc-700" />
                <p className="text-xs text-zinc-500">Select a module from the pipeline to configure its parameters.</p>
              </div>
            )}
          </CardHeader>
          {selectedModule && (
            <CardContent className="space-y-6">
              <Separator className="bg-zinc-800" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Display Name</Label>
                  <Input 
                    value={selectedModule.name} 
                    onChange={(e) => setActiveModules(prev => prev.map(m => m.id === selectedModule.id ? { ...m, name: e.target.value } : m))}
                    className="bg-zinc-950 border-zinc-800 h-9" 
                  />
                </div>
                
                <ModuleProperties 
                  module={selectedModule} 
                  allModules={activeModules}
                  onUpdate={(config) => updateModuleConfig(selectedModule.id, config)} 
                  onUpdateDependencies={(deps) => updateModuleDependencies(selectedModule.id, deps)}
                  onValidationChange={(errs) => setValidationErrors(selectedModule.id, errs)}
                  onAction={handleModuleAction}
                />
              </div>

              <div className="pt-4">
                <Button variant="destructive" size="sm" className="w-full text-xs h-8 opacity-70 hover:opacity-100" onClick={() => setDeleteId(selectedModule.id)}>
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete Module
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
      {/* Floating Gemini Chat */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-8 w-96 h-[500px] z-[100] shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
           <div className="h-full flex flex-col relative group">
             <button 
               onClick={() => setIsChatOpen(false)}
               className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white z-[101]"
             >
               <X className="w-3 h-3" />
             </button>
             <GeminiOrchestrator 
               agents={[agent]} 
               onUpdateAgent={() => {}} 
               onStartTraining={() => {}} 
             />
           </div>
        </div>
      )}
    </div>
  );
}

function ModulePaletteItem({ module, onAdd }: { module: AgentModule, onAdd: () => void, key?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${module.id}`,
    data: module
  });

  const colors = TYPE_COLORS[module.type] || TYPE_COLORS.action;
  const TypeIcon = ICON_MAP[module.type.charAt(0).toUpperCase() + module.type.slice(1)] || Plus;
  
  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group bg-zinc-900 border rounded-lg p-3 transition-all cursor-grab active:cursor-grabbing",
        "hover:border-zinc-100/30",
        colors.border,
        isDragging && "opacity-50 ring-1 ring-orange-500/50 scale-95"
      )} onClick={onAdd}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-md border text-zinc-400 group-hover:text-zinc-100 transition-all",
            colors.bg,
            colors.border
          )}>
            <ModuleIcon icon={module.icon} className="w-4 h-4" />
          </div>
          <div className={cn("p-1.5 rounded-full border bg-zinc-950", colors.border, colors.text)}>
            <TypeIcon className="w-3 h-3" />
          </div>
        </div>
        <Plus className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-100 transition-colors" />
      </div>
      <h4 className="text-sm font-semibold text-zinc-200">{module.name}</h4>
      <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-relaxed leading-snug">{module.description}</p>
    </div>
  );
}

function SortableModuleItem({ 
  module, 
  selected, 
  onSelect, 
  onRemove, 
  recentlyAdded,
  hasErrors 
}: { 
  module: AgentModule, 
  selected?: boolean, 
  onSelect: () => void, 
  onRemove: () => void, 
  recentlyAdded?: boolean,
  hasErrors?: boolean,
  key?: any 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
  const colors = TYPE_COLORS[module.type] || TYPE_COLORS.action;
  const TypeIcon = ICON_MAP[module.type.charAt(0).toUpperCase() + module.type.slice(1)] || Play;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      id={`module-${module.id}`}
      style={style}
      className={cn(
        "group h-16 bg-zinc-950/80 backdrop-blur-sm border rounded-xl flex items-center gap-4 px-4 transition-all hover:bg-zinc-900 shadow-sm relative",
        selected ? "border-zinc-100/50 ring-1 ring-zinc-100/10" : "border-zinc-800",
        hasErrors && "border-rose-500/50 ring-1 ring-rose-500/10",
        isDragging && "shadow-xl border-orange-500/50 scale-105",
        recentlyAdded && "animate-drop-success border-emerald-500/50"
      )}
      onClick={onSelect}
    >
      {hasErrors && (
        <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center animate-bounce shadow-lg shadow-rose-500/20 z-10">
          <Info className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-500">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="relative">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center border transition-all",
          selected ? "bg-zinc-900 border-zinc-700" : "bg-zinc-950 border-zinc-800",
          colors.bg,
          colors.border,
          colors.text
        )}>
          <ModuleIcon icon={module.icon} className="w-5 h-5 shadow-sm" />
        </div>
        <div className={cn(
          "absolute -top-1 -right-1 w-4 h-4 rounded-full border bg-zinc-950 flex items-center justify-center",
          colors.border,
          colors.text
        )}>
          <TypeIcon className="w-2 h-2" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
          <h4 className="text-sm font-semibold text-zinc-100 truncate">{module.name}</h4>
        </div>
        <div className="flex items-center gap-2 mt-0.5 ml-3.5">
          <Badge variant="outline" className={cn(
            "text-[9px] h-3.5 px-1 uppercase tracking-tighter bg-zinc-950 font-bold",
            colors.text,
            colors.border
          )}>
            {module.type}
          </Badge>
          <span className="text-[10px] text-zinc-600 font-mono">ID: {module.id.split('-')[0]}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 rounded-full text-zinc-600 hover:text-rose-500" 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 rounded-full text-zinc-600 hover:text-zinc-100" 
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function ModuleIcon({ icon, className }: { icon: string, className?: string }) {
  const Icon = ICON_MAP[icon] || Database;
  return <Icon className={className} />;
}
