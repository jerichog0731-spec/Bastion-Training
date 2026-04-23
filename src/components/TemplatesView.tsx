import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Search, 
  Zap, 
  Bot, 
  Settings2,
  Shield,
  BookOpen,
  Palette,
  Link,
  CheckSquare,
  Database,
  Navigation,
  Eye,
  Factory,
  Rocket,
  Scale,
  Users,
  Radar,
  Leaf,
  Cpu,
  Fingerprint,
  Heart,
  Globe,
  Languages,
  Music,
  Tag,
  Gamepad2,
  Activity,
  Wand2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AGENT_TEMPLATES, CORE_AI_MODELS, ICON_MAP, PREBUILT_MODULES } from '../constants';
import { AgentConfig, AgentTemplate, AgentModule } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TemplatesViewProps {
  onDeploy: (templateId: string, customizedModel?: string, extraModules?: string[]) => void;
}

export default function TemplatesView({ onDeploy }: TemplatesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [customModel, setCustomModel] = useState<string>('');
  const [extraModules, setExtraModules] = useState<string[]>([]);

  const filteredTemplates = AGENT_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.capabilities.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenDeploy = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setCustomModel(template.defaultModel || 'Gemini 1.5 Flash');
    setExtraModules([]);
  };

  const handleConfirmDeploy = () => {
    if (!selectedTemplate) return;
    onDeploy(selectedTemplate.id, customModel, extraModules);
    setSelectedTemplate(null);
  };

  const toggleModule = (moduleId: string) => {
    setExtraModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) 
        : [...prev, moduleId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-500 fill-orange-500/20" />
            Neural Agent Blueprints
          </h2>
          <p className="text-zinc-500 mt-1 text-lg">Deploy pre-configured agent architectures for specific mission profiles.</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Search templates..." 
            className="pl-10 bg-zinc-900 border-zinc-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => {
          const IconComponent = ICON_MAP[template.icon] || Bot;
          return (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-all flex flex-col group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 rounded-xl bg-orange-600/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-6 h-6 text-orange-500" />
                    </div>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 border-zinc-700">
                      {template.modules.length} Modules
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-white">{template.name}</CardTitle>
                  <CardDescription className="text-zinc-400 line-clamp-2 mt-1">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {template.capabilities.map((cap, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] uppercase tracking-wider bg-zinc-800/50 border-zinc-700 text-zinc-400">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-zinc-800/50">
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white"
                    onClick={() => handleOpenDeploy(template)}
                  >
                    Deploy Blueprint
                    <Plus className="ml-2 w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl text-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <Zap className="w-6 h-6 text-orange-500" />
              Configure Deployment: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Customize the foundation and capabilities of your new neural agent.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-zinc-300 font-medium">Foundational Brain (Core AI Model)</Label>
              <Select value={customModel} onValueChange={setCustomModel}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12">
                  <SelectValue placeholder="Select core model" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800">
                  {CORE_AI_MODELS.map(model => (
                    <SelectItem key={model.value} value={model.value} className="text-zinc-300">
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500">The primary LLM or generative model that orchestrates this blueprint.</p>
            </div>

            <div className="space-y-4">
              <Label className="text-zinc-300 font-medium">Augment Intelligence (Optional Modules)</Label>
              <ScrollArea className="h-48 rounded-md border border-zinc-800 p-2 bg-zinc-950/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {PREBUILT_MODULES.map((module) => {
                    const isDefault = selectedTemplate?.modules.includes(module.id);
                    const isSelected = extraModules.includes(module.id);
                    const ModIcon = ICON_MAP[module.icon] || Bot;

                    return (
                      <div 
                        key={module.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                          isDefault ? "bg-zinc-800/30 border-zinc-700 opacity-50 cursor-not-allowed" : 
                          isSelected ? "bg-orange-600/10 border-orange-500/50" : 
                          "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                        )}
                        onClick={() => !isDefault && toggleModule(module.id)}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded bg-zinc-800 flex items-center justify-center",
                          isSelected && "bg-orange-600/20 text-orange-500"
                        )}>
                          <ModIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate">{module.name}</p>
                          <p className="text-[10px] text-zinc-500 line-clamp-1 mt-1">{module.type}</p>
                        </div>
                        {isDefault && <Badge variant="secondary" className="text-[8px] bg-zinc-800">Included</Badge>}
                        {!isDefault && isSelected && <Plus className="w-4 h-4 text-orange-500 rotate-45" />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedTemplate(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDeploy}
              className="bg-orange-600 hover:bg-orange-500 text-white min-w-[140px]"
            >
              Finalize & Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
