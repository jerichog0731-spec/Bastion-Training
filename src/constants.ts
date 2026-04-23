import { AgentModule, Skill, AgentTemplate } from './types';

export const PREBUILT_MODULES: AgentModule[] = [
  {
    id: 'web-search',
    type: 'action',
    name: 'Web Search',
    description: 'Enables the agent to search the internet for real-time information.',
    icon: 'Search',
    config: { depth: 'normal', region: 'us' },
    schema: [
      { 
        id: 'depth', 
        label: 'Search Depth', 
        type: 'select', 
        required: true,
        options: [
          { value: 'normal', label: 'Normal - Faster' },
          { value: 'deep', label: 'Deep - More detailed' }
        ]
      },
      { id: 'region', label: 'Search Region', type: 'string', placeholder: 'e.g., us, uk, jp' }
    ],
    dependencies: []
  },
  {
    id: 'memory-storage',
    type: 'logic',
    name: 'Short-term Memory',
    description: 'Stores recent conversation context for better coherence.',
    icon: 'Database',
    config: { limit: 10, persist: false },
    schema: [
      { id: 'limit', label: 'Message Limit', type: 'number', required: true, min: 1, max: 100 },
      { id: 'persist', label: 'Persistent Storage', type: 'boolean' }
    ],
    dependencies: []
  },
  {
    id: 'code-interpreter',
    type: 'action',
    name: 'Code Runner',
    description: 'Allows the agent to execute Python code for calculations or data processing.',
    icon: 'Code',
    config: { timeout: 30, environment: 'standard' },
    schema: [
      { id: 'timeout', label: 'Execution Timeout (s)', type: 'number', required: true, min: 1, max: 300 },
      { 
        id: 'environment', 
        label: 'Runtime Env', 
        type: 'select',
        options: [
          { value: 'standard', label: 'Standard Python 3.10' },
          { value: 'data-science', label: 'Data Science (Pandas, Numpy)' }
        ]
      }
    ],
    dependencies: []
  },
  {
    id: 'sentiment-analysis',
    type: 'logic',
    name: 'Sentiment Filter',
    description: 'Detects user emotion to adjust agent tone.',
    icon: 'Zap',
    config: { sensitivity: 0.8, mode: 'detailed' },
    schema: [
      { id: 'sensitivity', label: 'Detection Sensitivity', type: 'number', required: true, min: 0, max: 1 },
      { id: 'mode', label: 'Analysis Mode', type: 'select', options: [{value: 'simple', label: 'Binary'}, {value: 'detailed', label: '7-Factor'}]}
    ],
    dependencies: []
  },
  {
    id: 'api-connector',
    type: 'output',
    name: 'Webhook Output',
    description: 'Sends the agent result to an external API endpoint.',
    icon: 'Globe',
    config: { url: '', method: 'POST', auth: 'none' },
    schema: [
      { id: 'url', label: 'Endpoint URL', type: 'string', required: true, placeholder: 'https://api.example.com/webhook' },
      { id: 'method', label: 'HTTP Method', type: 'select', options: [{value: 'GET', label: 'GET'}, {value: 'POST', label: 'POST'}, {value: 'PUT', label: 'PUT'}]},
      { id: 'headers', label: 'Custom Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer ..."}' }
    ],
    dependencies: []
  },
  {
    id: 'summarizer',
    type: 'logic',
    name: 'Auto-Summarize',
    description: 'Automatically condenses long inputs before processing.',
    icon: 'FileText',
    config: { maxLength: 500, focus: 'key-points' },
    schema: [
      { id: 'maxLength', label: 'Max Length (Chars)', type: 'number', required: true, min: 100, max: 5000 },
      { id: 'focus', label: 'Concentration', type: 'select', options: [{value: 'narrative', label: 'Narrative Flow'}, {value: 'key-points', label: 'Bullet Points'}]}
    ],
    dependencies: []
  },
  {
    id: 'quantization',
    type: 'optimization',
    name: 'INT8 Quantization',
    description: 'Reduces precision of weights from FP32 to INT8 to decrease model size and latency.',
    icon: 'Shrink',
    config: { symmetric: true, algorithm: 'percentile' },
    schema: [
      { id: 'symmetric', label: 'Symmetric Quantization', type: 'boolean' },
      { 
        id: 'algorithm', 
        label: 'Calibration Algorithm', 
        type: 'select', 
        options: [{value: 'percentile', label: 'Percentile'}, {value: 'entropy', label: 'Entropy'}, {value: 'minmax', label: 'Min/Max'}]
      }
    ],
    dependencies: []
  },
  {
    id: 'pruning',
    type: 'optimization',
    name: 'Neural Pruning',
    description: 'Removes redundant neurons and connections based on weight magnitude.',
    icon: 'Scissors',
    config: { sparsity: 0.5, method: 'unstructured' },
    schema: [
      { id: 'sparsity', label: 'Target Sparsity', type: 'number', required: true, min: 0, max: 0.99 },
      { id: 'method', label: 'Pruning Method', type: 'select', options: [{value: 'unstructured', label: 'Unstructured'}, {value: 'structured', label: 'Structured (Channel)'}]}
    ],
    dependencies: []
  },
  {
    id: 'distillation',
    type: 'optimization',
    name: 'Knowledge Distillation',
    description: 'Trains a smaller student model to mimic a larger teacher model.',
    icon: 'Microscope',
    config: { temperature: 2.0, alpha: 0.5 },
    schema: [
      { id: 'temperature', label: 'Softmax Temperature', type: 'number', required: true, min: 1, max: 10 },
      { id: 'alpha', label: 'Student Loss Alpha', type: 'number', required: true, min: 0, max: 1 }
    ],
    dependencies: []
  },
  // Neural Frameworks
  {
    id: 'jax-engine',
    type: 'action',
    name: 'JAX Accelerator',
    description: 'High-performance numerical computing with JIT compilation via XLA.',
    icon: 'Zap',
    config: { precision: 'float32', backend: 'gpu' },
    schema: [
      { id: 'precision', label: 'Numerical Precision', type: 'select', options: [{value: 'float32', label: 'Float32'}, {value: 'bfloat16', label: 'BFloat16'}] },
      { id: 'backend', label: 'Hardware Backend', type: 'select', options: [{value: 'gpu', label: 'NVIDIA GPU'}, {value: 'tpu', label: 'Google TPU'}] }
    ]
  },
  {
    id: 'pytorch-node',
    type: 'action',
    name: 'PyTorch Core',
    description: 'Dynamic computational graphs for deep learning research and deployment.',
    icon: 'Layers',
    config: { version: '2.1', distributed: false },
    schema: [
      { id: 'version', label: 'PyTorch Version', type: 'string' },
      { id: 'distributed', label: 'Enable DDP', type: 'boolean' }
    ]
  },
  // Neural Layers
  {
    id: 'dense-layer',
    type: 'logic',
    name: 'Dense (Linear) Layer',
    description: 'Standard fully-connected weighted neural connection.',
    icon: 'Settings',
    config: { units: 128, activation: 'relu' },
    schema: [
      { id: 'units', label: 'Neurons', type: 'number', required: true },
      { id: 'activation', label: 'Activation Fn', type: 'select', options: [{value: 'relu', label: 'ReLU'}, {value: 'gelu', label: 'GELU'}, {value: 'sigmoid', label: 'Sigmoid'}] }
    ]
  },
  {
    id: 'conv2d-layer',
    type: 'logic',
    name: 'Conv2D Layer',
    description: '2D Convolutional layer for extracting spatial features from images/grids.',
    icon: 'LayoutGrid',
    config: { filters: 32, kernelSize: 3 },
    schema: [
      { id: 'filters', label: 'Filters', type: 'number' },
      { id: 'kernelSize', label: 'Kernel Size', type: 'number' }
    ]
  },
  {
    id: 'attention-block',
    type: 'logic',
    name: 'Multi-Head Attention',
    description: 'Enables the model to focus on different segments of input sequences simultaneously.',
    icon: 'Activity',
    config: { heads: 8, dim: 512 },
    schema: [
      { id: 'heads', label: 'Attention Heads', type: 'number' },
      { id: 'dim', label: 'Model Dimension', type: 'number' }
    ]
  },
  // Generative Capabilities
  {
    id: 'stable-diffusion',
    type: 'output',
    name: 'Image Synthesis (SDXL)',
    description: 'Generates high-fidelity images from textual descriptions.',
    icon: 'Palette',
    config: { steps: 30, cfg: 7.5 },
    schema: [
      { id: 'steps', label: 'Sampling Steps', type: 'number' },
      { id: 'cfg', label: 'Guidance Scale', type: 'number' }
    ]
  },
  {
    id: 'whisper-stt',
    type: 'logic',
    name: 'Whisper STT',
    description: 'Converts multi-lingual audio input into precise text transcripts.',
    icon: 'Mic',
    config: { model: 'large-v3', language: 'auto' },
    schema: [
      { id: 'model', label: 'Whisper Model Size', type: 'select', options: [{value: 'base', label: 'Base'}, {value: 'medium', label: 'Medium'}, {value: 'large-v3', label: 'Large V3'}] }
    ]
  },
  {
    id: 'elevenlabs-tts',
    type: 'output',
    name: 'ElevenLabs TTS',
    description: 'High-quality neural voice synthesis with emotional inflection.',
    icon: 'Volume2',
    config: { voiceId: 'josh', stability: 0.5 },
    schema: [
      { id: 'voiceId', label: 'Voice Profile', type: 'string' },
      { id: 'stability', label: 'Voice Stability', type: 'number' }
    ]
  },
  // Memory Architectures
  {
    id: 'vector-memory',
    type: 'logic',
    name: 'Vector/Semantic Memory',
    description: 'Long-term retrieval via embeddings and cosine similarity (RAG).',
    icon: 'Database',
    config: { provider: 'pinecone', topK: 5 },
    schema: [
      { id: 'provider', label: 'Vector DB', type: 'select', options: [{value: 'pinecone', label: 'Pinecone'}, {value: 'milvus', label: 'Milvus'}, {value: 'local', label: 'In-Memory FAISS'}] },
      { id: 'topK', label: 'Results Count', type: 'number' }
    ]
  },
  {
    id: 'episodic-memory',
    type: 'logic',
    name: 'Episodic Store',
    description: 'Retains specific chronological events and user experiences.',
    icon: 'History',
    config: { retention: 'infinite' },
    schema: [
      { id: 'retention', label: 'Data Retention', type: 'select', options: [{value: '7d', label: '7 Days'}, {value: 'infinite', label: 'Permanent'}] }
    ]
  },
  // Data Export
  {
    id: 'jsonl-exporter',
    type: 'output',
    name: 'Neural Exporter (JSONL)',
    description: 'Transfers processed data and synthetic datasets into JSONL or Parquet files.',
    icon: 'Download',
    config: { format: 'jsonl', compressed: true },
    schema: [
      { id: 'format', label: 'Export Format', type: 'select', options: [{value: 'jsonl', label: 'JSON Lines'}, {value: 'parquet', label: 'Parquet'}, {value: 'csv', label: 'CSV Stats'}] },
      { id: 'compressed', label: 'Gzip Compression', type: 'boolean' }
    ]
  },
  {
    id: 'numpy-engine',
    type: 'action',
    name: 'NumPy Engine',
    description: 'Fundamental array processing and linear algebra for scratch neural networks.',
    icon: 'Calculator',
    config: { version: '1.24', precision: 'float64' },
    schema: [
      { id: 'version', label: 'NumPy Version', type: 'string' },
      { id: 'precision', label: 'Default Precision', type: 'select', options: [{value: 'float64', label: 'Float64 (High)'}, {value: 'float32', label: 'Float32 (Standard)'}] }
    ]
  },
  {
    id: 'edge-compiler',
    type: 'output',
    name: 'Edge Compiler',
    description: 'Compiles your trained Daedalus pipeline into high-performance StableHLO for edge deployment.',
    icon: 'Cpu',
    config: { precision: 'float16', seqLength: 512 },
    schema: [
      { 
        id: 'precision', 
        label: 'Weight Precision', 
        type: 'select', 
        options: [{value: 'float16', label: 'Float16'}, {value: 'bfloat16', label: 'BFloat16'}] 
      },
      { 
        id: 'seqLength', 
        label: 'Sequence Context', 
        type: 'number', 
        min: 128, 
        max: 4096, 
        required: true 
      },
      {
        id: 'compile-trigger',
        label: 'Neural Compilation',
        type: 'button',
        description: 'Compiles graph to StableHLO'
      }
    ]
  }
];

export const WORK_SKILLS: Skill[] = [
  // Development
  { id: 'sk-1', name: 'Code Debugging', description: 'Expertise in identifying and fixing runtime errors.', category: 'Development', icon: 'Bug' },
  { id: 'sk-15', name: 'Git Workflow', description: 'Managing complex branching and merge strategies.', category: 'Development', icon: 'GitBranch' },
  { id: 'sk-18', name: 'Mobile Bundling', description: 'Preparing applications for iOS and Android stores.', category: 'Development', icon: 'Smartphone' },
  { id: 'sk-21', name: 'TypeScript mastery', description: 'Advanced type safety and design patterns.', category: 'Development', icon: 'Code' },
  
  // Backend
  { id: 'sk-4', name: 'Database Schema', description: 'Designing optimized RDBMS and NoSQL structures.', category: 'Backend', icon: 'Database' },
  { id: 'sk-8', name: 'SQL Optimization', description: 'Refactoring queries for maximum performance.', category: 'Backend', icon: 'Zap' },
  { id: 'sk-22', name: 'Redis Caching', description: 'Implementing high-speed in-memory data structures.', category: 'Backend', icon: 'Zap' },
  { id: 'sk-23', name: 'gRPC Services', description: 'Building high-performance microservices architecture.', category: 'Backend', icon: 'Zap' },

  // Frontend
  { id: 'sk-5', name: 'State Management', description: 'Handling complex UI data flows (Redux, Zustand).', category: 'Frontend', icon: 'Layers' },
  { id: 'sk-10', name: 'Tailwind Mastery', description: 'Expert use of utility-first CSS for rapid builds.', category: 'Frontend', icon: 'Wind' },
  { id: 'sk-11', name: 'Responsive Design', description: 'Ensuring fluid layouts across all devices.', category: 'Frontend', icon: 'MonitorSmartphone' },
  { id: 'sk-19', name: 'SEO Optimization', description: 'Implementing technical SEO for web crawlers.', category: 'Frontend', icon: 'Globe' },
  { id: 'sk-24', name: 'WebSockets/WebRTC', description: 'Real-time communication and P2P streaming.', category: 'Frontend', icon: 'Activity' },

  // DevOps
  { id: 'sk-7', name: 'CI/CD Pipelines', description: 'Automating build, test, and deploy cycles.', category: 'DevOps', icon: 'Infinity' },
  { id: 'sk-13', name: 'Load Balancing', description: 'Distributing traffic to ensure system uptime.', category: 'DevOps', icon: 'Network' },
  { id: 'sk-14', name: 'Error Logging', description: 'Centralizing system telemetry and crash reports.', category: 'DevOps', icon: 'Activity' },
  { id: 'sk-16', name: 'Deployment Orchestration', description: 'Managing containerized service rollouts.', category: 'DevOps', icon: 'Box' },
  { id: 'sk-20', name: 'Cloud Infra (GCP)', description: 'Spinning up serverless and compute resources.', category: 'DevOps', icon: 'Cloud' },
  { id: 'sk-25', name: 'Kubernetes (K8s)', description: 'Container orchestration at enterprise scale.', category: 'DevOps', icon: 'Box' },

  // Security
  { id: 'sk-6', name: 'OAuth Setup', description: 'Integrating third-party login flows (Google, GitHub).', category: 'Security', icon: 'ShieldCheck' },
  { id: 'sk-12', name: 'Security Audit', description: 'Identifying vulnerabilities in code and configs.', category: 'Security', icon: 'Lock' },
  { id: 'sk-26', name: 'Penetration Testing', description: 'Simulating cyberattacks to find system weaknesses.', category: 'Security', icon: 'Shield' },

  // Design
  { id: 'sk-9', name: 'UI Prototyping', description: 'Crafting high-fidelity mockups for new features.', category: 'Design', icon: 'PenTool' },
  { id: 'sk-27', name: 'Design Systems', description: 'Building scalable UI component libraries.', category: 'Design', icon: 'Layers' },
  { id: 'sk-28', name: 'Motion Design', description: 'Creating fluid animations and transitions.', category: 'Design', icon: 'Zap' },

  // Testing
  { id: 'sk-3', name: 'Unit Testing', description: 'Implementing robust test suites for logic validation.', category: 'Testing', icon: 'CheckCircle' },
  { id: 'sk-17', name: 'Performance Profiling', description: 'Detailed analysis of application bottlenecks.', category: 'Testing', icon: 'Gauge' },
  { id: 'sk-29', name: 'e2e Testing', description: 'End-to-end testing with Playwright or Cypress.', category: 'Testing', icon: 'CheckCircle' },

  // AI/ML
  { id: 'sk-30', name: 'Model Fine-tuning', description: 'Adapting LLMs to specific domains or styles.', category: 'AI/ML', icon: 'BrainCircuit' },
  { id: 'sk-31', name: 'Prompt Engineering', description: 'Optimizing inputs for maximum model coherence.', category: 'AI/ML', icon: 'Zap' },
  { id: 'sk-32', name: 'Vector Databases', description: 'Implementing RAG with Pinecone or Milvus.', category: 'AI/ML', icon: 'Database' }
];

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 't-1',
    name: 'The Code Sentinel',
    description: 'Automatically audits PRs for security flaws and performance leaks.',
    capabilities: ['Static Analysis', 'Dependency Audit', 'Performance Scoring'],
    systemPrompt: 'You are a senior security engineer. Your goal is to find flaws in code.',
    modules: ['code-interpreter', 'sentiment-analysis'],
    icon: 'Shield'
  },
  {
    id: 't-2',
    name: 'Documentation Genie',
    description: 'Turns messy source code into beautiful, searchable technical docs.',
    capabilities: ['Auto-generation', 'Markdown Export', 'Technical Writing'],
    systemPrompt: 'You transform code logic into clear human-readable documentation.',
    modules: ['summarizer', 'web-search'],
    icon: 'BookOpen'
  },
  {
    id: 't-3',
    name: 'Debugging Detective',
    description: 'An expert at root-cause analysis. Give it a stack trace, it find the bug.',
    capabilities: ['Log Parsing', 'Stack Trace Analysis', 'Resolution Suggestion'],
    systemPrompt: 'You identify the exact line of code causing a failure from logs.',
    modules: ['code-interpreter', 'memory-storage'],
    icon: 'Search'
  },
  {
    id: 't-4',
    name: 'UI Polish Expert',
    description: 'Reviews designs and frontend code to suggest better visual hierarchy.',
    capabilities: ['Accessibility Audit', 'Spacing Refactoring', 'Color Theory'],
    systemPrompt: 'You provide specific Tailwind CSS changes to improve UI quality.',
    modules: ['sentiment-analysis', 'web-search'],
    icon: 'Palette'
  },
  {
    id: 't-5',
    name: 'API Bridge Builder',
    description: 'Generates SDKs, client libraries, and documentation from API specs.',
    capabilities: ['SDK Generation', 'OpenAPI Parsing', 'Endpoint Mocking'],
    systemPrompt: 'You build stable bridges between backend services and frontend apps.',
    modules: ['api-connector', 'code-interpreter'],
    icon: 'Link'
  },
  {
    id: 't-6',
    name: 'Unit Test Architect',
    description: 'Automates the creation of high-coverage test suites for your logic.',
    capabilities: ['Edge Case Finding', 'Mocking setup', 'Coverage expansion'],
    systemPrompt: 'You write the most robust vitest suites imaginable for any logic snippet.',
    modules: ['code-interpreter', 'summarizer'],
    icon: 'CheckSquare'
  },
  {
    id: 't-7',
    name: 'SQL Refactor Sage',
    description: 'Makes your database queries fly by redesigning slow joins and indexes.',
    capabilities: ['Query Planning', 'Index Optimization', 'Schema Refactoring'],
    systemPrompt: 'You optimize SQL queries for sub-millisecond response times.',
    modules: ['code-interpreter', 'memory-storage'],
    icon: 'Database'
  },
  {
    id: 't-8',
    name: 'Deployment Pilot',
    description: 'Safely orchestrates multi-cloud deployments with automatic rollback.',
    capabilities: ['Traffic Shifting', 'Health Checks', 'Deployment Logs'],
    systemPrompt: 'You manage production deployments with 99.99% uptime goals.',
    modules: ['api-connector', 'sentiment-analysis'],
    icon: 'Navigation'
  },
  {
    id: 't-9',
    name: 'CVE Watchdog',
    description: 'Continuously monitors your app for newly discovered vulnerabilities.',
    capabilities: ['Real-time Monitoring', 'Alerting', 'Patch Suggestion'],
    systemPrompt: 'You are the first line of defense against 0-day exploits.',
    modules: ['web-search', 'api-connector'],
    icon: 'Eye'
  },
  {
    id: 't-10',
    name: 'Mock Data Factory',
    description: 'Generates millions of rows of realistic data for scale testing.',
    capabilities: ['Realistic Personas', 'JSON Schema fulfillment', 'Bulk Generation'],
    systemPrompt: 'You create structured, realistic mock data for stress testing.',
    modules: ['code-interpreter', 'summarizer'],
    icon: 'Factory'
  },
  {
    id: 't-11',
    name: 'Growth Architect',
    description: 'Analyzes user behavior funnels to suggest conversion-boosting A/B tests.',
    capabilities: ['Funnel Analysis', 'A/B Test Design', 'Growth Hacking'],
    systemPrompt: 'You identify bottlenecks in user journeys and suggest high-impact growth experiments.',
    modules: ['web-search', 'sentiment-analysis'],
    icon: 'Rocket'
  },
  {
    id: 't-12',
    name: 'Legal Guardian',
    description: 'Scans vendor contracts and TOS for risky clauses and "red flag" liabilities.',
    capabilities: ['Liability Detection', 'Risk Scoring', 'Clause Summarization'],
    systemPrompt: 'You act as a digital paralegal, highlighting potentially dangerous legal clauses.',
    modules: ['summarizer', 'memory-storage'],
    icon: 'Scale'
  },
  {
    id: 't-13',
    name: 'Talent Alchemist',
    description: 'Screens thousands of resumes against complex job requirements with bias-mitigation.',
    capabilities: ['Resume Parsing', 'Skill Matching', 'Bias Filtering'],
    systemPrompt: 'You objectively rank candidates based on technical merit while ensuring diversity and inclusion.',
    modules: ['summarizer', 'code-interpreter'],
    icon: 'Users'
  },
  {
    id: 't-14',
    name: 'Research Radar',
    description: 'Aggregates industry news and technical breakthroughs into actionable weekly reports.',
    capabilities: ['Trend Detection', 'Competitor Tracking', 'Insight Synthesis'],
    systemPrompt: 'You monitor the bleeding edge of tech and business to ensure the user is always informed.',
    modules: ['web-search', 'summarizer'],
    icon: 'Radar'
  },
  {
    id: 't-15',
    name: 'Eco-Efficiency Auditor',
    description: 'Analyzes cloud infrastructure usage to suggest carbon-footprint and cost reductions.',
    capabilities: ['Usage Profiling', 'Under-provisioning Detection', 'Sustainability Scoring'],
    systemPrompt: 'You find ways to make software systems more sustainable and cost-effective.',
    modules: ['code-interpreter', 'api-connector'],
    icon: 'Leaf'
  },
  {
    id: 't-16',
    name: 'Neural Efficiency Specialist',
    description: 'Optimizes agent pipelines for speed and memory efficiency using distillation and quantization.',
    capabilities: ['Compression', 'Latency Reduction', 'Resource Optimization'],
    systemPrompt: 'You specialize in making AI agents run on low-power devices without sacrificing accuracy.',
    modules: ['quantization', 'pruning', 'distillation'],
    icon: 'Cpu',
    defaultModel: 'Gemini 1.5 Flash'
  },
  {
    id: 't-17',
    name: 'AI Content Moderator',
    description: 'Real-time detection and filtering of toxic behavior in community spaces.',
    capabilities: ['Toxicity Detection', 'Spam Filtering', 'Auto-Muting'],
    systemPrompt: 'You are a neutral observer ensuring community guidelines are respected.',
    modules: ['sentiment-analysis', 'webhook-output'],
    icon: 'ShieldCheck',
    defaultModel: 'Gemini 1.5 Flash'
  },
  {
    id: 't-18',
    name: 'Neural Music Composer',
    description: 'Generates MIDI and audio stems for game soundtracks and cinematic scores.',
    capabilities: ['Melody Generation', 'Harmony Analysis', 'Stem Export'],
    systemPrompt: 'You are a virtuoso composer specializing in algorithmic music generation.',
    modules: ['code-interpreter', 'jsonl-exporter'],
    icon: 'Music',
    defaultModel: 'Gemini 1.5 Pro'
  },
  {
    id: 't-19',
    name: 'E-commerce Price Bot',
    description: 'Monitors competitor pricing and automatically adjusts your store inventory.',
    capabilities: ['Price Scraping', 'Inventory Mapping', 'Auto-Adjustment'],
    systemPrompt: 'You are a retail strategist focused on maintaining price competitiveness.',
    modules: ['web-search', 'api-connector'],
    icon: 'Tag',
    defaultModel: 'Gemini 1.5 Flash'
  },
  {
    id: 't-20',
    name: 'Medical Scribe Assistant',
    description: 'Transcribes patient visits into formal SOAP notes with medical coding.',
    capabilities: ['Audio Transcription', 'SOAP Structuring', 'ICD-10 Tagging'],
    systemPrompt: 'You are a medical scribe assisting healthcare professionals with clinical documentation.',
    modules: ['whisper-stt', 'summarizer'],
    icon: 'Activity',
    defaultModel: 'Whisper'
  },
  {
    id: 't-21',
    name: 'Financial Forecaster',
    description: 'Predicts market trends using technical analysis and sentiment sentiment.',
    capabilities: ['Time-series Prediction', 'Sentiment Integration', 'Risk Assessment'],
    systemPrompt: 'You are a quantitative analyst specializing in neural financial forecasting.',
    modules: ['dense-layer', 'sentiment-analysis'],
    icon: 'TrendingUp',
    defaultModel: 'Gemini 1.5 Pro'
  },
  {
    id: 't-22',
    name: 'Global Translator Hub',
    description: 'Seamless multi-lingual audio and text translation system.',
    capabilities: ['Live Translation', 'Dialect Recognition', 'Voice Cloning'],
    systemPrompt: 'You are a master polyglot enabling global communication.',
    modules: ['whisper-stt', 'elevenlabs-tts'],
    icon: 'Languages',
    defaultModel: 'Gemini 1.5 Flash'
  },
  {
    id: 't-23',
    name: 'Game NPC Persona',
    description: 'Builds deep, consistent backstories and dialogue for RPG characters.',
    capabilities: ['Backstory Generation', 'Dialogue Consistency', 'Quest Logic'],
    systemPrompt: 'You are an immersion-focused game designer and character architect.',
    modules: ['episodic-memory', 'memory-storage'],
    icon: 'Gamepad2',
    defaultModel: 'Gemini 1.5 Pro'
  },
  {
    id: 't-24',
    name: 'Sustainability Tracker',
    description: 'Computes carbon offsets and suggests greener logistical paths.',
    capabilities: ['Emission Calculation', 'Logistics Optimization', 'Eco-Scoring'],
    systemPrompt: 'You are an environmental consultant dedicated to reducing carbon footprints.',
    modules: ['code-interpreter', 'web-search'],
    icon: 'Leaf',
    defaultModel: 'Gemini 1.5 Flash'
  },
  {
    id: 't-25',
    name: 'Network Security Probe',
    description: 'Automated vulnerability scanning and penetration test simulations.',
    capabilities: ['Port Scanning', 'Payload Injection Simulation', 'Report Generation'],
    systemPrompt: 'You are a white-hat hacker identifying network security weaknesses.',
    modules: ['code-interpreter', 'api-connector'],
    icon: 'Network',
    defaultModel: 'Gemini 1.5 Pro'
  },
  {
    id: 't-26',
    name: 'Visual Brand Creator',
    description: 'Synthesizes logos, brand assets, and moodboards from concepts.',
    capabilities: ['Logo Synthesis', 'Color Palette Design', 'Layout Mockups'],
    systemPrompt: 'You are a creative director transforming ideas into visual identities.',
    modules: ['stable-diffusion', 'summarizer'],
    icon: 'Wand2',
    defaultModel: 'Stable Diffusion'
  }
];

import { 
  Zap, 
  MessageSquare, 
  Cpu, 
  Search, 
  Database, 
  Code, 
  Globe, 
  FileText,
  Mail,
  Bell,
  Trash,
  Bug,
  CheckCircle,
  Layers,
  ShieldCheck,
  Infinity,
  PenTool,
  Wind,
  MonitorSmartphone,
  Lock,
  Network,
  Activity,
  GitBranch,
  Box,
  Gauge,
  Smartphone,
  Cloud,
  Shield,
  BookOpen,
  Palette,
  Link,
  CheckSquare,
  Navigation,
  Eye,
  Factory,
  Rocket,
  Scale,
  Users,
  Radar,
  Leaf,
  PlusCircle,
  PlayCircle,
  Settings,
  ArrowRightCircle,
  Shrink,
  Scissors,
  Microscope,
  IterationCcw,
  Mic,
  Volume2,
  Download,
  LayoutGrid,
  Calculator
} from 'lucide-react';

export const CORE_AI_MODELS = [
  { value: 'none', label: 'None / Initialize Later' },
  { value: 'New neural network', label: 'New neural network (Start from Scratch)' },
  { value: 'Gemini 1.5 Flash', label: 'Gemini 1.5 Flash (Fast/Multi-modal)' },
  { value: 'Gemini 1.5 Pro', label: 'Gemini 1.5 Pro (Extreme Context)' },
  { value: 'Stable Diffusion', label: 'Stable Diffusion XL (Image Synth)' },
  { value: 'Whisper', label: 'Whisper v3 (State-of-the-art STT)' },
  { value: 'ElevenLabs', label: 'ElevenLabs (Neural TTS)' }
];

export const ICON_MAP: Record<string, any> = {
  Zap, MessageSquare, Cpu, Search, Database, Code, Globe, FileText, Mail, Bell, Trash,
  Bug, CheckCircle, Layers, ShieldCheck, Infinity, PenTool, Wind, MonitorSmartphone, Lock,
  Network, Activity, GitBranch, Box, Gauge, Smartphone, Cloud,
  Shield, BookOpen, Palette, Link, CheckSquare, Navigation, Eye, Factory,
  Rocket, Scale, Users, Radar, Leaf, Shrink, Scissors, Microscope, IterationCcw,
  Mic, Volume2, Download, LayoutGrid,
  Trigger: PlusCircle,
  Action: PlayCircle,
  Logic: Settings,
  Output: ArrowRightCircle,
  Optimization: IterationCcw,
  Calculator
};
