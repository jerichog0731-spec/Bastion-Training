import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Workflow, 
  BarChart3, 
  Settings, 
  Plus, 
  PlusCircle, 
  Bot, 
  Play, 
  History,
  Shield,
  Layers,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Zap,
  BookOpen,
  LayoutGrid,
  Wand2,
  BrainCircuit,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Types and Constants (Inline for simplicity or imported)
import { 
  AgentConfig, 
  DeploymentHistory, 
  AnalyticsData, 
  Skill, 
  AgentTemplate, 
  AgentVersion, 
  TrainingJob,
  OrchestratorConfig,
  TutoringSession
} from './types';
import { PREBUILT_MODULES, WORK_SKILLS, AGENT_TEMPLATES, ICON_MAP, CORE_AI_MODELS } from './constants';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Builder from './components/Builder';
import Analytics from './components/Analytics';
import Simulator from './components/Simulator';
import TrainingView, { generateDummyMetrics } from './components/TrainingView';
import VersionControl from './components/VersionControl';
import { GeminiOrchestrator } from './components/GeminiOrchestrator';
import { UniversalOrchestrator } from './components/UniversalOrchestrator';
import BastionView from './components/BastionView';
import OrchestratorSettings from './components/OrchestratorSettings';
import TutoringLab from './components/TutoringLab';
import TemplatesView from './components/TemplatesView';
import HardwareIntelligenceMonitor from './components/HardwareIntelligenceMonitor';
import BastionLogo from './components/BastionLogo';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agents, setAgents] = useState<AgentConfig[]>([
    {
      id: 'agent-1',
      name: 'Customer Support Assistant',
      description: 'Handles basic customer queries and redirects complex issues.',
      systemInstruction: 'You are a helpful customer support agent.',
      modules: PREBUILT_MODULES.slice(0, 2),
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 3600000,
      version: '1.2.0'
    }
  ]);
  const [jobs, setJobs] = useState<TrainingJob[]>([
    {
      id: 'job-1',
      agentId: 'agent-1',
      agentName: 'Customer Support Assistant',
      methodology: 'SFT',
      status: 'completed',
      progress: 100,
      startedAt: Date.now() - 86400000,
      completedAt: Date.now() - 86400000 + 3600000,
      metrics: generateDummyMetrics(50, 'SFT', 'A100'),
      config: { epochs: 3, learningRate: 0.0001, batchSize: 32, gpuType: 'A100', gpuCount: 1, protocol: 'NVLink', strategy: 'Data Parallel' }
    }
  ]);
  const [versions, setVersions] = useState<AgentVersion[]>([
    {
      id: 'v-1',
      agentId: 'agent-1',
      version: '1.2.0',
      tag: 'prod',
      description: 'Initial stable release with basic support logic.',
      config: { ...agents[0] },
      createdAt: Date.now() - 3600000 * 2
    },
    {
      id: 'v-2',
      agentId: 'agent-1',
      version: '1.1.0',
      tag: 'legacy',
      description: 'Prototype version with minimal instruction set.',
      config: { ...agents[0], version: '1.1.0', systemInstruction: 'Minimal bot.' },
      createdAt: Date.now() - 86400000 * 3
    }
  ]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [orchestratorConfig, setOrchestratorConfig] = useState<OrchestratorConfig>({
    provider: 'gemini',
    modelName: 'gemini-1.5-flash',
    parameters: {}
  });
  const [tutoringSessions, setTutoringSessions] = useState<TutoringSession[]>([]);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [newAgentMetadata, setNewAgentMetadata] = useState({ 
    name: '', 
    description: '', 
    coreModel: 'New neural network',
    systemInstruction: 'You are an autonomous agent designed to solve complex tasks using neural modules.' 
  });

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const handleCreateAgent = () => {
    const newAgent: AgentConfig = {
      id: `agent-${Date.now()}`,
      name: newAgentMetadata.name || 'Untitled Neural Agent',
      description: newAgentMetadata.description || 'Custom defined neural pipeline.',
      coreModel: newAgentMetadata.coreModel,
      systemInstruction: newAgentMetadata.systemInstruction,
      modules: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '1.0.0'
    };

    setAgents([...agents, newAgent]);
    setSelectedAgentId(newAgent.id);
    setIsCreatingAgent(false);
    setNewAgentMetadata({ 
      name: '', 
      description: '', 
      coreModel: 'Gemini 1.5 Flash',
      systemInstruction: 'You are an autonomous agent designed to solve complex tasks using neural modules.' 
    });
    setActiveTab('builder');
    toast.success(`Agent "${newAgent.name}" initialized.`);
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30 overflow-y-auto dark">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <BastionLogo size={32} />
            <h1 className="font-bold text-xl tracking-tight">BASTION</h1>
          </div>
          
          <HardwareIntelligenceMonitor />
        </div>

        <ScrollArea className="flex-1">
          <nav className="px-4 py-4 space-y-1">
            <SidebarItem 
              icon={<LayoutDashboard className="w-4 h-4" />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
            />
          <SidebarItem 
            icon={<LayoutGrid className="w-4 h-4" />} 
            label="Templates" 
            active={activeTab === 'templates'} 
            onClick={() => setActiveTab('templates')}
          />
          <SidebarItem 
            icon={<Terminal className="w-4 h-4" />} 
            label="Bastion Research" 
            active={activeTab === 'bastion'} 
            onClick={() => setActiveTab('bastion')}
          />
          <SidebarItem 
            icon={<Wand2 className="w-4 h-4" />} 
            label="Neural Skills" 
            active={activeTab === 'skills'} 
            onClick={() => setActiveTab('skills')}
          />
          <SidebarItem 
            icon={<BrainCircuit className="w-4 h-4" />} 
            label="Training Lab" 
            active={activeTab === 'training'} 
            onClick={() => setActiveTab('training')}
          />
          <SidebarItem 
            icon={<BookOpen className="w-4 h-4" />} 
            label="Tutoring Lab" 
            active={activeTab === 'tutoring-lab'} 
            onClick={() => setActiveTab('tutoring-lab')}
          />
          <SidebarItem 
            icon={<Shield className="w-4 h-4" />} 
            label="Orchestrator" 
            active={activeTab === 'orchestrator-settings'} 
            onClick={() => setActiveTab('orchestrator-settings')}
          />
          <SidebarItem 
            icon={<Sparkles className="w-4 h-4" />} 
            label="Agent Assistant" 
            active={activeTab === 'orchestrator'} 
            onClick={() => setActiveTab('orchestrator')}
          />
          <SidebarItem 
            icon={<Workflow className="w-4 h-4" />} 
            label="Agent Builder" 
            active={activeTab === 'builder'} 
            onClick={() => setActiveTab('builder')}
          />
          <SidebarItem 
            icon={<BarChart3 className="w-4 h-4" />} 
            label="Analytics" 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')}
          />
          <SidebarItem 
            icon={<History className="w-4 h-4" />} 
            label="Deployments" 
            active={activeTab === 'deployments'} 
            onClick={() => setActiveTab('deployments')}
          />
        </nav>
      </ScrollArea>

        <div className="p-4 border-t border-zinc-800">
          <SidebarItem 
            icon={<Settings className="w-4 h-4" />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 border-bottom border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-sm">Workspace</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <span className="text-zinc-100 font-medium italic serif">
              {activeTab.charAt(0).toUpperCase()}
              {activeTab.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'builder' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-orange-600/10 border-orange-500/30 text-orange-500 hover:bg-orange-500/20"
                onClick={() => {
                  const [major, minor, patch] = selectedAgent.version.split('.').map(Number);
                  const newVersion = `${major}.${minor}.${patch + 1}`;
                  const snapshot: AgentVersion = {
                    id: `v-${Date.now()}`,
                    agentId: selectedAgent.id,
                    version: newVersion,
                    description: `Manually triggered snapshot of ${selectedAgent.name}`,
                    config: { ...selectedAgent, version: newVersion },
                    createdAt: Date.now()
                  };
                  setVersions([snapshot, ...versions]);
                  setAgents(prev => prev.map(a => a.id === selectedAgent.id ? { ...a, version: newVersion } : a));
                  toast.success(`Snapshot v${newVersion} created`);
                }}
              >
                <History className="w-4 h-4 mr-2" />
                Snapshot Config
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
              onClick={() => setIsCreatingAgent(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-600" />
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-8 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <Dashboard agents={agents} onSelectAgent={(id) => { setSelectedAgentId(id); setActiveTab('builder'); }} onCreateNew={() => setIsCreatingAgent(true)} />}
                {activeTab === 'templates' && <TemplatesView onDeploy={(templateId, customizedModel, extraModules) => { 
                  const template = AGENT_TEMPLATES.find(t => t.id === templateId);
                  if (!template) return;
                  
                  const newAgent: AgentConfig = {
                    id: `agent-${Date.now()}`,
                    name: Math.random() > 0.5 ? `${template.name} - Custom` : template.name,
                    description: template.description,
                    coreModel: customizedModel || template.defaultModel || 'Gemini 1.5 Pro',
                    systemInstruction: template.systemPrompt,
                    modules: [
                      ...PREBUILT_MODULES.filter(m => template.modules.includes(m.id)),
                      ...PREBUILT_MODULES.filter(m => extraModules?.includes(m.id))
                    ],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    version: '1.0.0',
                    language: 'Python' // Default for templates
                  };
                  setAgents([...agents, newAgent]);
                  setSelectedAgentId(newAgent.id);
                  setActiveTab('builder');
                  toast.success(`${template.name} deployed successfully`);
                }} />}
                {activeTab === 'bastion' && <BastionView />}
                {activeTab === 'skills' && <SkillsView onInstall={(skill) => {
                  toast.success(`Skill "${skill.name}" integrated into neural architecture.`);
                }} />}
                {activeTab === 'tutoring-lab' && (
                  <TutoringLab 
                    agents={agents} 
                    sessions={tutoringSessions} 
                    onStartSession={(s) => setTutoringSessions([s as TutoringSession, ...tutoringSessions])} 
                  />
                )}
                {activeTab === 'orchestrator-settings' && (
                  <OrchestratorSettings 
                    config={orchestratorConfig} 
                    onUpdate={setOrchestratorConfig} 
                  />
                )}
                {activeTab === 'training' && <TrainingView agents={agents} jobs={jobs} setJobs={setJobs} />}
                {activeTab === 'orchestrator' && (
                  <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] min-h-[600px] flex flex-col">
                    <UniversalOrchestrator 
                      agents={agents} 
                      orchestratorConfig={orchestratorConfig}
                      onUpdateAgent={(id, updates) => setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))}
                      onStartTraining={(id, config) => {
                        const agent = agents.find(a => a.id === id);
                        const methodology = 'SFT'; // Default
                        const newJob: TrainingJob = {
                          id: `job-ai-${Date.now()}`,
                          agentId: id,
                          agentName: agent?.name || 'AI Requested Job',
                          methodology,
                          status: 'training',
                          progress: 0,
                          startedAt: Date.now(),
                          metrics: [],
                          config: {
                            epochs: config.epochs || 3,
                            learningRate: config.learningRate || 0.0001,
                            batchSize: 32,
                            gpuType: 'A100',
                            gpuCount: 1,
                            protocol: 'NVLink',
                            strategy: 'Data Parallel'
                          }
                        };
                        setJobs([newJob, ...jobs]);
                        setActiveTab('training');
                        toast.success(`Neural training core engaged for ${agent?.name}`);
                      }}
                    />
                  </div>
                )}
                {activeTab === 'builder' && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                      <Builder 
                        agent={selectedAgent} 
                        onUpdate={(updates) => setAgents(prev => prev.map(a => a.id === selectedAgent.id ? { ...a, ...updates } : a))}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <Simulator agent={selectedAgent} />
                    </div>
                  </div>
                )}
                {activeTab === 'analytics' && <Analytics />}
                {activeTab === 'deployments' && (
                  <VersionControl 
                    agent={selectedAgent} 
                    versions={versions} 
                    onRestore={(v) => {
                      setAgents(prev => prev.map(a => a.id === v.agentId ? { ...v.config, updatedAt: Date.now() } : a));
                      setTimeout(() => toast.success(`Configuration reverted to v${v.version}`), 100);
                    }}
                    onDelete={(vid) => {
                      setVersions(prev => prev.filter(v => v.id !== vid));
                      toast.info("Version snapshot removed");
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </main>

      <Toaster position="bottom-right" theme="dark" />

      {/* Agent Creation Dialog */}
      <Dialog open={isCreatingAgent} onOpenChange={setIsCreatingAgent}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-orange-500">
              <PlusCircle className="w-7 h-7" />
              Forge New Neural Agent
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Define the foundational core of your new autonomous entity.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-zinc-500">Identity Name</Label>
                  <Input 
                    placeholder="e.g., Medical Diag-v1" 
                    className="bg-zinc-900 border-zinc-800 focus:border-orange-500/50 h-11"
                    value={newAgentMetadata.name}
                    onChange={(e) => setNewAgentMetadata({ ...newAgentMetadata, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-zinc-500">Base Neural Language</Label>
                  <Select 
                    value={newAgentMetadata.language || 'JAX'}
                    onValueChange={(val: any) => setNewAgentMetadata({ ...newAgentMetadata, language: val })}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:border-orange-500/50 h-11">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectItem value="JAX">JAX (High Performance)</SelectItem>
                      <SelectItem value="PyTorch">PyTorch (Dynamic Graphs)</SelectItem>
                      <SelectItem value="Flax">Flax (Stable Diffusion Compatible)</SelectItem>
                      <SelectItem value="Python">Python (Standard Scripting)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-zinc-500">Core Mission Brief</Label>
                <Input 
                  placeholder="Briefly describe the purpose..." 
                  className="bg-zinc-900 border-zinc-800 focus:border-orange-500/50 h-11"
                  value={newAgentMetadata.description}
                  onChange={(e) => setNewAgentMetadata({ ...newAgentMetadata, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-zinc-500">Core AI Intelligence Model</Label>
                <Select 
                  value={newAgentMetadata.coreModel}
                  onValueChange={(val) => setNewAgentMetadata({ ...newAgentMetadata, coreModel: val })}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:border-orange-500/50 h-11">
                    <SelectValue placeholder="Select a foundational model" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    {CORE_AI_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs uppercase font-bold text-zinc-500">System Instruction</Label>
                  <span className="text-[10px] text-zinc-600 italic">Behavioral core logic</span>
                </div>
                <textarea 
                  placeholder="Define the agent's behavior and constraints..." 
                  className="w-full min-h-[120px] bg-zinc-900 border border-zinc-800 rounded-md p-3 text-sm focus:border-orange-500/50 outline-none transition-all placeholder:text-zinc-700"
                  value={newAgentMetadata.systemInstruction}
                  onChange={(e) => setNewAgentMetadata({ ...newAgentMetadata, systemInstruction: e.target.value })}
                />
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="pt-2 border-t border-zinc-800">
            <Button variant="ghost" onClick={() => setIsCreatingAgent(false)} className="text-zinc-500 hover:text-white">Abort</Button>
            <Button className="bg-orange-600 hover:bg-orange-500 text-white min-w-[120px]" onClick={handleCreateAgent}>Initialize Agent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
        active 
          ? "bg-orange-600/10 text-orange-500" 
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      )}
    >
      <span className={cn(
        "transition-transform",
        active ? "text-orange-500" : "text-zinc-500 group-hover:text-zinc-300"
      )}>
        {icon}
      </span>
      {label}
    </button>
  );
}

// Sub-components (Placeholders for now, will modularize)
function Dashboard({ agents, onSelectAgent, onCreateNew }: { agents: AgentConfig[], onSelectAgent: (id: string) => void, onCreateNew: () => void }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-white">Agent Fleet</h2>
        <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest opacity-70 italic serif">Mission Control & Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => (
          <Card key={agent.id} className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all cursor-pointer group" onClick={() => onSelectAgent(agent.id)}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 group-hover:text-orange-500 transition-colors">
                  <Bot className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="text-xs border-zinc-700 bg-zinc-950 font-mono">v{agent.version}</Badge>
              </div>
              <CardTitle className="text-xl text-zinc-100 group-hover:text-orange-500 transition-colors">{agent.name}</CardTitle>
              <CardDescription className="line-clamp-2 text-zinc-500 leading-normal">{agent.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-500">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950 rounded border border-zinc-800">
                  <BrainCircuit className="w-3 h-3 text-orange-500" />
                  {agent.coreModel || 'GPT-4o'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  {agent.modules.length} Nodes
                </div>
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Updated 2h ago
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <button 
          onClick={onCreateNew}
          className="border-2 border-dashed border-zinc-800 rounded-xl hover:border-zinc-700 hover:bg-zinc-900/40 transition-all flex flex-col items-center justify-center p-8 gap-3 min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-500">
            <Plus className="w-6 h-6" />
          </div>
          <p className="text-zinc-500 font-medium">Create New Agent</p>
        </button>
      </div>
    </div>
  );
}



function Deployments() {
  const deployments: DeploymentHistory[] = [
    { 
      id: 'd-1', 
      version: '1.2.0', 
      deployedAt: Date.now() - 3600000 * 2, 
      status: 'active',
      config: {} as any
    },
    { 
      id: 'd-2', 
      version: '1.1.5', 
      deployedAt: Date.now() - 86400000 * 3, 
      status: 'archived',
      config: {} as any
    },
    { 
      id: 'd-3', 
      version: '1.1.0', 
      deployedAt: Date.now() - 86400000 * 10, 
      status: 'archived',
      config: {} as any
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-white">Version Control</h2>
        <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest opacity-70 italic serif">Deployment Logs & History</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/50">
              <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Version</th>
              <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Deployment Date</th>
              <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((d) => (
              <tr key={d.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                <td className="p-4 font-mono text-sm">v{d.version}</td>
                <td className="p-4 text-sm text-zinc-400">
                  {new Date(d.deployedAt).toLocaleDateString()} at {new Date(d.deployedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="p-4">
                  <Badge 
                    variant={d.status === 'active' ? 'default' : 'secondary'} 
                    className={cn(
                      "text-[10px] uppercase font-bold",
                      d.status === 'active' ? "bg-emerald-500/20 text-emerald-400 border-none" : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {d.status}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm" className="h-8 text-xs hover:text-orange-500">
                    <History className="w-3.5 h-3.5 mr-2" />
                    Rollback
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SkillsView({ onInstall }: { onInstall: (s: Skill) => void }) {
  const categories = Array.from(new Set(WORK_SKILLS.map(s => s.category)));

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-white">Neural Skill Matrix</h2>
        <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest opacity-70 italic serif">Available Knowledge Modules for App Dev</p>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-bold text-orange-500 uppercase tracking-[0.2em] whitespace-nowrap">{category}</h3>
            <div className="h-px w-full bg-orange-500/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WORK_SKILLS.filter(s => s.category === category).map(skill => {
              const Icon = ICON_MAP[skill.icon] || Zap;
              return (
                <div 
                  key={skill.id} 
                  onClick={() => onInstall(skill)}
                  className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 cursor-pointer transition-all flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-orange-500 group-hover:border-orange-500/30 transition-all shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-semibold text-zinc-100 truncate">{skill.name}</h4>
                    <p className="text-[10px] text-zinc-500 leading-tight line-clamp-2">{skill.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
