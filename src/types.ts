export interface PropertySchema {
  id: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'button';
  description?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface AgentModule {
  id: string;
  type: 'trigger' | 'action' | 'logic' | 'output' | 'optimization';
  name: string;
  description: string;
  icon: string;
  config: Record<string, any>;
  schema?: PropertySchema[]; // Metadata for building the config UI
  dependencies?: string[]; // IDs of modules this module depends on
}

export type OrchestratorProvider = 'gemini' | 'custom-proprietary' | 'local-hosted' | 'custom-model-vault';

export interface CustomModel {
  id: string;
  name: string;
  type: 'LLM' | 'Vision' | 'Audio' | 'Custom';
  path?: string; // Local path for desktop app
  file?: string; // Uploaded filename
  format: 'GGUF' | 'ONNX' | 'SafeTensors' | 'Other';
  parameters?: number; // e.g. 7.0 for 7B
  uploadedAt: number;
}

export interface OrchestratorConfig {
  provider: OrchestratorProvider;
  endpoint?: string;
  apiKey?: string;
  modelName: string;
  parameters: Record<string, any>;
}

export interface WorkspaceConfig {
  orchestrator: OrchestratorConfig;
  theme: 'dark' | 'light' | 'system';
  computeRegion: string;
  experimentalFeatures: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  coreModel?: string; // e.g., 'Stable Diffusion', 'Whisper', 'ElevenLabs'
  language?: 'JAX' | 'PyTorch' | 'Flax' | 'Python';
  systemInstruction: string;
  modules: AgentModule[];
  createdAt: number;
  updatedAt: number;
  version: string;
}

export interface TutoringSession {
  id: string;
  teacherAgentId: string;
  studentAgentId: string;
  subject: string;
  status: 'active' | 'completed' | 'paused';
  insightsGenerated: number;
  lastIteration: number;
  createdAt: number;
}

export interface DeploymentHistory {
  id: string;
  version: string;
  deployedAt: number;
  config: AgentConfig;
  status: 'active' | 'archived';
}

export interface AnalyticsData {
  timestamp: number;
  requests: number;
  latency: number;
  successRate: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  systemPrompt: string;
  modules: string[]; // IDs of prebuilt modules
  icon: string;
  defaultModel?: string;
}

export type TrainingMethodology = 'SFT' | 'RLHF' | 'PPO' | 'DPO';
export type GPUType = 'T4' | 'L4' | 'A100' | 'H100';

export interface TrainingMetric {
  step: number;
  epoch: number;
  loss?: number;
  reward?: number;
  accuracy?: number;
  learningRate?: number;
  vramUsage?: number; // In GB
  gpuTemp?: number;   // In Celsius
  gpuPower?: number;  // In Watts
  gpuUtilization?: number; // 0 to 100 (%)
  npuLoad?: number;        // 0 to 100 (%)
  npuTemp?: number;        // In Celsius
  timestamp: number;
}

export interface AgentVersion {
  id: string;
  agentId: string;
  version: string;
  tag?: string; // e.g., 'beta', 'prod'
  description: string;
  config: AgentConfig;
  createdAt: number;
}

export interface TrainingJob {
  id: string;
  agentId: string;
  agentName: string;
  methodology: TrainingMethodology;
  status: 'queued' | 'training' | 'completed' | 'failed';
  progress: number; // 0 to 100
  currentEpoch?: number;
  totalEpochs?: number;
  currentStep?: number;
  totalSteps?: number;
  metrics: TrainingMetric[];
  startedAt: number;
  completedAt?: number;
  config: {
    epochs?: number;
    learningRate: number;
    batchSize: number;
    rewardModel?: string;
    gpuType: GPUType;
    gpuCount: number;
    protocol?: 'NVLink' | 'InfiniBand' | 'PCIe';
    strategy?: 'Data Parallel' | 'Model Parallel' | 'Zero Redundancy';
  };
}
