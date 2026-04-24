import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Terminal, 
  Play, 
  Square, 
  RotateCw, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Activity, 
  Search, 
  Code, 
  Cpu, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  History,
  Box,
  Network,
  BrainCircuit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { orchestrateAgentResponse } from '../services/geminiService';

interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'code' | 'error' | 'success' | 'fix' | 'thought';
  message: string;
}

interface SwarmViewProps {
  agents: any[];
}

export default function SwarmView({ agents }: SwarmViewProps) {
  const [goal, setGoal] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [activeCode, setActiveCode] = useState('');
  const [iteration, setIteration] = useState(0);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'drafting' | 'executing' | 'debugging' | 'finalizing'>('idle');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [logs]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      message
    }]);
  };

  const executeKernelSnippet = async (code: string) => {
    try {
      const response = await fetch('/api/bastion/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          securityToken: "your-secure-development-token-here" // In production use a real env var or handshake
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || "Kernel communications failure" };
      }

      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleSwarmInitiation = async () => {
    if (!goal.trim() || isExecuting) return;
    
    setIsExecuting(true);
    setLogs([]);
    setIteration(0);
    setProgress(10);
    setStatus('analyzing');
    
    addLog('thought', `Synthesizing neural strategy for objective: "${goal}"`);
    
    let currentCode = '';
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !success) {
      attempts++;
      setIteration(attempts);
      
      // Step 1: Draft or Fix Code
      setStatus(attempts === 1 ? 'drafting' : 'debugging');
      const instruction = attempts === 1 
        ? `Write a Python script to achieve this goal: ${goal}. 
           Output ONLY the Python code inside a single code block. 
           Be concise and technical. Reference high-performance libraries if needed.`
        : `The previous script failed with this error: 
           ${logs[logs.length - 1].message}
           Here was the code:
           ${currentCode}
           Please fix the code and output ONLY the corrected Python script inside a single code block.`;

      try {
        const aiResponse = await orchestrateAgentResponse(
          "You are the Bastion Swarm Controller. Your goal is to write functional, autonomous code loops.",
          [{ role: 'user', parts: [{ text: instruction }] }]
        );

        const codeMatch = aiResponse.text.match(/```(?:python)?([\s\S]*?)```/);
        currentCode = codeMatch ? codeMatch[1].trim() : aiResponse.text.trim();
        setActiveCode(currentCode);
        addLog('code', currentCode);
        setProgress(prev => Math.min(prev + 20, 80));

        // Step 2: Execute
        setStatus('executing');
        addLog('info', `Deploying autonomous kernel sequence (Attempt ${attempts}/${maxAttempts})...`);
        
        const result = await executeKernelSnippet(currentCode);
        
        if (result.status === 'success') {
          addLog('success', `Sequence terminated successfully.\nOutput:\n${result.output}`);
          success = true;
          setStatus('finalizing');
          setProgress(100);
        } else {
          addLog('error', `Kernel fault detected: ${result.error || result.output}`);
          if (attempts >= maxAttempts) {
            addLog('error', "Maximum recursive iterations reached. Halting Swarm state.");
          }
        }
      } catch (err: any) {
        addLog('error', `Orchestrator fault: ${err.message}`);
        break;
      }
    }

    setIsExecuting(false);
    if (!success) setStatus('idle');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Network className="w-8 h-8 text-orange-500" />
          Neural Swarm Controller
        </h2>
        <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest opacity-70 italic serif">Autonomous Multi-Agent Execution Loop</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input & Goal Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-zinc-900 border-zinc-800 border-t-4 border-t-orange-600">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Box className="w-4 h-4 text-orange-500" />
                Target Objective
              </CardTitle>
              <CardDescription className="text-xs">Define the autonomous goal for the swarm cluster.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input 
                  placeholder="e.g., 'Generate 10 synthetic NLP examples and save to local.json'" 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  disabled={isExecuting}
                  className="bg-zinc-950 border-zinc-800 focus:border-orange-500/50"
                />
              </div>
              <Button 
                onClick={handleSwarmInitiation} 
                disabled={isExecuting || !goal.trim()}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-widest text-xs h-10"
              >
                {isExecuting ? (
                  <>
                    <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                    Executing Loop ({iteration})
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Deploy Swarm
                  </>
                )}
              </Button>

              {isExecuting && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-zinc-500">
                    <span>Cluster Sync</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1 bg-zinc-800" indicatorClassName="bg-orange-500" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Kernel Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] uppercase text-zinc-500 font-mono">Sandbox Status</span>
                <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-none">ACTIVE</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] uppercase text-zinc-500 font-mono">RCE Protection</span>
                <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-none">ENFORCED</Badge>
              </div>
              <p className="text-[10px] text-zinc-600 italic">Code is executed in a transient Bastion Kernel environment via Python bridge.</p>
            </CardContent>
          </Card>
        </div>

        {/* Log & Monitor Panel */}
        <div className="lg:col-span-2 flex flex-col min-h-[600px]">
          <Card className="flex-1 bg-zinc-950 border-zinc-800 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-zinc-800 bg-zinc-900/50 py-3 px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-orange-500" />
                  Neural Execution Stream
                </CardTitle>
                <div className="flex items-center gap-2">
                  {status !== 'idle' && (
                    <Badge className="bg-orange-500/10 text-orange-500 border-none animate-pulse text-[10px] uppercase">
                      {status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col min-h-0">
              <ScrollArea className="flex-1 p-6" scrollViewportRef={scrollRef}>
                <div className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center pt-24 text-zinc-700">
                      <Zap className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-xs uppercase font-bold tracking-widest">Waiting for swarm deployment...</p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex gap-4 group">
                        <div className="mt-1">
                          {log.type === 'thought' && <BrainCircuit className="w-4 h-4 text-purple-400" />}
                          {log.type === 'info' && <Search className="w-4 h-4 text-blue-400" />}
                          {log.type === 'code' && <Code className="w-4 h-4 text-zinc-400" />}
                          {log.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                          {log.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {log.type === 'fix' && <RotateCw className="w-4 h-4 text-orange-500" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-[10px] uppercase font-black px-1.5 py-0.5 rounded",
                              log.type === 'thought' ? "text-purple-400 bg-purple-400/10" :
                              log.type === 'code' ? "text-zinc-500 bg-zinc-800" :
                              log.type === 'error' ? "text-rose-500 bg-rose-500/10" :
                              log.type === 'success' ? "text-emerald-500 bg-emerald-500/10" :
                              "text-zinc-600"
                            )}>
                              {log.type}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-700">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          
                          {log.type === 'code' ? (
                            <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 text-xs font-mono overflow-x-auto">
                              <code>{log.message}</code>
                            </pre>
                          ) : (
                            <p className={cn(
                              "text-sm leading-relaxed",
                              log.type === 'error' ? "text-rose-400 font-mono" : 
                              log.type === 'success' ? "text-emerald-400" :
                              log.type === 'thought' ? "text-purple-300 italic" : "text-zinc-400"
                            )}>
                              {log.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {status !== 'idle' && (
                    <div className="flex items-center gap-2 text-orange-500/50 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Awaiting Neural Feedback...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-zinc-500 uppercase">System Ready</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                       <span className="text-zinc-700">KERNEL_PID: {Math.floor(Math.random() * 1000) + 100}</span>
                     </div>
                  </div>
                  <div className="text-zinc-700 italic">Iteration Depth: {iteration}/3</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <RotateCw className={cn("animate-spin", className)} />
  );
}
