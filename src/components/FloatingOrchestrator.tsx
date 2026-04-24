import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Mic, 
  Send, 
  BrainCircuit, 
  ChevronDown,
  Minimize2,
  Maximize2,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { orchestrateAgentResponse } from '../services/aiService';
import { toast } from 'sonner';
import { OrchestratorConfig } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function FloatingOrchestrator({ config }: { config: OrchestratorConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Neural link established via ${config.modelName}. How can I assist with your core objectives today?`, timestamp: Date.now() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages, isOpen]);

  // Handle Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        toast.info(`Transcribed: "${transcript}"`);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error("Speech recognition error.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      toast.info("Listening for voice command...");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageContent = input.trim();
    const userMessage: Message = { role: 'user', content: userMessageContent, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemInstruction = "You are the Bastion Swarm Orchestrator. Respond concisely and technically to user queries while assisting with system management.";
      
      let responseText = "";
      
      if (config.provider === 'local-bastion-core') {
        const res = await orchestrateAgentResponse(
          systemInstruction,
          [{ role: 'user', parts: [{ text: userMessageContent }] }]
        );
        responseText = res.text || "Orchestration synchronized.";
      } else {
        // Use the universal bridge for other providers
        const res = await fetch('/api/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: config.provider,
            config: config,
            payload: {
              contents: [{ role: 'user', parts: [{ text: userMessageContent }] }],
              systemInstruction
            }
          })
        });
        
        if (!res.ok) throw new Error("Bridge connection failure");
        const data = await res.json();
        responseText = data.text || "Neural snapshot received.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: responseText, timestamp: Date.now() }]);
    } catch (error) {
      toast.error("Orchestrator connection lost.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '48px' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "w-80 md:w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto mb-4",
              "ring-1 ring-white/5 backdrop-blur-xl"
            )}
          >
            {/* Header */}
            <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-600/20 flex items-center justify-center">
                  <BrainCircuit className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Neural Hub</span>
                {isLoading && <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />}
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-zinc-500 hover:text-white"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-zinc-500 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 p-4" scrollViewportRef={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex flex-col max-w-[85%]",
                          msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                        <div className={cn(
                          "px-3 py-2 rounded-2xl text-xs",
                          msg.role === 'user' 
                            ? "bg-orange-600 text-white rounded-tr-none" 
                            : "bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-[8px] text-zinc-600 mt-1 uppercase font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-center gap-2 text-zinc-600 px-2 animate-pulse">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] font-mono tracking-widest uppercase">Deciphering...</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-3 bg-zinc-900/50 border-t border-zinc-800 flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleListening}
                    className={cn(
                      "h-9 w-9 rounded-xl shrink-0 transition-all",
                      isListening ? "bg-red-500/10 text-red-500 border border-red-500/20" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    <Mic className={cn("w-4 h-4", isListening && "animate-pulse")} />
                  </Button>
                  <Input 
                    placeholder="Command synchronizer..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="bg-zinc-950 border-zinc-800 text-xs h-9"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-orange-600 hover:bg-orange-500 h-9 w-9 rounded-xl shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shadow-2xl pointer-events-auto transition-all duration-300",
          isOpen ? "bg-zinc-800 rotate-90" : "bg-orange-600 hover:bg-orange-500"
        )}
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-5 h-5 text-white" />
        )}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
