import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  RotateCcw, 
  Terminal,
  Zap,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentConfig } from '../types';
import { simulateAgentResponse } from '../services/aiService';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SimulatorProps {
  agent: AgentConfig;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isError?: boolean;
  logs?: string[];
}

export default function Simulator({ agent }: SimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Prepare history for local core
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    const response = await simulateAgentResponse(agent, input, history);

    const modelMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: response.text,
      timestamp: Date.now(),
      isError: !response.success,
      logs: response.logs
    };

    setMessages(prev => [...prev, modelMessage]);
    setIsLoading(false);
  };

  const reset = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-500 flex items-center justify-center">
            <Zap className="w-5 h-5 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Simulation Environment
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 opacity-50 border-orange-500/30 text-orange-500">Live</Badge>
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono italic serif">Running: {agent.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100" onClick={reset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Message List */}
      <ScrollArea scrollViewportRef={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-30 mt-12">
              <Terminal className="w-12 h-12 text-zinc-700" />
              <div className="space-y-1">
                <p className="text-zinc-400 font-medium tracking-tight">Neural Sandbox Ready</p>
                <p className="text-xs text-zinc-600 leading-relaxed max-w-[200px] mx-auto">System instructions and modules loaded. Initializing personality protocols...</p>
              </div>
              <Button variant="outline" size="sm" className="mt-4 border-zinc-800 hover:border-zinc-700 rounded-full" onClick={() => setInput("Hello, status check.")}>
                Quick Start test prompt
              </Button>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  message.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-sm",
                  message.role === 'model' ? "bg-zinc-900 border border-zinc-800 text-orange-500" : "bg-zinc-800 text-zinc-400"
                )}>
                  {message.role === 'model' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "p-3.5 rounded-2xl text-sm leading-relaxed",
                  message.role === 'user' 
                    ? "bg-orange-600 text-white rounded-tr-none shadow-lg shadow-orange-900/20" 
                    : message.isError 
                      ? "bg-rose-950/50 border border-rose-500/50 text-rose-200 rounded-tl-none"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-sm"
                )}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.logs && (
                    <div className="mt-3 pt-3 border-t border-rose-500/30 font-mono text-[10px] space-y-1 opacity-80">
                      <div className="flex items-center gap-2 mb-1 text-rose-400 font-bold uppercase tracking-widest text-[9px]">
                        <Terminal className="w-3 h-3" />
                        Error Logs
                      </div>
                      {message.logs.map((log, i) => (
                        <div key={i} className="leading-tight">{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 mb-2"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-orange-500 flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <span className="text-[10px] text-zinc-500 font-mono italic animate-pulse">Synthesizing response...</span>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-zinc-900/30 border-t border-zinc-800 bg-gradient-to-t from-zinc-950 to-transparent">
        <div className="relative group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Interact with simulated agent..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-orange-500/50 transition-all text-zinc-200 placeholder:text-zinc-600 shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1.25 p-2 rounded-lg text-zinc-600 hover:text-orange-500 disabled:opacity-30 transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
