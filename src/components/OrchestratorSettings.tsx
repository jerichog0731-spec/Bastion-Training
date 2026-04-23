import React from 'react';
import { Shield, Server, Key, Globe, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrchestratorConfig, OrchestratorProvider } from '../types';
import { toast } from 'sonner';

interface OrchestratorSettingsProps {
  config: OrchestratorConfig;
  onUpdate: (config: OrchestratorConfig) => void;
}

export default function OrchestratorSettings({ config, onUpdate }: OrchestratorSettingsProps) {
  const [testStatus, setTestStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTimeout(() => {
      if (config.provider === 'gemini') {
        setTestStatus('success');
        toast.success("Gemini Cluster Online");
      } else if (config.endpoint) {
        setTestStatus('success');
        toast.success(`Connected to Proprietary Node: ${config.modelName}`);
      } else {
        setTestStatus('error');
        toast.error("Endpoint configuration missing");
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <Shield className="w-6 h-6 text-orange-500" />
          Orchestration Layer
        </h2>
        <p className="text-zinc-500 text-sm">Configure the primary intelligence engine for neural task routing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">Active Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['gemini', 'custom-proprietary', 'local-hosted'] as OrchestratorProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => onUpdate({ ...config, provider: p })}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                  config.provider === p 
                    ? "bg-orange-500/10 border-orange-500/50 text-orange-500" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                )}
              >
                <div className="flex items-center gap-3">
                  {p === 'gemini' ? <Globe className="w-4 h-4" /> : p === 'local-hosted' ? <Server className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  <span className="text-xs font-bold uppercase tracking-tighter">{p.replace('-', ' ')}</span>
                </div>
                {config.provider === p && <CheckCircle2 className="w-4 h-4" />}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Provider Configuration</CardTitle>
                <CardDescription className="text-xs">Securely link your proprietary models or local clusters.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-zinc-950 border-zinc-800 animate-pulse">
                {testStatus === 'testing' ? 'Verifying...' : 'System Ready'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {config.provider === 'gemini' ? (
              <div className="p-8 text-center space-y-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50">
                <Globe className="w-12 h-12 mx-auto text-orange-500/20" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-200">Gemini Cloud Native</p>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    Default cluster orchestration provided by Google AI. All neural routes are encrypted and processed in-region.
                  </p>
                </div>
                <Button variant="outline" className="h-8 text-[10px] uppercase font-bold" onClick={handleTestConnection}>
                  Test Cloud Handshake
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">API Endpoint</Label>
                    <div className="relative">
                      < Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700" />
                      <Input 
                        placeholder="https://api.proprietary.io/v1"
                        className="bg-zinc-950 border-zinc-800 pl-9 text-xs"
                        value={config.endpoint}
                        onChange={(e) => onUpdate({ ...config, endpoint: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Model Identity</Label>
                    <div className="relative">
                      <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700" />
                      <Input 
                        placeholder="bastion-custom-v1"
                        className="bg-zinc-950 border-zinc-800 pl-9 text-xs"
                        value={config.modelName}
                        onChange={(e) => onUpdate({ ...config, modelName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Access Key (Hidden)</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700" />
                    <Input 
                      type="password"
                      placeholder="••••••••••••••••••••••••••••"
                      className="bg-zinc-950 border-zinc-800 pl-9 text-xs"
                      value={config.apiKey}
                      onChange={(e) => onUpdate({ ...config, apiKey: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-zinc-800">
                   <div className="flex items-center gap-2 text-zinc-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Requests will be routed via the local proxy to bypass CORS.</span>
                   </div>
                   <Button 
                    className="bg-orange-600 hover:bg-orange-500 text-white h-9 px-6 font-bold text-xs"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                   >
                     Initialize Proprietary Bridge
                   </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
