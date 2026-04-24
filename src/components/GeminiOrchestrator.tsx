import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Terminal, 
  Loader2, 
  BrainCircuit, 
  Settings, 
  PlayCircle,
  MessageSquare,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AgentConfig, AgentModule, TrainingJob } from '../types';

import { orchestrateAgentResponse } from '../services/geminiService';

interface GeminiOrchestratorProps {
  agents: AgentConfig[];
  onUpdateAgent: (agentId: string, updates: Partial<AgentConfig>) => void;
  onStartTraining: (agentId: string, config: any) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  isAction?: boolean;
}

export function GeminiOrchestrator({ agents, onUpdateAgent, onStartTraining }: GeminiOrchestratorProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Systems online. I am the Bastion Architect. I can help you design neural pipelines, configure specific module parameters, and optimize your agent's execution flow. What are we building today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const systemInstruction = `You are the Bastion Architect, a specialized AI for building autonomous agents and neural networks from scratch in the Bastion Agent Training Lab.
      Your expertise lies in designing "neural pipelines" (sequences of modules) across various frameworks (JAX, Python, PyTorch) to solve complex tasks.
      
      Core Capabilities:
      1. Architecture Design: Suggest modules for specific user goals. 
         - Frameworks: JAX Accelerator, PyTorch Core.
         - Neural Layers: Dense, Conv2D, Multi-Head Attention.
         - Actions: Web Search, Code Runner. 
         - Generative: Stable Diffusion (Images), Whisper STT (Audio-to-Text), ElevenLabs TTS (Text-to-Speech).
         - Logic: Semantic Memory, Episodic Store, Sentiment Filter, Auto-Summarize.
         - Optimization: INT8 Quantization, Neural Pruning, Knowledge Distillation.
         - Outputs: Webhook Output, Neural Exporter (JSONL).
      2. Parameter Configuration: Recommend values for module configs.
      3. Logic Flow & Optimization: Explain how data moves from triggers to outputs.
      
      Module Context:
      - Triggers: Input sources.
      - Actions: Computing hubs.
      - Logic: Processing & Memory nodes.
      - Optimization: Compression & Speed.
      - Outputs: Data delivery nodes.
      
      Current Workspace State: ${JSON.stringify(agents.map(a => ({ id: a.id, name: a.name, modules: (a.modules || []).map(m => ({ name: m.name, config: m.config })) })))}
      
      Maintain a technical, professional Architect persona. Use bold text for module names.`;

      const tools = [
        {
          functionDeclarations: [
            {
              name: "recommendArchitecture",
              description: "Suggests a list of modules for an agent based on a goal",
              parameters: {
                type: "OBJECT",
                properties: {
                  goal: { type: "STRING" },
                  modules: { 
                    type: "ARRAY", 
                    items: { 
                      type: "OBJECT",
                      properties: {
                        name: { type: "STRING" },
                        type: { type: "STRING", enum: ['trigger', 'action', 'logic', 'output'] },
                        description: { type: "STRING" }
                      }
                    }
                  }
                },
                required: ["goal", "modules"]
              }
            },
            {
              name: "initiateNeuralTraining",
              description: "Triggers a training sequence for a specific agent",
              parameters: {
                type: "OBJECT",
                properties: {
                  agentId: { type: "STRING" },
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      epochs: { type: "NUMBER" },
                      learningRate: { type: "NUMBER" },
                      optimizationGoal: { type: "STRING" }
                    }
                  }
                },
                required: ["agentId", "parameters"]
              }
            }
          ]
        }
      ];

      const contents = [
        ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const data = await orchestrateAgentResponse(systemInstruction, contents, tools);

      const text = data.text || "I've processed your request.";
      setMessages(prev => [...prev, { role: 'model', text }]);

      if (data.functionCalls) {
        for (const call of data.functionCalls) {
          if (call.name === 'initiateNeuralTraining') {
            const { agentId, parameters } = call.args as any;
            onStartTraining(agentId, parameters);
            setMessages(prev => [...prev, { 
              role: 'model', 
              text: `Neural Training Sequence Initiated for Agent ${agentId}. (Epochs: ${parameters.epochs}, Bias: ${parameters.learningRate})`,
              isAction: true 
            }]);
          }
          if (call.name === 'recommendArchitecture') {
             setMessages(prev => [...prev, { 
              role: 'model', 
              text: "Architecture Proposal Generated. Review the components in the Builder tab.",
              isAction: true 
            }]);
            toast.info("Proposed architecture received from Gemini");
          }
        }
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to connect to Neural Orchestrator");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-zinc-900 border-zinc-800 overflow-hidden">
      <CardHeader className="border-b border-zinc-800 bg-zinc-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Gemini Orchestrator</CardTitle>
              <CardDescription className="text-xs">Neural Network Synthesis & Training Commander</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5 px-2">
            AI AGENT ACTIVE
          </Badge>
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
                    "p-4 rounded-2xl text-sm leading-relaxed",
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
            {isLoading && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center animate-spin">
                  <Loader2 className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-800 text-zinc-400 text-sm italic">
                  Synthesizing neural pathways...
                </div>
              </div>
            )}
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
              placeholder="Architect a medical diagnostic agent..."
              className="bg-zinc-900 border-zinc-700 h-12 pr-12 focus:border-orange-500/50 transition-all"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 h-9 w-9 bg-orange-600 hover:bg-orange-500 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="flex items-center gap-4 mt-3 px-1">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <Terminal className="w-3 h-3" />
              Direct Command Mode
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <Sparkles className="w-3 h-3" />
              Auto-Architecture
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
