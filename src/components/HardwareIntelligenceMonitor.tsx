import React from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Gauge, 
  Activity, 
  MonitorCheck,
  ShieldAlert,
  Thermometer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function HardwareIntelligenceMonitor() {
  const [metrics, setMetrics] = React.useState<any>(null);
  const [status, setStatus] = React.useState<'disconnected' | 'connected'>('disconnected');
  const [isOpen, setIsOpen] = React.useState(false);

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

  const isWarning = metrics?.npu > 85;

  return (
    <div className="w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-2 rounded-lg transition-all border",
          isOpen ? "bg-zinc-800 border-zinc-700" : "bg-zinc-900/50 border-transparent hover:bg-zinc-800"
        )}
      >
        <div className="flex items-center gap-2">
          <MonitorCheck className={cn(
            "w-4 h-4", 
            status === 'connected' ? "text-emerald-500" : "text-zinc-600"
          )} />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Hardware HW</span>
        </div>
        <div className="flex items-center gap-2">
          {isWarning && <ShieldAlert className="w-3 h-3 text-orange-500 animate-pulse" />}
          {isOpen ? <ChevronUp className="w-3 h-3 text-zinc-500" /> : <ChevronDown className="w-3 h-3 text-zinc-500" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {!metrics ? (
            <div className="flex items-center gap-2 py-2">
              <Activity className="w-3 h-3 text-zinc-600 animate-pulse" />
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Initializing Link...</span>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-mono">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Cpu className="w-3 h-3" />
                    CPU LOAD
                  </div>
                  <span className="text-zinc-300">{metrics.cpu}%</span>
                </div>
                <Progress value={metrics.cpu} className="h-0.5 bg-zinc-800" indicatorClassName="bg-zinc-400" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-mono">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Activity className="w-3 h-3" />
                    RAM
                  </div>
                  <span className="text-zinc-300">{metrics.ram} GB</span>
                </div>
                <Progress value={(metrics.ram / 16) * 100} className="h-0.5 bg-zinc-800" indicatorClassName="bg-blue-500" />
              </div>

              <div className="space-y-1.5 pt-1 border-t border-zinc-800/50">
                <div className="flex justify-between text-[8px] font-mono">
                  <div className="flex items-center gap-1.5 text-orange-500 font-bold">
                    <Gauge className="w-3 h-3" />
                    NPU
                  </div>
                  <span className={cn("font-bold", isWarning ? "text-orange-500" : "text-white")}>{metrics.npu}%</span>
                </div>
                <Progress 
                  value={metrics.npu} 
                  className="h-1 bg-zinc-800" 
                  indicatorClassName={cn("transition-all duration-500", isWarning ? "bg-orange-500" : "bg-emerald-500")} 
                />
                <div className="flex justify-between text-[7px] font-mono text-zinc-600 uppercase">
                   <span>Temp: {metrics.npu_temp}°C</span>
                   <span>EP: QNN</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
