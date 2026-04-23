import React, { useState } from 'react';
import { 
  History, 
  RotateCcw, 
  GitCompare, 
  CheckCircle2, 
  Tag, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  ArrowLeftRight,
  Split,
  FileCode,
  Globe,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentConfig, AgentVersion } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VersionControlProps {
  agent: AgentConfig;
  versions: AgentVersion[];
  onRestore: (version: AgentVersion) => void;
  onDelete: (versionId: string) => void;
}

export default function VersionControl({ agent, versions, onRestore, onDelete }: VersionControlProps) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const agentVersions = versions.filter(v => v.agentId === agent.id).sort((a,b) => b.createdAt - a.createdAt);

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(i => i !== id));
    } else {
      if (compareIds.length < 2) {
        setCompareIds([...compareIds, id]);
      } else {
        toast.error("You can only compare two versions at a time.");
      }
    }
  };

  const getCompareVersions = () => {
    return agentVersions.filter(v => compareIds.includes(v.id));
  };

  const currentConfigHash = JSON.stringify(agent.modules);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="w-6 h-6 text-orange-500" />
            Neural Version Explorer
          </h2>
          <p className="text-sm text-zinc-500 font-mono italic serif">Managing snapshots for {agent.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {compareIds.length === 2 && (
            <Button 
              onClick={() => setIsComparing(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare Selected ({compareIds.length})
            </Button>
          )}
          <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white" onClick={() => setCompareIds([])}>
            Clear Selection
          </Button>
        </div>
      </div>

      {!isComparing ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="border-b border-zinc-800 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Version Timeline</CardTitle>
                <CardDescription className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">Immutable configuration snapshots</CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                Current: v{agent.version}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-zinc-800/50">
                {agentVersions.length === 0 && (
                  <div className="p-12 text-center space-y-3 opacity-30">
                    <History className="w-12 h-12 mx-auto text-zinc-700" />
                    <p className="text-sm text-zinc-500">No snapshots recorded yet. Deploy your first version to see history.</p>
                  </div>
                )}
                {agentVersions.map((v, i) => {
                  const isCurrent = v.version === agent.version;
                  const isSelected = compareIds.includes(v.id);
                  
                  return (
                    <div 
                      key={v.id} 
                      className={cn(
                        "p-6 flex items-start justify-between transition-all group",
                        isSelected ? "bg-orange-500/5 border-l-2 border-l-orange-500" : "hover:bg-zinc-800/30"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleCompare(v.id)}
                            className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-orange-600 focus:ring-orange-500/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-100">v{v.version}</span>
                            {v.tag && (
                              <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1 bg-zinc-800 text-zinc-400">
                                {v.tag}
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge className="text-[10px] h-4 py-0 px-1 bg-emerald-600/20 text-emerald-500 border-none">
                                ACTIVE
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400">{v.description}</p>
                          <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-mono">
                              <Clock className="w-3 h-3" />
                              {new Date(v.createdAt).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-mono">
                              <Split className="w-3 h-3" />
                              {v.config.modules.length} Modules
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-xs text-zinc-500 hover:text-white"
                          disabled={isCurrent}
                          onClick={() => onRestore(v)}
                        >
                          <RotateCcw className="w-3 h-3 mr-1.5" />
                          Revert
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-xs text-zinc-500 hover:text-rose-500"
                          onClick={() => onDelete(v.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Button variant="ghost" className="text-zinc-500 hover:text-white mb-2" onClick={() => setIsComparing(false)}>
            <ArrowLeftRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Timeline
          </Button>
          
          <div className="grid grid-cols-2 gap-8">
            {getCompareVersions().map((v, i) => (
              <Card key={v.id} className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <Badge className="bg-orange-600/20 text-orange-500 border-none">
                    {i === 0 ? 'SOURCE' : 'TARGET'}
                  </Badge>
                </div>
                <CardHeader className="border-b border-zinc-800">
                  <CardTitle className="text-lg">Version {v.version}</CardTitle>
                  <CardDescription className="font-mono text-[10px] text-zinc-500 uppercase">{v.tag || 'Release Snapshot'}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Logic Core</h4>
                    <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                      <p className="text-sm text-zinc-300 leading-relaxed italic">"{v.config.systemInstruction}"</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Module Pipeline ({v.config.modules.length})</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {v.config.modules.map(m => (
                        <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                          <div className={cn(
                            "w-8 h-8 rounded flex items-center justify-center text-[10px]",
                            m.type === 'trigger' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                            m.type === 'logic' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            m.type === 'action' ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                            "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          )}>
                            {m.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-zinc-200">{m.name}</p>
                            <p className="text-[10px] text-zinc-600 truncate">{m.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-800">
                    <Button 
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                      disabled={v.version === agent.version}
                      onClick={() => {
                        onRestore(v);
                        setIsComparing(false);
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Revert to this configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-zinc-950 border border-zinc-800 border-dashed p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center">
                <FileCode className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-zinc-100">Deep Config Diff</h3>
              <p className="text-xs text-zinc-500">Visualizing structural changes between neural weights and pipeline logic. Use these snapshots to verify performance improvements between training iterations.</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
