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
  Cell
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
  Thermometer
} from 'lucide-react';

const PERFORMANCE_DATA = [
  { time: '00:00', requests: 45, latency: 450, successRate: 98 },
  { time: '04:00', requests: 52, latency: 480, successRate: 99 },
  { time: '08:00', requests: 120, latency: 620, successRate: 96 },
  { time: '12:00', requests: 180, latency: 750, successRate: 94 },
  { time: '16:00', requests: 140, latency: 580, successRate: 97 },
  { time: '20:00', requests: 80, latency: 490, successRate: 99 },
];

const MODULE_USAGE = [
  { name: 'Web Search', value: 4500 },
  { name: 'Memory', value: 3200 },
  { name: 'Sentiment', value: 2100 },
  { name: 'API Connect', value: 1800 },
  { name: 'Summarizer', value: 1200 },
];

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#6366f1'];

export default function Analytics() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-white">Performance Insights</h2>
        <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest opacity-70 italic serif">Real-time Agent Telemetry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value="1.2M" subValue="+12% from last week" icon={<Activity className="w-4 h-4 text-orange-500" />} />
        <StatCard label="Avg. Latency" value="540ms" subValue="-25ms improved" icon={<Clock className="w-4 h-4 text-blue-500" />} />
        <StatCard label="Success Rate" value="97.4%" subValue="+0.2% optimal" icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} />
        <StatCard label="Error Frequency" value="0.8%" subValue="-1.2% reduction" icon={<AlertCircle className="w-4 h-4 text-rose-500" />} />
        <StatCard label="NPU Utilization" value="64%" subValue="ONNX_RUNTIME_QNN" icon={<Gauge className="w-4 h-4 text-orange-500" />} />
        <StatCard label="NPU Thermal Offset" value="+2.4°C" subValue="Nominal Cooling" icon={<Thermometer className="w-4 h-4 text-rose-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Traffic & Latency</CardTitle>
            <CardDescription className="text-xs">Correlation between request volume and response time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_DATA}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#f97316" fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Module Utilization</CardTitle>
            <CardDescription className="text-xs">Most frequently invoked capability nodes</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MODULE_USAGE} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {MODULE_USAGE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon }: { label: string, value: string, subValue: string, icon: React.ReactNode }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-[10px] text-zinc-500 mt-1 font-mono uppercase tracking-tighter italic serif">{subValue}</p>
      </CardContent>
    </Card>
  );
}
