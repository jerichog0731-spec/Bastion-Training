import React from 'react';
import { BookOpen, Users, Brain, Repeat, ArrowRight, Zap, Target, BookMarked, Pause, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentConfig, TutoringSession, CustomModel } from '../types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BrainCircuit, Cpu } from 'lucide-react';

interface TutoringLabProps {
  agents: AgentConfig[];
  customModels: CustomModel[];
  setCustomModels: React.Dispatch<React.SetStateAction<CustomModel[]>>;
  sessions: TutoringSession[];
  setSessions: React.Dispatch<React.SetStateAction<TutoringSession[]>>;
  onStartSession: (session: Partial<TutoringSession>) => void;
}

export default function TutoringLab({ agents, customModels, setCustomModels, sessions, setSessions, onStartSession }: TutoringLabProps) {
  const [selectedTeacherId, setSelectedTeacherId] = React.useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>('');

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSessions(prevSessions => prevSessions.map(session => {
        if (session.status === 'active') {
          const currentProgress = session.progress || 0;
          const newProgress = Math.min(100, currentProgress + (Math.random() * 2));
          
          return {
            ...session,
            lastIteration: (session.lastIteration || 0) + 1,
            insightsGenerated: (session.insightsGenerated || 0) + Math.floor(Math.random() * 3),
            progress: newProgress,
            status: newProgress >= 100 ? 'completed' : 'active'
          };
        }
        return session;
      }));
    }, 2000);

    return () => clearInterval(timer);
  }, [setSessions]);

  const handleInitialize = () => {
    if (!selectedTeacherId || !selectedStudentId) {
      toast.error("Please select both a Teacher and a Student agent");
      return;
    }
    if (selectedTeacherId === selectedStudentId) {
      toast.error("An agent cannot tutor itself in this mode");
      return;
    }

    onStartSession({
      id: `session-${Date.now()}`,
      teacherAgentId: selectedTeacherId,
      studentAgentId: selectedStudentId,
      subject: "Cross-Model Knowledge Distillation",
      status: 'active',
      progress: 0,
      insightsGenerated: 0,
      lastIteration: 0,
      createdAt: Date.now()
    });
    toast.success("Cross-model tutoring loop engaged");
  };

  const handleQuickUpload = () => {
    const name = prompt(`Enter name for new neural prototype:`);
    if (!name) return;
    
    const newModel: CustomModel = {
      id: `model-${Date.now()}`,
      name,
      type: 'LLM',
      format: 'GGUF',
      uploadedAt: Date.now()
    };
    
    setCustomModels([...customModels, newModel]);
    toast.success(`Registered "${name}" to global vault.`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-orange-500" />
          Recursive Tutoring Lab
        </h2>
        <p className="text-zinc-500 text-sm">Empower agents to learn from one another through autonomous feedback loops.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Initialization Panel */}
        <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">Initialize Feedback Loop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Teacher Entity (Expert)</label>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-600 italic">Select source intelligence</span>
                </div>
              </div>
              <ScrollArea className="h-[200px] pr-4 border border-zinc-800 rounded-xl bg-zinc-950 p-2">
                <div className="grid gap-2">
                  <div className="text-[8px] uppercase font-bold text-zinc-600 mb-1 px-1">Neural Agents</div>
                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedTeacherId(agent.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        selectedTeacherId === agent.id ? "bg-orange-500/10 border-orange-500/50 text-orange-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-bold truncate">{agent.name}</span>
                    </button>
                  ))}
                  
                  <div className="text-[8px] uppercase font-bold text-emerald-600 mb-1 mt-4 px-1">Vault Models</div>
                  {customModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedTeacherId(model.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        selectedTeacherId === model.id ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      <BrainCircuit className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-bold truncate">{model.name}</span>
                    </button>
                  ))}
                  
                  {customModels.length === 0 && (
                    <div className="p-4 text-center border border-dashed border-zinc-800 rounded-lg">
                        <p className="text-[8px] text-zinc-700 uppercase">No vault models found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <Button 
                variant="ghost" 
                className="w-full h-8 text-[9px] uppercase font-black text-zinc-600 hover:text-emerald-500 hover:bg-emerald-500/5 border border-dashed border-zinc-800"
                onClick={handleQuickUpload}
              >
                + Register New Model to Vault
              </Button>
            </div>

            <div className="flex justify-center py-0">
                <ArrowRight className="w-5 h-5 text-zinc-700 rotate-90 lg:rotate-0" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Student Entity (Learner)</label>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-600 italic">Target alignment pipeline</span>
                </div>
              </div>
              <ScrollArea className="h-[200px] pr-4 border border-zinc-800 rounded-xl bg-zinc-950 p-2">
                <div className="grid gap-2">
                  <div className="text-[8px] uppercase font-bold text-zinc-600 mb-1 px-1">Neural Agents</div>
                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedStudentId(agent.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        selectedStudentId === agent.id ? "bg-blue-500/10 border-blue-500/50 text-blue-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      <Brain className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-bold truncate">{agent.name}</span>
                    </button>
                  ))}

                  <div className="text-[8px] uppercase font-bold text-emerald-600 mb-1 mt-4 px-1">Vault Models</div>
                  {customModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedStudentId(model.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        selectedStudentId === model.id ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      <Cpu className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-bold truncate">{model.name}</span>
                    </button>
                  ))}
                  
                  {customModels.length === 0 && (
                    <div className="p-4 text-center border border-dashed border-zinc-800 rounded-lg">
                        <p className="text-[8px] text-zinc-700 uppercase">No vault models found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <Button 
                variant="ghost" 
                className="w-full h-8 text-[9px] uppercase font-black text-zinc-600 hover:text-emerald-500 hover:bg-emerald-500/5 border border-dashed border-zinc-800"
                onClick={handleQuickUpload}
              >
                + Distill New Intelligence Source
              </Button>
            </div>

            <Button 
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-11"
                onClick={handleInitialize}
            >
                Engage Tutoring Sequence
            </Button>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Active Distillation Loops</h3>
            <Badge variant="outline" className="border-zinc-800 text-zinc-500">{sessions.length} Loops</Badge>
          </div>

          <ScrollArea className="h-[calc(100vh-22rem)] pr-4">
            <div className="grid gap-4 pb-4">
              {sessions.length === 0 ? (
                <div className="py-20 text-center space-y-4 border border-dashed border-zinc-800 rounded-2xl opacity-30">
                  <Repeat className="w-12 h-12 mx-auto text-zinc-600" />
                  <p className="text-xs uppercase tracking-widest">No active tutoring sessions</p>
                </div>
              ) : (
                sessions.map(session => {
                  const teacher = agents.find(a => a.id === session.teacherAgentId) || customModels.find(m => m.id === session.teacherAgentId);
                  const student = agents.find(a => a.id === session.studentAgentId) || customModels.find(m => m.id === session.studentAgentId);
                  return (
                    <Card key={session.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden relative group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Zap className="w-20 h-20" />
                      </div>
                      <CardHeader className="pb-2">
                         <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-orange-600/10 text-orange-500 border-none text-[9px] uppercase font-black uppercase">Distillation Loop</Badge>
                              <span className="text-[10px] text-zinc-500 font-mono italic">#{session.id.split('-')[1]}</span>
                         </div>
                         <CardTitle className="text-lg flex items-center gap-3">
                            {teacher?.name} <ArrowRight className="w-4 h-4 text-zinc-600" /> {student?.name}
                         </CardTitle>
                         <CardDescription className="text-xs italic serif">{session.subject}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-6">
                          <div className="grid grid-cols-3 gap-4">
                              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                  <div className="text-[9px] uppercase font-bold text-zinc-500 mb-1 flex items-center gap-1">
                                      <Repeat className="w-3 h-3 text-emerald-500" /> Iteration
                                  </div>
                                  <div className="text-lg font-bold text-white tracking-tight">{session.lastIteration}</div>
                              </div>
                              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                  <div className="text-[9px] uppercase font-bold text-zinc-500 mb-1 flex items-center gap-1">
                                      <Target className="w-3 h-3 text-orange-500" /> Insights
                                  </div>
                                  <div className="text-lg font-bold text-white tracking-tight">{session.insightsGenerated}</div>
                              </div>
                              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                  <div className="text-[9px] uppercase font-bold text-zinc-500 mb-1 flex items-center gap-1">
                                      <Zap className="w-3 h-3 text-blue-500" /> Efficiency
                                  </div>
                                  <div className="text-lg font-bold text-white tracking-tight">94.2%</div>
                              </div>
                          </div>

                          <div className="space-y-2">
                              <div className="flex justify-between text-[10px] uppercase font-bold">
                                  <span className="text-zinc-500 italic">Distillation Progress</span>
                                  <span className={session.status === 'completed' ? "text-emerald-500" : "text-orange-500"}>
                                      {session.status === 'completed' ? 'Alignment Complete' : `Synthetic Alignment: ${Math.round(session.progress || 0)}%`}
                                  </span>
                              </div>
                              <Progress 
                                  value={session.progress || 0} 
                                  className="h-1 bg-zinc-800" 
                                  indicatorClassName={session.status === 'completed' ? "bg-emerald-500" : "bg-orange-500"} 
                              />
                          </div>

                          <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-4">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 text-zinc-500 hover:text-white">
                                      <Pause className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest font-bold text-zinc-500 hover:text-white">
                                      <Repeat className="w-3.5 h-3.5 mr-2" /> Resume Loop
                                  </Button>
                              </div>
                              <Button variant="outline" size="sm" className="h-8 border-zinc-800 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800">
                                  Export Knowledge Pack
                              </Button>
                          </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
