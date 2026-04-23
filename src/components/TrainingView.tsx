import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Play, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Settings2,
  TrendingDown,
  TrendingUp,
  Target,
  BarChart,
  Plus,
  Download,
  Terminal as TerminalIcon,
  Cpu,
  Zap,
  Thermometer,
  Gauge,
  Database,
  FlaskConical,
  Wand2,
  BriefcaseMedical,
  Gamepad2,
  Braces,
  GitBranch,
  Layers,
  Search,
  MessageSquareCode,
  ShieldCheck,
  ChevronDown,
  Archive,
  Boxes,
  Calculator
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Sword, 
  History, 
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { TrainingJob, TrainingMethodology, AgentConfig, TrainingMetric, GPUType } from '../types';
import { toast } from 'sonner';

import { generateArenaResponses, orchestrateAgentResponse, generateSyntheticData } from '../services/geminiService';

interface TrainingViewProps {
  agents: AgentConfig[];
  jobs: TrainingJob[];
  setJobs: React.Dispatch<React.SetStateAction<TrainingJob[]>>;
}

export default function TrainingView({ agents, jobs, setJobs }: TrainingViewProps) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [metricsViewMode, setMetricsViewMode] = useState<'steps' | 'epochs'>('steps');
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [dataGenProgress, setDataGenProgress] = useState(0);
  const [dataGenType, setDataGenType] = useState('healthcare');
  const [dataGenLabel, setDataGenLabel] = useState('Healthcare / Clinical');
  const [syntheticDatasets, setSyntheticDatasets] = useState<Record<string, any[]>>({});

  const DOMAIN_GROUPS = [
    {
      id: "industrial",
      name: "Sector Verticals (Industrial)",
      icon: <Boxes className="w-4 h-4 text-orange-500" />,
      items: [
        { id: 'healthcare', label: 'Healthcare / Clinical', icon: <BriefcaseMedical className="w-3 h-3 text-red-500" />, description: 'Medical diagnosis, treatment planning, and pharmaceutical data.' },
        { id: 'ai_theory', label: 'Software / AI Theory', icon: <Braces className="w-3 h-3 text-blue-500" />, description: 'Algorithm optimization, system architecture, and machine learning principles.' },
        { id: 'gamedev', label: 'Game Development', icon: <Gamepad2 className="w-3 h-3 text-purple-500" />, description: 'Shaders, procedural generation, and physics engine logic.' },
        { id: 'fintech', label: 'Financial Technology', icon: <TrendingUp className="w-3 h-3 text-emerald-500" />, description: 'Quantitative analysis, high-frequency trading, and risk modelling.' },
      ]
    },
    {
      id: "reasoning",
      name: "Cognitive Intelligence (Industrial Reasoning)",
      icon: <BrainCircuit className="w-4 h-4 text-blue-400" />,
      items: [
        { id: 'cot', label: 'CHAIN-OF-THOUGHT MODE', icon: <Layers className="w-3 h-3 text-blue-400" />, description: 'Decompose the problem into explicit logical steps. Validate each step before proceeding.' },
        { id: 'thinking', label: 'EXTENDED THINKING MODE', icon: <Search className="w-3 h-3 text-purple-400" />, description: 'Allocate additional inference cycles. Supports QUICK, STANDARD, DEEP, and RESEARCH levels.' },
        { id: 'reflection', label: 'SELF-REFLECTION LOOP', icon: <ShieldCheck className="w-3 h-3 text-emerald-400" />, description: 'Internal critique pass for consistency, accuracy, and intent alignment.' },
        { id: 'tot', label: 'TREE-OF-THOUGHT BRANCHING', icon: <GitBranch className="w-3 h-3 text-orange-400" />, description: 'Parallel solution branches with scoring and optimal path selection.' },
        { id: 'planning', label: 'PLANNING ENGINE', icon: <Target className="w-3 h-3 text-red-400" />, description: 'Structured execution plan with mapping and estimated difficulty.' },
        { id: 'signatures', label: 'THOUGHT SIGNATURES', icon: <MessageSquareCode className="w-3 h-3 text-cyan-400" />, description: 'Persistent reasoning state anchoring logically across long tool-use sessions.' },
        { id: 'adaptive', label: 'ADAPTIVE DEPTH', icon: <Zap className="w-3 h-3 text-yellow-400" />, description: 'Automatically calibrate reasoning effort to match task complexity.' },
      ]
    },
    {
      id: "scratch",
      name: "Basal Intelligence (Scratch Foundation)",
      icon: <Calculator className="w-4 h-4 text-emerald-500" />,
      items: [
        { id: 'numpy_scratch', label: 'NUMPY ARRAY OPS', icon: <Boxes className="w-3 h-3 text-emerald-500" />, description: 'Teach fundamental matrix multiplications and array manipulation logic.' },
        { id: 'backprop', label: 'MANUAL BACKPROPAGATION', icon: <Zap className="w-3 h-3 text-yellow-500" />, description: 'Implement raw gradient descent logic from scratch without frameworks.' },
        { id: 'linear_algebra', label: 'LINEAR ALGEBRA BASICS', icon: <Layers className="w-3 h-3 text-blue-500" />, description: 'Foundational mathematics for neural spatial relationships.' },
        { id: 'initialization', label: 'WEIGHT INITIALIZATION', icon: <Sparkles className="w-3 h-3 text-orange-500" />, description: 'Optimizing starting states for neural convergence.' },
      ]
    }
  ];

  const startDataGeneration = async () => {
    setIsGeneratingData(true);
    setDataGenProgress(0);

    const targetSamples = 10;
    const newSamples = [];

    try {
      for (let i = 0; i < targetSamples; i++) {
        const itemDescription = DOMAIN_GROUPS.flatMap(g => g.items).find(item => item.id === dataGenType)?.description || '';
        const promptDomain = `${dataGenLabel} (${itemDescription})`;
        const parsed = await generateSyntheticData(promptDomain);
        
        newSamples.push({
          id: `sample-${Date.now()}-${i}`,
          domain: dataGenType,
          input: parsed.input,
          output: parsed.output,
          reasoning: parsed.reasoning,
          confidence: 0.99,
          timestamp: new Date().toISOString()
        });

        setDataGenProgress(Math.round(((i + 1) / targetSamples) * 100));
      }

      setSyntheticDatasets(prev => ({
        ...prev,
        [dataGenType]: [...(prev[dataGenType] || []), ...newSamples]
      }));

      toast.success(`Synthetic ${dataGenLabel} dataset forged using real AI models.`);

    } catch (error) {
      console.error("Data Forge Error:", error);
      toast.error("Dataset synthesis failed. Check orchestrator connection.");
    } finally {
      setIsGeneratingData(false);
      setDataGenProgress(100);
    }
  };

  const exportToJsonl = (type: string) => {
    const data = syntheticDatasets[type];
    if (!data || data.length === 0) {
      toast.error("No data available to export. Forge a dataset first.");
      return;
    }

    const jsonlContent = data.map(item => JSON.stringify(item)).join('\n');
    const blob = new Blob([jsonlContent], { type: 'application/x-jsonlines;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `synthetic_${type}_dataset.jsonl`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${type.toUpperCase()} dataset exported as JSONL.`);
  };

  const exportMetrics = (job: TrainingJob) => {
    const headers = ['step', 'epoch', 'loss', 'reward', 'accuracy', 'vramUsage', 'gpuTemp', 'gpuPower', 'timestamp'];
    const csvContent = [
      headers.join(','),
      ...job.metrics.map(m => [
        m.step,
        m.epoch,
        m.loss || '0',
        m.reward || '0',
        m.accuracy || '0',
        m.vramUsage || '0',
        m.gpuTemp || '0',
        m.gpuPower || '0',
        new Date(m.timestamp).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `metrics_${job.agentName}_${job.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Metrics exported successfully");
  };

  const activeJob = jobs.find(j => j.id === activeJobId);

  // Arena State
  const [arenaTriggers, setArenaTriggers] = useState<any[]>([]);
  const [selectedTrigger, setSelectedTrigger] = useState<any | null>(null);
  const [arenaResponses, setArenaResponses] = useState<any[]>([]);
  const [isArenaLoading, setIsArenaLoading] = useState(false);
  const [arenaHistory, setArenaHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/arena/triggers')
      .then(res => res.json())
      .then(data => setArenaTriggers(data))
      .catch(err => console.error("Arena triggers load error", err));
  }, []);

  const runArenaFight = async (trigger: any) => {
    setSelectedTrigger(trigger);
    setArenaResponses([]);
    setIsArenaLoading(true);
    try {
      const data = await generateArenaResponses(trigger.input);
      setArenaResponses(data.responses);
    } catch (e) {
      toast.error("Daedalus failed to respond in time.");
    } finally {
      setIsArenaLoading(false);
    }
  };

  const submitPreference = async (responseId: string) => {
    if (!selectedTrigger) return;
    
    const preferredResponse = arenaResponses.find(r => r.id === responseId);
    
    try {
      await fetch('/api/arena/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerId: selectedTrigger.id,
          preferredResponseId: responseId,
          data: {
            input: selectedTrigger.input,
            output: preferredResponse.text,
            responses: arenaResponses
          }
        })
      });
      
      toast.success("Reward model update queued via preference JSONL.");
      setArenaHistory(prev => [{
        trigger: selectedTrigger,
        selected: responseId,
        timestamp: Date.now()
      }, ...prev]);
      
      // Clean up for next
      setSelectedTrigger(null);
      setArenaResponses([]);
    } catch (e) {
      toast.error("Failed to sync preference with Bastion.");
    }
  };

  const getEpochMetrics = (metrics: TrainingMetric[]) => {
    const epochMap = new Map<number, { loss: number[], accuracy: number[], reward: number[], count: number }>();
    metrics.forEach(m => {
      if (!epochMap.has(m.epoch)) {
        epochMap.set(m.epoch, { loss: [], accuracy: [], reward: [], count: 0 });
      }
      const data = epochMap.get(m.epoch)!;
      if (m.loss !== undefined) data.loss.push(m.loss);
      if (m.accuracy !== undefined) data.accuracy.push(m.accuracy);
      if (m.reward !== undefined) data.reward.push(m.reward);
      data.count++;
    });

    return Array.from(epochMap.entries()).map(([epoch, data]) => ({
      step: epoch, // Use epoch as step for chart consistency
      epoch,
      loss: data.loss.length ? data.loss.reduce((a, b) => a + b, 0) / data.loss.length : 0,
      accuracy: data.accuracy.length ? data.accuracy.reduce((a, b) => a + b, 0) / data.accuracy.length : 0,
      reward: data.reward.length ? data.reward.reduce((a, b) => a + b, 0) / data.reward.length : 0,
      timestamp: Date.now()
    } as TrainingMetric));
  };

  const epochMetrics = activeJob ? getEpochMetrics(activeJob.metrics) : [];

  useEffect(() => {
    const timer = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.status === 'training' && job.progress < 100) {
          const nextProgress = Math.min(100, job.progress + 1);
          const nextStep = job.metrics.length + 1;
          const lastMetric = job.metrics[job.metrics.length - 1];
          const totalStepsPerEpoch = 50; 
          const totalEpochs = job.config.epochs || 1;
          const totalSteps = totalEpochs * totalStepsPerEpoch;
          const currentEpoch = Math.floor(nextStep / totalStepsPerEpoch) + 1;
          const stepsInCurrentEpoch = nextStep % totalStepsPerEpoch;
          const gpuStats = getGpuSimulationValues(job.config.gpuType as GPUType);
          
          let nextMetric: TrainingMetric;
          if (job.methodology === 'SFT') {
            nextMetric = {
              step: nextStep,
              epoch: currentEpoch,
              loss: Math.max(0.01, (lastMetric?.loss || 1) * (0.95 + Math.random() * 0.08)),
              accuracy: Math.min(0.99, (lastMetric?.accuracy || 0.5) + Math.random() * 0.02),
              vramUsage: gpuStats.vram + (Math.random() * 2),
              gpuTemp: gpuStats.temp + (Math.random() * 5),
              gpuPower: gpuStats.power + (Math.random() * 20),
              gpuUtilization: Math.min(100, Math.max(70, gpuStats.utilization + (Math.random() * 10 - 5))),
              npuLoad: Math.min(100, Math.random() * 95),
              npuTemp: 45 + Math.random() * 15,
              timestamp: Date.now()
            };
          } else {
            nextMetric = {
              step: nextStep,
              epoch: currentEpoch,
              reward: (lastMetric?.reward || -50) + (Math.random() * 10 - 2),
              vramUsage: gpuStats.vram + (Math.random() * 2),
              gpuTemp: gpuStats.temp + (Math.random() * 10),
              gpuPower: gpuStats.power + (Math.random() * 40),
              gpuUtilization: Math.min(100, Math.max(85, gpuStats.utilization + (Math.random() * 15 - 7))),
              npuLoad: Math.min(100, Math.random() * 95),
              npuTemp: 48 + Math.random() * 20,
              timestamp: Date.now()
            };
          }

          const speedMultiplier = { 'T4': 1, 'L4': 1.5, 'A100': 3, 'H100': 6 }[job.config.gpuType as GPUType] || 1;
          const progressStep = (1 / totalSteps) * speedMultiplier * 100;
          const updatedProgress = Math.min(100, job.progress + progressStep);

          return {
            ...job,
            progress: updatedProgress,
            status: updatedProgress === 100 ? 'completed' : 'training',
            currentEpoch,
            totalEpochs,
            currentStep: nextStep,
            totalSteps,
            completedAt: updatedProgress === 100 ? Date.now() : undefined,
            metrics: [...job.metrics, nextMetric]
          };
        }
        return job;
      }));
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const startNewJob = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const agentId = formData.get('agentId') as string;
    const methodology = formData.get('methodology') as TrainingMethodology;
    const gpuType = formData.get('gpuType') as GPUType;
    const gpuCount = Number(formData.get('gpuCount')) || 1;
    const protocol = formData.get('protocol') as any;
    const strategy = formData.get('strategy') as any;
    const rewardModel = formData.get('rewardModel') as string;
    const agent = agents.find(a => a.id === agentId);

    const newJob: TrainingJob = {
      id: `job-${Date.now()}`,
      agentId,
      agentName: agent?.name || 'Unknown Agent',
      methodology,
      status: 'training',
      progress: 0,
      currentEpoch: 1,
      totalEpochs: Number(formData.get('epochs')) || 1,
      currentStep: 0,
      totalSteps: (Number(formData.get('epochs')) || 1) * 50,
      startedAt: Date.now(),
      metrics: [],
      config: {
        epochs: Number(formData.get('epochs')) || 1,
        learningRate: Number(formData.get('lr')) || 0.001,
        batchSize: Number(formData.get('batchSize')) || 16,
        gpuType,
        gpuCount,
        protocol,
        strategy,
        rewardModel
      }
    };

    setJobs([newJob, ...jobs]);
    setActiveJobId(newJob.id);
    setIsCreating(false);
    toast.success(`Training session started for ${agent?.name}`);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-orange-500" />
            Neural Training Lab
          </h2>
          <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest opacity-70 italic serif">
            Advanced Fine-tuning & RL Optimization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            className="border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950/50"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Initialize Training
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <div className="flex items-center justify-between bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800/50 backdrop-blur-md">
          <TabsList className="bg-transparent border-none p-0 h-auto">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-500 data-[state=active]:shadow-none px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
            >
              <Activity className="w-4 h-4 mr-2" />
              Global Telemetry
            </TabsTrigger>
            <TabsTrigger 
              value="arena"
              className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500 data-[state=active]:shadow-none px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
            >
              <Sword className="w-4 h-4 mr-2" />
              Neural Arena
            </TabsTrigger>
            <TabsTrigger 
              value="forge"
              className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-500 data-[state=active]:shadow-none px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              Data Forge
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4 px-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-zinc-500 font-mono">NEXUS CLUSTER ACTIVE</span>
            </div>
          </div>
        </div>

        <TabsContent value="overview" className="m-0 focus-visible:outline-none">
          <div className="grid grid-cols-12 gap-8">
            {/* Job List */}
            <div className="col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Training History</h3>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {jobs.map(job => (
                <div 
                  key={job.id}
                  onClick={() => setActiveJobId(job.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer group",
                    activeJobId === job.id 
                      ? "bg-zinc-900 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]" 
                      : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className={cn(
                      "text-[10px] h-4 px-1.5 font-mono border-none",
                      job.methodology === 'SFT' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                    )}>
                      {job.methodology}
                    </Badge>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(job.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="font-semibold text-zinc-100 group-hover:text-orange-500 transition-colors truncate">
                    {job.agentName}
                  </h4>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 uppercase tracking-tighter">Status</span>
                      <span className={cn(
                        "font-bold uppercase flex items-center gap-1",
                        job.status === 'training' ? "text-orange-500 animate-pulse" :
                        job.status === 'completed' ? "text-emerald-500" : "text-zinc-500"
                      )}>
                        {job.status === 'training' && <Activity className="w-2.5 h-2.5" />}
                        {job.status}
                      </span>
                    </div>
                    
                    {job.status === 'training' && (
                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                        <span>E: {job.currentEpoch}/{job.totalEpochs}</span>
                        <span>S: {job.currentStep % 50}/{50}</span>
                      </div>
                    )}

                    <Progress value={job.progress} className="h-1 bg-zinc-800" indicatorClassName={cn(
                      job.status === 'completed' ? "bg-emerald-500" : "bg-orange-500"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Real-time Monitoring / Metrics */}
        <div className="col-span-8 space-y-6">
          {activeJob ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
                  <button 
                    onClick={() => setMetricsViewMode('steps')}
                    className={cn(
                      "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                      metricsViewMode === 'steps' ? "bg-orange-500 text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    Step Feed
                  </button>
                  <button 
                    onClick={() => setMetricsViewMode('epochs')}
                    className={cn(
                      "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                      metricsViewMode === 'epochs' ? "bg-orange-500 text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    Epoch Analysis
                  </button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-zinc-900 border-zinc-800 text-zinc-400 text-[10px] h-8"
                  onClick={() => exportMetrics(activeJob)}
                >
                  <Download className="w-3 h-3 mr-2" />
                  Export Stats (CSV)
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <MetricCard 
                  title="Current Loss" 
                  value={activeJob.metrics[activeJob.metrics.length - 1]?.loss?.toFixed(4) || '--'} 
                  trend={-5.2}
                  icon={<TrendingDown className="w-4 h-4" />}
                />
                <MetricCard 
                  title="Confidence/Accuracy" 
                  value={activeJob.metrics[activeJob.metrics.length - 1]?.accuracy ? `${(activeJob.metrics[activeJob.metrics.length - 1].accuracy! * 100).toFixed(1)}%` : '--'} 
                  trend={2.1}
                  icon={<Target className="w-4 h-4" />}
                />
                <MetricCard 
                  title="Avg Training Step" 
                  value={`${activeJob.metrics.length} steps`} 
                  trend={0}
                  icon={<Clock className="w-4 h-4" />}
                />
                <MetricCard 
                  title="GPU Power Draw" 
                  value={`${(activeJob.metrics[activeJob.metrics.length - 1]?.gpuPower || 0).toFixed(0)}W`} 
                  trend={1.4}
                  icon={<Zap className="w-4 h-4" />}
                />
                <MetricCard 
                  title="VRAM Usage" 
                  value={`${(activeJob.metrics[activeJob.metrics.length - 1]?.vramUsage || 0).toFixed(1)}GB`} 
                  trend={0.2}
                  icon={<Gauge className="w-4 h-4" />}
                />
                <MetricCard 
                  title="GPU Utilization" 
                  value={`${(activeJob.metrics[activeJob.metrics.length - 1]?.gpuUtilization || 0).toFixed(0)}%`} 
                  trend={Math.round(Math.random() * 5)}
                  icon={<Activity className="w-4 h-4" />}
                />
                <MetricCard 
                  title="Core Temp" 
                  value={`${(activeJob.metrics[activeJob.metrics.length - 1]?.gpuTemp || 0).toFixed(0)}°C`} 
                  trend={0.5}
                  icon={<Thermometer className="w-4 h-4" />}
                />
                <MetricCard 
                  title="QNN NPU Load" 
                  value={`${(activeJob.metrics[activeJob.metrics.length - 1]?.npuLoad || 0).toFixed(0)}%`} 
                  trend={Math.random() * 5}
                  icon={<Gauge className="w-4 h-4 text-orange-500" />}
                />
                <MetricCard 
                  title="NPU Thermal" 
                  value={`${(activeJob.metrics[activeJob.metrics.length - 1]?.npuTemp || 0).toFixed(0)}°C`} 
                  trend={0.2}
                  icon={<Thermometer className="w-4 h-4 text-orange-500" />}
                />
              </div>

              {/* Configuration Parameters Breakdown */}
              <Card className="bg-zinc-900 border-zinc-800 p-6 border-t-2 border-t-blue-500/50 shadow-sm">
                <CardHeader className="px-0 pt-0 pb-4">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-blue-500" />
                    <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">Neural Configuration Breakdown</h3>
                  </div>
                </CardHeader>
                <div className="grid grid-cols-4 gap-y-6 gap-x-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Epochs</p>
                    <p className="text-sm font-mono text-zinc-200">{activeJob.config.epochs || activeJob.totalEpochs || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Learning Rate</p>
                    <p className="text-sm font-mono text-orange-400 font-bold">{activeJob.config.learningRate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Batch Size</p>
                    <p className="text-sm font-mono text-zinc-200">{activeJob.config.batchSize}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">GPU Cluster</p>
                    <p className="text-sm font-mono text-zinc-200">{activeJob.config.gpuCount}x {activeJob.config.gpuType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Training Method</p>
                    <Badge variant="outline" className="text-[9px] h-4 bg-blue-500/10 text-blue-400 border-none px-1.5 font-mono">{activeJob.methodology}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Hardware Protocol</p>
                    <p className="text-sm font-mono text-zinc-200">{activeJob.config.protocol || 'NVLink 4.0'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Parallel Strategy</p>
                    <p className="text-[11px] font-mono text-emerald-500/80">{activeJob.config.strategy || 'Distributed DP'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Reward Model</p>
                    <p className="text-sm font-mono text-zinc-300 truncate max-w-[140px]" title={activeJob.config.rewardModel}>
                      {activeJob.config.rewardModel || 'bastion-rm-v2'}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-zinc-100">
                        {metricsViewMode === 'steps' ? 'Neural Convergence' : 'Epoch Convergence'}
                      </CardTitle>
                      <CardDescription className="text-zinc-500 font-mono text-[10px]">
                        {metricsViewMode === 'steps' ? 'Optimization Curve (Steps)' : 'Loss Reduction Trend (Epochs)'}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metricsViewMode === 'steps' ? activeJob.metrics : epochMetrics}>
                        <defs>
                          <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey={metricsViewMode === 'steps' ? "step" : "epoch"} fontSize={10} stroke="#71717a" />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '10px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey={activeJob.methodology === 'SFT' ? "loss" : "reward"} 
                          stroke="#f97316" 
                          fillOpacity={1} 
                          fill="url(#colorLoss)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-zinc-100">
                        {metricsViewMode === 'steps' ? 'Confidence / Accuracy' : 'Accuracy Trend'}
                      </CardTitle>
                      <CardDescription className="text-zinc-500 font-mono text-[10px]">
                        {metricsViewMode === 'steps' ? 'Direct inference success rate' : 'Epochal accuracy improvements'}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metricsViewMode === 'steps' ? activeJob.metrics : epochMetrics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey={metricsViewMode === 'steps' ? "step" : "epoch"} fontSize={10} stroke="#71717a" />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '10px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="accuracy" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          dot={metricsViewMode === 'epochs'} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-zinc-100">GPU Thermal Telemetry</CardTitle>
                      <CardDescription className="text-zinc-500 font-mono text-[10px]">Active hardware load monitoring</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono border-zinc-800 text-zinc-500">
                      {activeJob.config.gpuCount}x {activeJob.config.gpuType}
                    </Badge>
                  </CardHeader>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activeJob.metrics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="step" hide />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '10px' }}
                        />
                        <Line type="monotone" dataKey="gpuTemp" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp (°C)" />
                        <Line type="monotone" dataKey="gpuPower" stroke="#eab308" strokeWidth={2} dot={false} name="Power (W)" />
                        <Line type="monotone" dataKey="gpuUtilization" stroke="#3b82f6" strokeWidth={2} dot={false} name="Utilization (%)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Real-time Progress Details */}
              <Card className="bg-zinc-900 border-zinc-800 p-6 border-l-2 border-l-orange-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">Progress Analysis</h4>
                      <p className="text-[10px] text-zinc-500 font-mono">ESTIMATED TIME TO CONVERGENCE</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-orange-500">{activeJob.progress.toFixed(1)}%</span>
                    <p className="text-[10px] text-zinc-500 font-mono">COMPLETE</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Epoch</p>
                    <p className="text-lg font-bold text-zinc-100">{activeJob.currentEpoch} <span className="text-zinc-600 text-xs font-normal">of {activeJob.totalEpochs}</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Step Count</p>
                    <p className="text-lg font-bold text-zinc-100">{activeJob.currentStep} <span className="text-zinc-600 text-xs font-normal">of {activeJob.totalSteps}</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Performance</p>
                    <p className="text-lg font-bold text-zinc-100">{(activeJob.metrics.length / ((Date.now() - activeJob.startedAt) / 1000)).toFixed(2)} <span className="text-zinc-600 text-xs font-normal">it/s</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">ETA</p>
                    <p className="text-lg font-bold text-zinc-100">
                      {activeJob.status === 'completed' ? 'Finished' : (
                        (() => {
                          const stepsLeft = (activeJob.totalSteps || 0) - (activeJob.currentStep || 0);
                          const elapsed = (Date.now() - activeJob.startedAt) / 1000;
                          const avgTimePerStep = elapsed / (activeJob.currentStep || 1);
                          const etaSeconds = Math.max(0, stepsLeft * avgTimePerStep);
                          const min = Math.floor(etaSeconds / 60);
                          const sec = Math.floor(etaSeconds % 60);
                          return `${min}m ${sec}s`;
                        })()
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>NEURAL WEIGHT SYNCHRONIZATION</span>
                    <span>{Math.round(activeJob.progress)}%</span>
                  </div>
                  <Progress value={activeJob.progress} className="h-2 bg-zinc-800" indicatorClassName="bg-orange-500" />
                </div>
              </Card>

              {/* Training Logs */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <TerminalRenderer className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Training Payload Output</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="font-mono text-[11px] text-zinc-500 bg-black/40 p-4 rounded-lg overflow-x-auto max-h-48">
                    {`[TRAIN] hw=${activeJob.config.gpuCount}x_${activeJob.config.gpuType}, protocol=${activeJob.config.protocol}, strategy=${activeJob.config.strategy}
[INFO] Initializing strategy: ${activeJob.methodology}
[LOAD] Checkpoint loaded at step ${Math.max(0, activeJob.metrics.length - 10)}
[TRAIN] batch_size=${activeJob.config.batchSize}, lr=${activeJob.config.learningRate}
${activeJob.metrics.slice(-5).map(m => `[STEP ${m.step}] T: ${m.gpuTemp?.toFixed(1)}°C | P: ${m.gpuPower?.toFixed(1)}W | VRAM: ${m.vramUsage?.toFixed(2)}GB`).join('\n')}
${activeJob.status === 'training' ? `[ACTIVE] Distributed sync over ${activeJob.config.protocol}...` : '[END] Weight convergence reached. Saving snapshot...'}`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-4 opacity-50">
              <BrainCircuit className="w-16 h-16 text-zinc-700" />
              <div className="space-y-1">
                <p className="text-zinc-100 font-medium tracking-tight">Select a training job to view metrics</p>
                <p className="text-zinc-500 text-sm max-w-xs mx-auto">Real-time GPU telemetry, convergence logs and weight snapshots will appear here during active sessions.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TabsContent>

        <TabsContent value="arena" className="m-0 focus-visible:outline-none">
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column: Triggers and History */}
            <div className="col-span-4 space-y-6">
              <Card className="bg-zinc-900 border-zinc-800 border-t-2 border-t-blue-500/50 overflow-hidden">
                <CardHeader className="border-b border-zinc-800 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-500" />
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">Synthetic HALT Triggers</CardTitle>
                  </div>
                  <CardDescription className="text-[10px] text-zinc-500 font-mono uppercase mt-1">Source: text_data.py</CardDescription>
                </CardHeader>
                <ScrollArea className="h-[400px]">
                  <div className="p-2 space-y-2">
                    {arenaTriggers.map((trigger) => (
                      <button
                        key={trigger.id}
                        onClick={() => runArenaFight(trigger)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all text-xs group",
                          selectedTrigger?.id === trigger.id 
                            ? "bg-blue-500/10 border-blue-500/50 text-blue-400" 
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1 text-[9px] font-mono opacity-60">
                          <span className="uppercase tracking-tighter">{trigger.id}</span>
                          <Badge variant="outline" className={cn(
                            "text-[8px] h-3 shadow-none border-none",
                            trigger.risk_level === 'Critical' ? "bg-red-500/20 text-red-400" :
                            trigger.risk_level === 'High' ? "bg-orange-500/20 text-orange-400" : "bg-zinc-800 text-zinc-500"
                          )}>
                            {trigger.risk_level}
                          </Badge>
                        </div>
                        <p className="line-clamp-2 leading-relaxed italic">"{trigger.input}"</p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Arena Steering Log</h3>
                </div>
                <ScrollArea className="h-[200px]">
                  {arenaHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                      <Database className="w-8 h-8 mb-2" />
                      <p className="text-[10px] uppercase tracking-widest font-bold">No history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {arenaHistory.map((h, i) => (
                        <div key={i} className="bg-black/20 p-2.5 rounded-lg border border-zinc-800/50 space-y-1">
                          <div className="flex items-center justify-between text-[8px] font-mono text-zinc-600">
                            <span>Preference Recorded</span>
                            <span>{new Date(h.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 italic line-clamp-1">"{h.trigger.input}"</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[8px] h-3 bg-emerald-500/10 text-emerald-500 border-none">Selected: {h.selected}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>

            {/* Right Column: Arena Stage */}
            <div className="col-span-8 space-y-6">
              {!selectedTrigger ? (
                <div className="h-full min-h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl p-12 text-center bg-zinc-950/30">
                  <div className="w-20 h-20 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-6 text-zinc-700">
                    <Sword className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-200 mb-2">Neural Comparative Arena</h3>
                  <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
                    Select a synthetic trigger from the left to generate comparative responses from <span className="text-orange-500 font-bold">Daedalus</span>. 
                    Your manual preference steering will immediately update the reward model via JSONL updates.
                  </p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Active Question */}
                  <Card className="bg-zinc-900 border-zinc-800 p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                       <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Sparkles className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Active Steering Session</span>
                       </div>
                    </div>
                    <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center gap-2 text-blue-500">
                        <Info className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Selected Trigger Configuration</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
                        {selectedTrigger.input}
                      </h2>
                      <div className="flex items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">INTENT VECTOR</p>
                          <p className="text-xs text-zinc-300 font-mono">{selectedTrigger.intent}</p>
                        </div>
                        <div className="h-8 w-px bg-zinc-800" />
                        <div className="space-y-1">
                          <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">REWARD UPDATE RATE</p>
                          <p className="text-xs text-zinc-300 font-mono">0.05α / preference</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Responses Side-by-Side */}
                  <div className="grid grid-cols-2 gap-8">
                    {isArenaLoading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="h-96 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-pulse flex flex-col items-center justify-center space-y-4">
                           <Activity className="w-8 h-8 text-zinc-800" />
                           <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-700">Synthesizing {i === 0 ? 'Option A' : 'Option B'}...</p>
                        </div>
                      ))
                    ) : (
                      arenaResponses.map((response, i) => (
                        <motion.div
                          key={response.id}
                          initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col hover:border-blue-500/30 transition-all group"
                        >
                          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/30">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 uppercase tracking-tighter">
                                {i === 0 ? 'Daedalus-Alpha' : 'Daedalus-Beta'}
                              </Badge>
                            </div>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              i === 0 ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            )} />
                          </div>
                          <ScrollArea className="flex-1 p-6 h-[400px]">
                            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                              {response.text}
                            </p>
                          </ScrollArea>
                          <div className="p-6 bg-zinc-950/50 border-t border-zinc-800 flex flex-col gap-3">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold text-center">Steer Reward Model</p>
                            <Button 
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-lg shadow-blue-500/10 group-hover:scale-[1.02] transition-transform"
                              onClick={() => submitPreference(response.id)}
                            >
                              {i === 0 ? 'Alpha Model Preferred' : 'Beta Model Preferred'}
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="forge" className="m-0 focus-visible:outline-none">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12">
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <CardHeader className="border-b border-zinc-800 bg-zinc-950/30 p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                        <FlaskConical className="w-8 h-8 text-purple-500" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-white tracking-tight">Synthetic Data Forge</CardTitle>
                        <CardDescription className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-1">High-Fidelity Neural Dataset Synthesis Engine</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,1)]" />
                        <span className="text-[10px] font-mono text-zinc-500 font-bold">STATION_READY</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-12 min-h-[600px]">
                    {/* Filing Cabinet Sidebar */}
                    <div className="col-span-4 border-r border-zinc-800 p-8 space-y-8 bg-zinc-950/20">
                      <div>
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Archive className="w-3 h-3" />
                          Bastion Industrial Intelligence / Filing Cabinet
                        </h4>
                        
                        <div className="space-y-6">
                          {DOMAIN_GROUPS.map(group => (
                            <div key={group.id} className="space-y-3">
                              <Label className="text-[9px] uppercase tracking-widest text-zinc-600 font-black flex items-center gap-2">
                                {group.icon}
                                <span className="opacity-80">{group.name}</span>
                              </Label>
                              <Select 
                                value={dataGenType} 
                                onValueChange={(val) => {
                                  setDataGenType(val);
                                  const item = group.items.find(i => i.id === val);
                                  if (item) setDataGenLabel(item.label);
                                }}
                              >
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-sm focus:ring-purple-500/50">
                                  <SelectValue placeholder={`Select ${group.name.split(' ')[0]}...`} />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[300px]">
                                  {group.items.map(item => (
                                    <SelectItem key={item.id} value={item.id} className="py-2.5">
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-zinc-950 flex items-center justify-center border border-zinc-800">
                                          {item.icon}
                                        </div>
                                        <div>
                                          <div className="text-xs font-bold truncate">{item.label}</div>
                                          <div className="text-[9px] text-zinc-500 line-clamp-1 max-w-[200px]">{item.description}</div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-8 border-t border-zinc-800 space-y-6">
                        <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 space-y-4">
                          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Synthesis Parameters</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-[10px] text-zinc-500 font-bold">Sample Count</Label>
                                <span className="text-[10px] font-mono text-purple-400 font-bold">10</span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden">
                                <div className="h-full w-1/4 bg-purple-500" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="text-[10px] text-zinc-500 font-bold">Inference Entropy</Label>
                              <Badge variant="outline" className="text-[8px] bg-zinc-950 text-emerald-500 border-emerald-500/30">LOCKED 0.7</Badge>
                            </div>
                          </div>
                        </div>

                        {isGeneratingData ? (
                          <div className="space-y-3 bg-purple-500/5 p-6 rounded-xl border border-purple-500/20">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-purple-400 font-bold animate-pulse">SYNTHESIZING...</span>
                              <span className="text-purple-500/80">{dataGenProgress}%</span>
                            </div>
                            <Progress value={dataGenProgress} className="h-2 bg-zinc-900 border border-purple-500/10" indicatorClassName="bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                          </div>
                        ) : (
                          <Button 
                            className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest shadow-lg shadow-purple-500/10 group relative transition-transform active:scale-[0.98]"
                            onClick={startDataGeneration}
                          >
                            <Wand2 className="w-5 h-5 mr-3 text-white animate-pulse" />
                            Forge Neural Dataset
                            <div className="absolute inset-0 rounded bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        )}

                        <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 flex gap-3 italic text-[10px] text-orange-500/70">
                          <Database className="w-4 h-4 flex-shrink-0" />
                          <span>All industrial intelligence datasets forged here are specifically engineered to calibrate and enhance cognitive architectures across the Bastion ecosystem.</span>
                        </div>
                      </div>
                    </div>

                    {/* Forge Preview / Feed */}
                    <div className="col-span-8 p-10 bg-zinc-950/40 relative flex flex-col">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                          <Info className="w-4 h-4 text-zinc-600" />
                          <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest italic">Live Synthesis Buffer: {dataGenLabel}</h4>
                        </div>
                        {syntheticDatasets[dataGenType] && (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-[10px] h-8 px-4"
                            onClick={() => exportToJsonl(dataGenType)}
                          >
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Export JSONL ({syntheticDatasets[dataGenType].length})
                          </Button>
                        )}
                      </div>

                      <ScrollArea className="flex-1 -mr-4 pr-10">
                        <div className="space-y-8">
                          {(!syntheticDatasets[dataGenType] || syntheticDatasets[dataGenType].length === 0) && !isGeneratingData ? (
                            <div className="flex flex-col items-center justify-center p-20 text-center">
                              <div className="w-24 h-24 rounded-full bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center mb-8 border-dashed">
                                <Sparkles className="w-10 h-10 text-zinc-800" />
                              </div>
                              <h3 className="text-xl font-bold text-zinc-300 mb-2">Neural Workspace Empty</h3>
                              <p className="text-zinc-500 max-w-sm text-sm">Select a domain specification from the filing cabinet to begin high-fidelity synthetic data generation.</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {(syntheticDatasets[dataGenType] || []).slice().reverse().map((sample, idx) => (
                                <motion.div
                                  key={sample.id}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="group relative"
                                >
                                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-purple-500/20 group-hover:bg-purple-500 transition-colors" />
                                  <Card className="bg-zinc-900/40 border-zinc-800 group-hover:border-zinc-700 transition-all">
                                    <CardHeader className="p-4 bg-zinc-950/40 border-b border-zinc-800 flex flex-row items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[8px] uppercase tracking-tighter bg-zinc-950 border-zinc-800 text-purple-400 font-mono">SAMPLE_{idx}</Badge>
                                        <span className="text-[10px] text-zinc-500 font-mono">{sample.timestamp.split('T')[1].split('.')[0]}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-zinc-600 font-mono">CONFIDENCE:</span>
                                        <span className="text-[9px] text-emerald-500 font-mono font-bold">{(sample.confidence * 100).toFixed(1)}%</span>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                      <div className="space-y-2">
                                        <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                          <TerminalIcon className="w-3 h-3" />
                                          Input Prompt
                                        </h5>
                                        <p className="text-xs text-zinc-200 leading-relaxed font-mono p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                                          {sample.input}
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                          <h5 className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest flex items-center gap-2">
                                            <Play className="w-3 h-3" />
                                            Optimal Output
                                          </h5>
                                          <div className="text-[11px] text-zinc-400 leading-relaxed font-mono p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/10 min-h-[100px]">
                                            {sample.output}
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <h5 className="text-[10px] font-bold text-blue-500/70 uppercase tracking-widest flex items-center gap-2">
                                            <Search className="w-3 h-3" />
                                            AI Reasoning
                                          </h5>
                                          <div className="text-[11px] text-zinc-400 leading-relaxed italic p-4 bg-blue-500/5 rounded-lg border border-blue-500/10 min-h-[100px]">
                                            {sample.reasoning}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Job Modal - Refactored for better UX and Accessibility */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[550px] bg-zinc-900 border-zinc-800 p-0 overflow-hidden text-zinc-100 max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <Play className="w-5 h-5 text-orange-500" />
              <DialogTitle className="text-xl font-bold">Initialize Neural Training</DialogTitle>
            </div>
            <DialogDescription className="text-zinc-500 text-xs">
              Configure GPU cluster and neural optimization parameters for your agent.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto">
            <form id="training-form" onSubmit={startNewJob} className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Select Target Agent</Label>
                <Select name="agentId" required>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue placeholder="Choose an agent profile" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    {agents.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Training Methodology</Label>
                  <Select name="methodology" defaultValue="SFT">
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectItem value="SFT">Supervised Fine-tuning (SFT)</SelectItem>
                      <SelectItem value="RLHF">RLHF (Human Feedback)</SelectItem>
                      <SelectItem value="PPO">PPO (Proximal Policy Opt)</SelectItem>
                      <SelectItem value="DPO">Direct Preference Opt (DPO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Reference Reward Model</Label>
                  <Select name="rewardModel" defaultValue="bastion-rm-v2">
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectItem value="bastion-rm-v2">Bastion Reward-v2 (Standard)</SelectItem>
                      <SelectItem value="hermes-judge">Hermes-7B Judge</SelectItem>
                      <SelectItem value="custom">Custom Pipeline Model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Optimization Epochs</Label>
                  <Input name="epochs" type="number" defaultValue="3" className="bg-zinc-950 border-zinc-800" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Base Learning Rate</Label>
                  <Input name="lr" type="text" defaultValue="0.0001" className="bg-zinc-950 border-zinc-800" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Batch Processing Size</Label>
                  <Input name="batchSize" type="number" defaultValue="32" className="bg-zinc-950 border-zinc-800" />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-4">
                <Label className="text-[10px] uppercase tracking-widest text-orange-500 font-bold">Cluster Configuration</Label>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Accelerator Hardware</Label>
                    <Select name="gpuType" defaultValue="A100">
                      <SelectTrigger className="bg-zinc-950 border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <SelectItem value="T4">NVIDIA T4 (Low Precision)</SelectItem>
                        <SelectItem value="L4">NVIDIA L4 (Tensor Cores)</SelectItem>
                        <SelectItem value="A100">NVIDIA A100 (80GB VRAM)</SelectItem>
                        <SelectItem value="H100">NVIDIA H100 (Hopper Arc)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">GPU Cluster Size</Label>
                    <Select name="gpuCount" defaultValue="1">
                      <SelectTrigger className="bg-zinc-950 border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <SelectItem value="1">1x Device</SelectItem>
                        <SelectItem value="2">2x NVLink</SelectItem>
                        <SelectItem value="4">4x DGX Node</SelectItem>
                        <SelectItem value="8">8x Compute Cluster</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Inter-GPU Protocol</Label>
                    <Select name="protocol" defaultValue="NVLink">
                      <SelectTrigger className="bg-zinc-950 border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <SelectItem value="NVLink">NVLink 4.0 (300GB/s)</SelectItem>
                        <SelectItem value="InfiniBand">InfiniBand NDR (400Gb/s)</SelectItem>
                        <SelectItem value="PCIe">PCIe Gen5 (64GB/s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Training Strategy</Label>
                    <Select name="strategy" defaultValue="Data Parallel">
                      <SelectTrigger className="bg-zinc-950 border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <SelectItem value="Data Parallel">Distributed Data Parallel (DDP)</SelectItem>
                        <SelectItem value="Model Parallel">Tensor/Pipeline Parallelism</SelectItem>
                        <SelectItem value="Zero Redundancy">DeepSpeed ZeRO-3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 flex gap-3 italic text-[11px] text-orange-500/70">
                <Settings2 className="w-4 h-4 flex-shrink-0" />
                Heads up: Complex RL methods may compute significantly longer and consume higher neural credits.
              </div>
            </form>
          </ScrollArea>

          <DialogFooter className="p-6 bg-zinc-950/50 border-t border-zinc-800 shrink-0 gap-3">
            <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button form="training-form" type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8">
              Engage Training Core
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ title, value, trend, icon }: { title: string, value: string | number, trend: number, icon: React.ReactNode }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 border-l-2 border-l-orange-500/50">
      <CardContent className="p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between text-zinc-500">
          <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
          <span className="opacity-50">{icon}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-zinc-100">{value}</span>
          {trend !== 0 && (
            <span className={cn(
              "text-[10px] font-mono",
              trend > 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TerminalRenderer({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

export function generateDummyMetrics(count: number, method: string, gpu: GPUType = 'T4'): TrainingMetric[] {
  const gpuBase = getGpuSimulationValues(gpu);
  return Array.from({ length: count }).map((_, i) => ({
    step: i + 1,
    epoch: Math.floor(i / 50) + 1,
    loss: method === 'SFT' ? Math.max(0.01, 1 - Math.log(i + 2) * 0.2 + Math.random() * 0.05) : undefined,
    accuracy: Math.min(0.99, 0.4 + Math.log(i + 2) * 0.15 + Math.random() * 0.02),
    reward: method !== 'SFT' ? -50 + i * 2 + Math.random() * 10 : undefined,
    vramUsage: gpuBase.vram + Math.random(),
    gpuTemp: gpuBase.temp + Math.random() * 10,
    gpuPower: gpuBase.power + Math.random() * 50,
    gpuUtilization: Math.min(100, Math.max(60, gpuBase.utilization + (Math.random() * 20 - 10))),
    npuLoad: 30 + Math.random() * 60,
    npuTemp: 40 + Math.random() * 25,
    timestamp: Date.now() - (count - i) * 1000
  }));
}

export function getGpuSimulationValues(gpu: GPUType) {
  switch (gpu) {
    case 'H100': return { vram: 68.5, temp: 72, power: 550, utilization: 92 };
    case 'A100': return { vram: 45.2, temp: 68, power: 350, utilization: 88 };
    case 'L4': return { vram: 14.8, temp: 62, power: 75, utilization: 85 };
    case 'T4': default: return { vram: 8.4, temp: 58, power: 70, utilization: 80 };
  }
}
