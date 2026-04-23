import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Terminal, 
  Loader2, 
  BrainCircuit, 
  Shield, 
  PlayCircle,
  MessageSquare,
  X,
  Cpu
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AgentConfig, AgentModule, TrainingJob, OrchestratorConfig } from '../types';

import { orchestrateAgentResponse } from '../services/geminiService';

interface UniversalOrchestratorProps {
  agents: AgentConfig[];
  orchestratorConfig: OrchestratorConfig;
  onUpdateAgent: (agentId: string, updates: Partial<AgentConfig>) => void;
  onStartTraining: (agentId: string, config: any) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  isAction?: boolean;
}

export function UniversalOrchestrator({ agents, orchestratorConfig, onUpdateAgent, onStartTraining }: UniversalOrchestratorProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Neural Bastion active. Routing through ${orchestratorConfig.provider === 'gemini' ? 'Gemini Cluster' : orchestratorConfig.modelName}. I am your unified neural architect.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const systemInstruction = `You are the Bastion Architect, a specialized AI for building autonomous agents.
      Provider: ${orchestratorConfig.provider}
      Active Model: ${orchestratorConfig.modelName}
      
      Current Workspace State: ${JSON.stringify(agents.map(a => ({ name: a.name, modules: a.modules.map(m => m.name) })))}`;

      const tools = [
        {
          functionDeclarations: [
            {
              name: "initiateNeuralTraining",
              description: "Triggers a training sequence",
              parameters: {
                type: "OBJECT",
                properties: {
                  agentId: { type: "STRING" }
                },
                required: ["agentId"]
              }
            }
          ]
        }
      ];

      if (orchestratorConfig.provider === 'gemini') {
        const contents = [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMessage }] }
        ];

        const data = await orchestrateAgentResponse(systemInstruction, contents, tools);
        
        const text = data.text || "Neural logic synchronized.";
        setMessages(prev => [...prev, { role: 'model', text }]);

        if (data.functionCalls) {
          for (const call of data.functionCalls) {
            if (call.name === 'initiateNeuralTraining') {
              const { agentId } = call.args as any;
              onStartTraining(agentId, {});
              setMessages(prev => [...prev, { 
                role: 'model', 
                text: `Neural Training Initiated.`,
                isAction: true 
              }]);
            }
          }
        }
      } else {
        const response = await fetch('/api/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: orchestratorConfig.provider,
            config: orchestratorConfig,
            payload: {
              contents: [
                ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
                { role: 'user', parts: [{ text: userMessage }] }
              ],
              systemInstruction,
              tools
            }
          })
        });

        if (!response.ok) throw new Error('Orchestrator bridge failed');
        const data = await response.json();

        const text = data.text || "Neural logic synchronized.";
        setMessages(prev => [...prev, { role: 'model', text }]);
      }

    } catch (error) {
      console.error(error);
      toast.error("Orchestrator Bridge Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-zinc-900 border-zinc-800 overflow-hidden">
      <CardHeader className="border-b border-zinc-800 bg-zinc-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
              orchestratorConfig.provider === 'gemini' ? "bg-orange-600/10 text-orange-500 border-orange-500/20" : "bg-emerald-600/10 text-emerald-500 border-emerald-500/20"
            )}>
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{orchestratorConfig.provider === 'gemini' ? 'Gemini Orchestrator' : 'Proprietary Brain'}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest font-bold opacity-50">{orchestratorConfig.modelName}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-500 bg-orange-500/5 px-2">
              {orchestratorConfig.provider.replace('-', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-6" scrollViewportRef={scrollRef}>
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                  msg.role === 'user' ? "bg-zinc-800 border-zinc-700" : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "space-y-2",
                  msg.role === 'user' ? "text-right" : ""
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === 'user' 
                      ? "bg-orange-600 text-white" 
                      : msg.isAction 
                        ? "bg-zinc-800/80 border border-emerald-500/30 text-emerald-400 font-mono italic"
                        : "bg-zinc-800 text-zinc-200"
                  )}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/20">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center gap-2"
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Synthesize new neural architecture..."
              className="bg-zinc-900 border-zinc-700 h-11 pr-11 focus:border-orange-500/50 transition-all"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 h-8 w-8 bg-orange-600 hover:bg-orange-500 text-white"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
