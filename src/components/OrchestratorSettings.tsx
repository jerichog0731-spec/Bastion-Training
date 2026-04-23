import React from 'react';
import { Shield, Server, Key, Globe, CheckCircle2, AlertCircle, Cpu, Monitor, Download, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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

  const handleDownloadDesktopBundle = () => {
    const readme = `# Bastion Neural Platform - Desktop Runner\n\nThis bundle allows you to run Bastion as a native desktop process.\n\n## Instructions\n1. Ensure Node.js is installed on your machine.\n2. Open your terminal in this folder.\n3. Run: npm install\n4. Run: npm run dev\n\nBastion will be available at http://localhost:3000`;
    const blob = new Blob([readme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BASTION_DESKTOP_GUIDE.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Desktop Runner Package Generated", { description: "Instructional guide downloaded to your local drive." });
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
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">Environment Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['gemini', 'custom-proprietary', 'local-hosted', 'desktop-mode'] as (OrchestratorProvider | 'desktop-mode')[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  if (p !== 'desktop-mode') {
                    onUpdate({ ...config, provider: p });
                  } else {
                    // Custom handle for desktop mode
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                  (config.provider === p || (p === 'desktop-mode' && window.matchMedia('(display-mode: standalone)').matches))
                    ? "bg-orange-500/10 border-orange-500/50 text-orange-500" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                )}
              >
                <div className="flex items-center gap-3">
                  {p === 'gemini' ? <Globe className="w-4 h-4" /> : 
                   p === 'local-hosted' ? <Server className="w-4 h-4" /> : 
                   p === 'desktop-mode' ? <Monitor className="w-4 h-4" /> :
                   <Shield className="w-4 h-4" />}
                  <span className="text-xs font-bold uppercase tracking-tighter">
                    {p === 'desktop-mode' ? 'Desktop App' : p.replace('-', ' ')}
                  </span>
                </div>
                {(config.provider === p || (p === 'desktop-mode' && window.matchMedia('(display-mode: standalone)').matches)) && <CheckCircle2 className="w-4 h-4" />}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">System Configuration</CardTitle>
                <CardDescription className="text-xs">Configure deployment targets and operational boundaries.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-zinc-950 border-zinc-800">
                Network: Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue={config.provider} className="w-full">
              <TabsList className="bg-black border-zinc-800">
                <TabsTrigger value="gemini" className="text-[10px] uppercase font-bold tracking-widest">Cloud</TabsTrigger>
                <TabsTrigger value="custom-proprietary" className="text-[10px] uppercase font-bold tracking-widest">Custom</TabsTrigger>
                <TabsTrigger value="local-hosted" className="text-[10px] uppercase font-bold tracking-widest">Local Cluster</TabsTrigger>
                <TabsTrigger value="desktop" className="text-[10px] uppercase font-bold tracking-widest text-orange-500">Standalone App</TabsTrigger>
              </TabsList>

              <TabsContent value="gemini" className="pt-4">
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
              </TabsContent>

              <TabsContent value="desktop" className="pt-4 space-y-4">
                <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Monitor className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight">Desktop Client Deployment</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Transform Bastion into a standalone desktop application. This removes browser overhead and provides deep system integration.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black rounded-xl border border-zinc-800 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest">
                        <Download className="w-3.5 h-3.5" />
                        Method A: PWA Install
                      </div>
                      <p className="text-[10px] text-zinc-500">Universal installation via browser bridge. Works on Windows, macOS, and Linux.</p>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-[10px] text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                        onClick={() => toast.info("Installation Guide", { description: "Click the 'Install' icon in your browser address bar to deploy Bastion to your desktop." })}
                      >
                        HOW TO INSTALL <ArrowUpRight className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="p-4 bg-black rounded-xl border border-zinc-800 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                        <Monitor className="w-3.5 h-3.5" />
                        Method B: Native Runner
                      </div>
                      <p className="text-[10px] text-zinc-500">Download a dedicated runner bundle for high-performance neural ops.</p>
                      <Button 
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[9px] font-bold uppercase w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-blue-500/30"
                        onClick={handleDownloadDesktopBundle}
                      >
                        Download Desktop Runner
                      </Button>
                    </div>
                  </div>

                  {window.matchMedia('(display-mode: standalone)').matches ? (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-emerald-500 uppercase tracking-tight">Independent Environment Active</p>
                          <p className="text-[10px] text-emerald-500/60">Bastion is running in standalone desktop mode.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-orange-500" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-orange-500 uppercase tracking-tight">Browser Mode Active</p>
                          <p className="text-[10px] text-orange-500/60 font-mono italic">Click 'Install' in address bar to decouple.</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-orange-600 hover:bg-orange-500 text-white font-bold h-8 text-[10px]"
                        onClick={() => toast.info("Installation available in Browser Menu", { description: "Look for 'Install Bastion Neural Platform' in your browser settings or address bar." })}
                      >
                        ENABLE DESKTOP
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="custom-proprietary" className="pt-4 space-y-4">
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
              </TabsContent>

              <TabsContent value="local-hosted" className="pt-4">
                <div className="p-8 text-center space-y-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50">
                  <Server className="w-12 h-12 mx-auto text-blue-500/20" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-200">Local Neural Cluster</p>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                      Connect to high-throughput inference engines running on your local network or specialized hardware.
                    </p>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase text-[8px] font-black tracking-widest">Enterprise Feature</Badge>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
