import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Gauge,
  Thermometer,
  Layers,
  Zap,
  History,
  ShieldCheck,
  Bot
} from 'lucide-react';
import { AgentConfig, TrainingJob, AgentVersion } from '../types';

interface AnalyticsProps {
  agents: AgentConfig[];
  jobs: TrainingJob[];
  versions: AgentVersion[];
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#6366f1'];

export default function Analytics({ agents, jobs, versions }: AnalyticsProps) {
  // Real stats calculation
  const totalAgents = agents.length;
  const totalNodes = agents.reduce((sum, a) => sum + (a.modules?.length || 0), 0);
  const totalSnapshots = versions.length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const activeJobs = jobs.filter(j => j.status === 'training').length;
  
  const avgProgress = jobs.length > 0 
    ? (jobs.reduce((sum, j) => sum + j.progress, 0) / jobs.length).toFixed(1)
    : '0';

  // Module Distribution
  const moduleTypesCount: Record<string, number> = {};
  agents.forEach(agent => {
    agent.modules.forEach(mod => {
      moduleTypesCount[mod.name] = (moduleTypesCount[mod.name] || 0) + 1;
    });
  });

  const moduleUsageData = Object.entries(moduleTypesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Job History Data (Simplified)
  const jobTimeline = jobs.slice().reverse().map((j, i) => ({
    name: `Job ${i + 1}`,
    progress: j.progress,
    steps: j.metrics.length
  }));

  // Deployment activity by date
  const deploymentActivity = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toLocaleDateString();
    const count = versions.filter(v => new Date(v.createdAt).toLocaleDateString() === dateStr).length;
    return { day: d.toLocaleDateString([], { weekday: 'short' }), count };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-orange-500" />
          Neural Fleet Telemetry
        </h2>
        <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest opacity-70 italic serif">Living Intelligence Insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Entities" 
          value={totalAgents.toString()} 
          subValue="Active Neural Pipelines" 
          icon={<Bot className="w-4 h-4 text-orange-500" />} 
        />
        <StatCard 
          label="Knowledge Nodes" 
          value={totalNodes.toString()} 
          subValue="Integrated Capabilities" 
          icon={<Layers className="w-4 h-4 text-blue-500" />} 
        />
        <StatCard 
          label="Training Flux" 
          value={`${avgProgress}%`} 
          subValue="Avg Cluster Completion" 
          icon={<Zap className="w-4 h-4 text-emerald-500" />} 
        />
        <StatCard 
          label="Temporal Snapshots" 
          value={totalSnapshots.toString()} 
          subValue="Immutable Versions" 
          icon={<History className="w-4 h-4 text-purple-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Training Optimization Curve</CardTitle>
            <CardDescription className="text-xs uppercase tracking-tighter text-zinc-500 font-mono italic">Bastion Cluster Convergence</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {jobs.length === 0 ? (
              <EmptyState message="No training telemetry detected. Engage the training lab to generate heatmaps." />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={jobTimeline}>
                    <defs>
                      <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#f97316' }}
                    />
                    <Area type="monotone" dataKey="progress" stroke="#f97316" fillOpacity={1} fill="url(#colorProgress)" name="Completion %" />
                  </AreaChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Node Distribution</CardTitle>
            <CardDescription className="text-xs uppercase tracking-tighter text-zinc-500 font-mono italic">Intelligence Specialization</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {moduleUsageData.length === 0 ? (
                <EmptyState message="Neural builder is dormant." icon={<Bot className="animate-pulse" />} />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleUsageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} width={80} />
                    <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Invocations">
                    {moduleUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 border-b-4 border-b-emerald-500/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Neural Integrity Index
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-4xl font-black text-white tracking-tighter">98.4</div>
                        <p className="text-[10px] text-zinc-500 uppercase font-mono mt-1">Convergence score [STABLE]</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-emerald-500/10 text-emerald-500 text-[9px] uppercase border-none">Hardened</Badge>
                        <span className="text-[8px] text-zinc-600 font-mono italic">Bastion Kernel Active</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 border-b-4 border-b-blue-500/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Temporal Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={deploymentActivity}>
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                    </AreaChart>
                </ResponsiveContainer>
                <div className="flex justify-between mt-2">
                   {deploymentActivity.map(d => (
                       <span key={d.day} className="text-[8px] text-zinc-600 font-mono">{d.day}</span>
                   ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon }: { label: string, value: string, subValue: string, icon: React.ReactNode }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 group hover:border-zinc-700 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tighter">{value}</div>
        <p className="text-[10px] text-zinc-500 mt-1 font-mono uppercase tracking-tighter italic serif">{subValue}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message, icon }: { message: string, icon?: React.ReactNode }) {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center text-center opacity-40">
            {icon || <AlertCircle className="w-8 h-8 mb-2" />}
            <p className="text-xs font-mono uppercase tracking-widest max-w-[200px]">{message}</p>
        </div>
    );
}

