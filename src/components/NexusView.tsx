import React from 'react';
import { Terminal, ExternalLink, RefreshCw, Bot, Code2, Sparkles, Send, PlayCircle, Cpu, Gauge, Activity, ShieldAlert, MonitorCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NexusView() {
  const [key, setKey] = React.useState(0);
  const [isAgentHandling, setIsAgentHandling] = React.useState(false);
  const [agentCommand, setAgentCommand] = React.useState('');
  const [executionLog, setExecutionLog] = React.useState<{type: 'user' | 'agent', msg: string}[]>([]);
  const [code, setCode] = React.useState('import os\nprint(f"Current Directory: {os.getcwd()}")\n\n# Neural Network simulation\nimport random\nweights = [random.random() for _ in range(5)]\nprint(f"Initial Neural Weights: {weights}")');
  const [output, setOutput] = React.useState('');
  const [isExecuting, setIsExecuting] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [executionLog]);

  const handleRunCode = async () => {
    setIsExecuting(true);
    setOutput('> Initializing sequence...\n');
    try {
      const response = await fetch('/api/nexus/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setOutput(data.output);
        toast.success("Kernel operation successful");
      } else {
        setOutput(`Error: ${data.error || 'Unknown failure'}\nExit Code: ${data.exitCode}`);
        toast.error("Execution failure");
      }
    } catch (error) {
      toast.error("Kernel bridge fault");
      setOutput('> System crash: Connection refused');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAgentExecute = async () => {
    if (!agentCommand.trim()) return;
    
    setIsAgentHandling(true);
    const userCmd = agentCommand;
    setExecutionLog(prev => [...prev, { type: 'user', msg: userCmd }]);
    setAgentCommand('');
    
    try {
      // For agents, we wrap their command in a print statement if it's just an expression
      const wrappedCode = userCmd.includes('print') || userCmd.includes('=') ? userCmd : `print(${userCmd})`;
      
      const response = await fetch('/api/nexus/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: wrappedCode })
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setExecutionLog(prev => [...prev, { type: 'agent', msg: data.output }]);
      } else {
        setExecutionLog(prev => [...prev, { type: 'agent', msg: `Error: ${data.error || 'Hardware fault'}` }]);
      }
      toast.success("Agent sequence complete");
    } catch (error) {
      toast.error("Bridge connection failed");
    } finally {
      setIsAgentHandling(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] space-y-4">
      <HardwareHUD />
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Terminal className="w-6 h-6 text-orange-500" />
            Nexus Neural Environment
          </h2>
          <p className="text-zinc-500 text-sm">Direct kernel access for neural prototyping and DPO alignment.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold h-9 px-6"
            onClick={handleRunCode}
            disabled={isExecuting}
          >
            {isExecuting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
            EXECUTE SEQUENCE
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col gap-4">
          {/* Custom Neural Editor */}
          <Card className="flex-1 bg-zinc-950 border-zinc-800 flex flex-col overflow-hidden">
            <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">nexus_kernel.py</span>
              </div>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30 text-[9px]">v4.2.0-STABLE</Badge>
            </div>
            <textarea 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-6 bg-transparent text-zinc-200 font-mono text-sm resize-none focus:outline-none custom-scrollbar leading-relaxed"
              spellCheck={false}
              placeholder="# Enter neural logic here..."
            />
          </Card>

          {/* Terminal Output */}
          <Card className="h-48 bg-black border-zinc-800 flex flex-col overflow-hidden">
            <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 py-1.5 flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Neural Terminal Output</span>
            </div>
            <ScrollArea className="flex-1 p-4">
              <pre className="text-emerald-500 font-mono text-[11px] whitespace-pre-wrap leading-tight">
                {output || '> Awaiting neural sequence execution...'}
              </pre>
            </ScrollArea>
          </Card>
        </div>

        {/* AI Agent Controller Side Panel */}
        <Card className="w-80 bg-zinc-900 border-zinc-800 flex flex-col">
          <CardHeader className="border-b border-zinc-800 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-widest text-orange-500 font-black flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Nexus Agent Core
              </CardTitle>
              <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5">Active</Badge>
            </div>
            <CardDescription className="text-[10px]">Delegate kernel operations to autonomous agents.</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
            <ScrollArea className="flex-1 -mx-2 px-2" scrollViewportRef={scrollRef}>
              <div className="space-y-3">
                {executionLog.length === 0 ? (
                  <div className="py-12 text-center space-y-2 opacity-30">
                    <Code2 className="w-8 h-8 mx-auto text-zinc-600" />
                    <p className="text-[10px] uppercase tracking-tighter">No active sequences</p>
                  </div>
                ) : (
                  executionLog.map((log, i) => (
                    <div key={i} className={cn(
                      "p-2.5 rounded-lg text-[11px] leading-relaxed",
                      log.type === 'user' ? "bg-zinc-800 border border-zinc-700 text-zinc-300" : "bg-orange-500/5 border border-orange-500/10 text-orange-200"
                    )}>
                      <div className="flex items-center gap-2 mb-1 uppercase text-[9px] font-bold opacity-50">
                        {log.type === 'user' ? <Sparkles className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        {log.type}
                      </div>
                      {log.msg}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="space-y-2">
              <div className="relative">
                <Input 
                  placeholder="Ask agent to execute code..."
                  value={agentCommand}
                  onChange={(e) => setAgentCommand(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 py-5 pr-10 text-xs focus:ring-orange-500/30"
                  disabled={isAgentHandling}
                  onKeyDown={(e) => e.key === 'Enter' && handleAgentExecute()}
                />
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-orange-500 hover:bg-orange-500/10"
                  onClick={handleAgentExecute}
                  disabled={isAgentHandling}
                >
                  {isAgentHandling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase font-bold tracking-widest px-1">
                <span>Kernel: Python 3 (ipykernel)</span>
                <span className="flex items-center gap-1">
                  <PlayCircle className="w-3 h-3 text-emerald-500" />
                  Connected
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 flex gap-3 text-xs text-orange-500/80">
        <Terminal className="w-4 h-4 flex-shrink-0" />
        Note: The Nexus environment is proxied through the main cluster gateway. Sequence agents can access all variables in the active Jupyter session.
      </div>
    </div>
  );
}

function HardwareHUD() {
  const [metrics, setMetrics] = React.useState<any>(null);
  const [status, setStatus] = React.useState<'disconnected' | 'connected'>('disconnected');

  React.useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}`);

    socket.onopen = () => setStatus('connected');
    socket.onclose = () => setStatus('disconnected');
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMetrics(data);
      } catch (e) {
        // ignore malformed metrics
      }
    };

    return () => socket.close();
  }, []);

  if (!metrics) {
    return (
      <div className="fixed bottom-8 left-8 z-[100] bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
        <Activity className="w-4 h-4 text-zinc-600 animate-pulse" />
        <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Waiting for hardware link...</span>
      </div>
    );
  }

  const isWarning = metrics.npu > 85;

  return (
    <div className={cn(
      "fixed bottom-8 left-8 z-[100] w-72 bg-zinc-950/90 backdrop-blur-md border rounded-2xl shadow-2xl p-4 space-y-4 animate-in slide-in-from-left-4 fade-in duration-500",
      isWarning ? "border-orange-500/50 shadow-orange-500/5" : "border-zinc-800"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MonitorCheck className={cn("w-4 h-4", status === 'connected' ? "text-emerald-500" : "text-zinc-600")} />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Hardware HUD</span>
        </div>
        <Badge variant="outline" className={cn(
          "text-[8px] h-3.5 border-none",
          isWarning ? "bg-orange-500/20 text-orange-400 animate-pulse" : "bg-zinc-800 text-zinc-500"
        )}>
          {isWarning ? 'THERMAL WARNING' : 'NOMINAL'}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* CPU */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[9px] font-mono">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Cpu className="w-3 h-3" />
              CPU LOAD
            </div>
            <span className="text-zinc-300 font-bold">{metrics.cpu}%</span>
          </div>
          <Progress value={metrics.cpu} className="h-1 bg-zinc-800" indicatorClassName="bg-zinc-400" />
        </div>

        {/* RAM */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[9px] font-mono">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Activity className="w-3 h-3" />
              SYSTEM RAM
            </div>
            <span className="text-zinc-300 font-bold">{metrics.ram} GB</span>
          </div>
          <Progress value={(metrics.ram / 16) * 100} className="h-1 bg-zinc-800" indicatorClassName="bg-blue-500" />
        </div>

        {/* NPU (QNN) */}
        <div className="space-y-1.5 pt-1 border-t border-zinc-800/50">
          <div className="flex justify-between text-[9px] font-mono">
            <div className="flex items-center gap-1.5 text-orange-500 font-bold">
              <Gauge className="w-3 h-3" />
              QNN NPU (EP)
            </div>
            <span className={cn("font-bold", isWarning ? "text-orange-500" : "text-white")}>{metrics.npu}%</span>
          </div>
          <Progress 
            value={metrics.npu} 
            className="h-1.5 bg-zinc-800" 
            indicatorClassName={cn("transition-all duration-500", isWarning ? "bg-orange-500" : "bg-emerald-500")} 
          />
          <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase">
             <span>Thermal: {metrics.npu_temp}°C</span>
             <span>EP: ONNX_RUNTIME_QNN</span>
          </div>
        </div>
      </div>

      {isWarning && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 flex gap-2">
          <ShieldAlert className="w-3 h-3 text-orange-500 flex-shrink-0" />
          <p className="text-[9px] text-orange-200/80 leading-tight font-medium">
            Critical NPU load detected. High risk of OOM crash. Reduce batch size in jax_training.py.
          </p>
        </div>
      )}
    </div>
  );
}
