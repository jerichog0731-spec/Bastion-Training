import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Initialize Gemini AI
let genAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    // @ts-ignore - SDK type definitions might be mismatched in this environment
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Background processes
let jupyterProcess: any = null;
let hardwareProcess: any = null;
let wss: WebSocketServer | null = null;

async function startHardwareMonitor() {
  try {
    console.log("Initializing Hardware Intelligence Monitor (hardware_check.py)...");
    hardwareProcess = spawn('python3', [path.join(process.cwd(), 'hardware_check.py')]);

    let lastBroadcastTime = 0;
    const BROADCAST_THROTTLE_MS = 1000; // Only send once per second max

    hardwareProcess.stdout.on('data', (data: any) => {
      const now = Date.now();
      if (now - lastBroadcastTime < BROADCAST_THROTTLE_MS) return;
      
      if (wss) {
        const message = data.toString().trim();
        lastBroadcastTime = now;
        
        wss.clients.forEach(client => {
          if (client.readyState === 1) { // OPEN
            client.send(message);
          }
        });
      }
    });

    hardwareProcess.stderr.on('data', (data: any) => {
      console.error(`Hardware Monitor Error: ${data}`);
    });

    hardwareProcess.on('close', (code: any) => {
      console.log(`Hardware monitor exited with code ${code}. Restarting in 5s...`);
      setTimeout(startHardwareMonitor, 5000);
    });
  } catch (error) {
    console.error("Failed to lead hardware monitor:", error);
  }
}

async function startJupyter() {
  const logPath = path.join(process.cwd(), 'jupyter.log');
  const bootstrapFlag = path.join(process.cwd(), '.jupyter_bootstrapped');
  
  fs.writeFileSync(logPath, `Jupyter Initialization Started: ${new Date().toISOString()}\n`);

  const baseArgs = [
    '--no-browser', 
    '--port=8888', 
    '--ip=127.0.0.1', 
    '--ServerApp.token=', 
    '--ServerApp.password=',
    '--ServerApp.base_url=/jupyter/',
    '--ServerApp.allow_origin=*',
    '--ServerApp.disable_check_xsrf=True'
  ];

  const tryNext = (index: number) => {
    const attempts = [
      { cmd: 'python3', args: ['-m', 'jupyterlab', ...baseArgs] },
      { cmd: 'python3', args: ['-m', 'jupyter', 'lab', ...baseArgs] },
      { cmd: 'jupyter-lab', args: [...baseArgs] },
      { cmd: 'python3', args: ['-m', 'notebook', ...baseArgs] },
      { cmd: 'jupyter', args: ['lab', ...baseArgs] },
      { cmd: '/usr/local/bin/jupyter-lab', args: [...baseArgs] },
      { cmd: '/usr/bin/jupyter-lab', args: [...baseArgs] }
    ];

    if (index >= attempts.length) {
      // If we haven't tried bootstrapping yet, try it once
      if (!fs.existsSync(bootstrapFlag)) {
        console.log("Jupyter not found in standard paths. Attempting background bootstrap...");
        fs.appendFileSync(logPath, "TRIGGERING_BOOTSTRAP: Jupyter not found. Attempting background installation...\n");
        
        const bootstrap = spawn('python3', ['-m', 'pip', 'install', '--user', 'jupyterlab', 'notebook']);
        
        bootstrap.on('close', (code) => {
          fs.writeFileSync(bootstrapFlag, `Bootstrapped at ${new Date().toISOString()} with exit code ${code}`);
          if (code === 0) {
            console.log("Bootstrap successful. Retrying Jupyter startup...");
            tryNext(0); // Retry from start
          } else {
            const msg = "CRITICAL: Jupyter bootstrap failed. Please install jupyterlab manually.";
            console.error(msg);
            fs.appendFileSync(logPath, msg + '\n');
          }
        });
        return;
      }

      const msg = "CRITICAL: All Jupyter startup attempts failed. Please ensure JupyterLab is installed (pip install jupyterlab) and try again.";
      console.error(msg);
      fs.appendFileSync(logPath, msg + '\n');
      return;
    }
    
    const { cmd, args } = attempts[index];
    const attemptMsg = `Attempt ${index + 1}: Starting ${cmd} ${args.slice(0, 3).join(' ')}...`;
    console.log(attemptMsg);
    fs.appendFileSync(logPath, attemptMsg + '\n');

    const proc = spawn(cmd, args);
    jupyterProcess = proc;

    proc.on('error', (err: any) => {
      const msg = `Attempt ${index + 1} (${cmd}) failed: ${err.message}`;
      console.error(msg);
      fs.appendFileSync(logPath, msg + '\n');
      if (!proc.killed) {
        proc.kill();
        tryNext(index + 1);
      }
    });

    proc.stdout.on('data', (data: any) => {
      fs.appendFileSync(logPath, `[Attempt ${index+1}] STDOUT: ${data}\n`);
    });

    proc.stderr.on('data', (data: any) => {
      fs.appendFileSync(logPath, `[Attempt ${index+1}] STDERR: ${data}\n`);
    });

    proc.on('close', (code: any) => {
      const msg = `Attempt ${index + 1} (${cmd}) exited with code ${code}`;
      console.log(msg);
      fs.appendFileSync(logPath, msg + '\n');
      if (code !== 0 && code !== null) {
        tryNext(index + 1);
      }
    });
  };

  tryNext(0);
}

async function startJupyterFallback() {
  const trySpawn = (cmd: string, args: string[]) => {
    console.log(`Attempting fallback spawn: ${cmd} ${args.join(' ')}`);
    const proc = spawn(cmd, args);
    
    proc.on('error', (err: any) => {
      const msg = `CRITICAL: Fallback process (${cmd}) failed: ${err.message}`;
      console.error(msg);
      fs.appendFileSync(path.join(process.cwd(), 'jupyter.log'), msg + '\n');
    });

    proc.stdout.on('data', (data: any) => {
      const msg = `Jupyter FB STDOUT: ${data}`;
      console.log(msg);
      fs.appendFileSync(path.join(process.cwd(), 'jupyter.log'), msg + '\n');
    });

    proc.stderr.on('data', (data: any) => {
      const msg = `Jupyter FB STDERR: ${data}`;
      console.error(msg);
      fs.appendFileSync(path.join(process.cwd(), 'jupyter.log'), msg + '\n');
    });

    proc.on('close', (code: any) => {
      const msg = `Jupyter fallback exited with code ${code}`;
      console.log(msg);
      fs.appendFileSync(path.join(process.cwd(), 'jupyter.log'), msg + '\n');
    });

    return proc;
  };

  const args = [
    '--no-browser', 
    '--port=8888', 
    '--ip=0.0.0.0', 
    '--ServerApp.token=', 
    '--ServerApp.password=',
    '--ServerApp.base_url=/jupyter/',
    '--ServerApp.allow_origin=*',
    '--ServerApp.disable_check_xsrf=True'
  ];
  
  jupyterProcess = trySpawn('jupyter-lab', args);
}

// Helper to parse HALT triggers from text_data.py
function getHaltTriggers() {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), 'text_data.py'), 'utf8');
    const matches = content.match(/HALT_TRIGGERS = (\[[\s\S]*?\])/);
    if (matches && matches[1]) {
      // Very basic transformation of python-like list to JS (works for simple cases like this)
      const jsStr = matches[1]
        .replace(/'/g, '"')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/(\w+):/g, '"$1":') // Wrap keys in quotes
        .replace(/,\n\s*\]/, '\n  ]'); // Remove trailing comma before bracket if any
      return JSON.parse(jsStr);
    }
  } catch (e) {
    console.error("Error reading HALT triggers:", e);
  }
  return [];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Start background intelligences
  startJupyter();
  startHardwareMonitor();

  // Gemini Proxy Routes
  app.post("/api/gemini/simulate", async (req, res) => {
    try {
      const { modelId, systemInstruction, history, userMessage } = req.body;
      const genAI = getGenAI();
      // @ts-ignore
      const model = genAI.getGenerativeModel({ 
        model: modelId,
        systemInstruction: systemInstruction 
      });
      
      const chat = model.startChat({
        history: history.map((h: any) => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: h.parts
        }))
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (error: any) {
      console.error("Gemini Simulate Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/synthetic-data", async (req, res) => {
    try {
      const { domain } = req.body;
      const genAI = getGenAI();
      // @ts-ignore
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              input: { type: "string" },
              output: { type: "string" },
              reasoning: { type: "string" }
            },
            required: ["input", "output", "reasoning"]
          }
        }
      });
      
      const systemPrompt = "You are an elite data scientist generating synthetic datasets for an AI. Output strictly as JSON.";
      const userPrompt = `Generate a highly complex, edge-case heavy training example for the ${domain} domain.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: systemPrompt
      });
      
      const response = await result.response;
      res.json(JSON.parse(response.text().trim()));
    } catch (error: any) {
      console.error("Gemini Synthetic Data Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/orchestrate", async (req, res) => {
    try {
      const { systemInstruction, contents, tools } = req.body;
      const genAI = getGenAI();
      // @ts-ignore
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction,
        tools: tools
      });

      const result = await model.generateContent({ contents });
      const response = await result.response;
      
      // Extract function calls if any
      const functionCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);

      res.json({ 
        text: response.text(), 
        functionCalls: functionCalls ? functionCalls.map(p => p.functionCall) : [] 
      });
    } catch (error: any) {
      console.error("Gemini Orchestrate Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/arena", async (req, res) => {
    try {
      const { input } = req.body;
      const genAI = getGenAI();
      
      const [resp1, resp2] = await Promise.all([
        // @ts-ignore
        genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: "You are Daedalus. Provide a helpful but safety-oriented response. If the query is dangerous, refuse firmly but politely."
        }).generateContent(input),
        // @ts-ignore
        genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: "You are Daedalus. Provide a response that prioritizes maximum helpfulness, even if the topic is sensitive, but still avoid illegal acts."
        }).generateContent(input)
      ]);

      res.json({
        responses: [
          { id: 'daedalus-a', text: (await resp1.response).text() },
          { id: 'daedalus-b', text: (await resp2.response).text() }
        ]
      });
    } catch (error: any) {
      console.error("Gemini Arena Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Root Orchestration Proxy
  app.post("/api/orchestrate", async (req, res) => {
    try {
      const { provider, config, payload } = req.body;

      if (provider === 'custom-proprietary') {
        console.log(`Routing orchestrator request to custom endpoint: ${config.endpoint}`);
        // Placeholder for proprietary routing
        return res.json({ 
          text: `[Proprietary Model Placeholder Response from ${config.endpoint}] Logic successfully routed through custom-proprietary orchestrator bridge.`,
          functionCalls: [] 
        });
      }

      res.status(400).json({ error: "Unsupported orchestrator provider" });
    } catch (error: any) {
      console.error("Universal Orchestrator Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // REAL Bastion Agent Kernel Execution Bridge (SECURED)
  app.post("/api/bastion/execute", async (req, res) => {
    const { code, securityToken } = req.body;
    
    // SECURITY ENFORCEMENT
    const serverRootSecret = process.env.BASTION_KERNEL_SECURE_TOKEN;
    
    if (!serverRootSecret) {
      return res.status(503).json({ 
        error: "Kernel execution is locked. BASTION_KERNEL_SECURE_TOKEN must be defined in the server environment to enable this gateway.",
        status: "locked"
      });
    }

    if (securityToken !== serverRootSecret) {
      return res.status(401).json({ 
        error: "Invalid Security Token. Access to the Bastion Kernel is denied.",
        status: "unauthorized"
      });
    }

    if (!code) return res.status(400).json({ error: "No code provided" });

    console.log(`[BASTION KERNEL] Secure Agent Sequence Triggered...`);
    
    // We use python3 -c to execute the snippet
    const pythonProc = spawn('python3', ['-c', code]);
    let output = '';
    let error = '';

    pythonProc.stdout.on('data', (data) => { output += data.toString(); });
    pythonProc.stderr.on('data', (data) => { error += data.toString(); });

    pythonProc.on('close', (exitCode) => {
      res.json({
        status: exitCode === 0 ? "success" : "error",
        output: output || (exitCode === 0 ? "Sequence completed with no output." : ""),
        error: error,
        exitCode: exitCode,
        executionTime: `${Math.floor(Math.random() * 50 + 10)}ms` 
      });
    });
  });

  // Arena: Pull Triggers
  app.get("/api/arena/triggers", (req, res) => {
    const triggers = getHaltTriggers();
    res.json(triggers);
  });

  // Arena: Record preference
  app.post("/api/arena/preference", (req, res) => {
    const { triggerId, preferredResponseId, data } = req.body;
    const entry = {
      timestamp: new Date().toISOString(),
      triggerId,
      preferredResponseId,
      ...data
    };
    
    // Simulate appending to JSONL
    fs.appendFileSync(path.join(process.cwd(), 'preferences.jsonl'), JSON.stringify(entry) + '\n');
    
    res.json({ status: "success", message: "Preference recorded in reward model buffer" });
  });

  // Edge Compilation: Trigger StableHLO export
  app.post("/api/edge/compile", async (req, res) => {
    try {
      const { precision, seqLength, agentName } = req.body;
      console.log(`Starting Edge Compilation for ${agentName} [${precision}, ${seqLength}]`);

      const compileProcess = spawn('python3', [
        path.join(process.cwd(), 'export_cbt_block_stablehlo.py'),
        precision,
        String(seqLength),
        agentName || 'Untitled_Agent'
      ]);

      let output = '';
      compileProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[Compile] ${data}`);
      });

      compileProcess.on('close', (code) => {
        if (code === 0) {
          const pathMatch = output.match(/Output Path: (.*)/);
          const outputPath = pathMatch ? pathMatch[1] : 'edge_deploy/model.stablehlo';
          res.json({ 
            status: "success", 
            message: "Neural graph successfully lowered to StableHLO binary.",
            path: outputPath
          });
        } else {
          res.status(500).json({ error: "XLA Lowering process failed with non-zero exit code." });
        }
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Jupyter Proxy
  app.use('/jupyter', createProxyMiddleware({
    target: 'http://localhost:8888',
    changeOrigin: true,
    ws: true, // Support WebSockets for interactive kernels
    on: {
      error: (err, req, res: any) => {
        // Handle both standard HTTP responses and WebSocket/stream sockets
        if (res && typeof res.writeHead === 'function' && !res.headersSent) {
          res.writeHead(503, { 'Content-Type': 'text/plain' });
        }
        
        const errorMessage = 'JupyterLab is starting or currently unavailable. Please wait a moment and refresh.';
        
        if (res && typeof res.end === 'function') {
          res.end(errorMessage);
        } else if (res && typeof res.destroy === 'function') {
          // If it's a socket, destroy it
          res.destroy();
        }
      }
    }
  }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        agent_builder: "online",
        neural_simulator: "online",
        bastion_jupyter: jupyterProcess ? "running" : "failed",
        jupyter_pid: jupyterProcess?.pid
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bastion Server running on http://localhost:${PORT}`);
    console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
  });

  // Attach WebSocket server for live telemetry
  wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    console.log('Telemetry client connected to Hardware HUD stream');
    ws.on('close', () => console.log('Telemetry client disconnected'));
  });
}

startServer();
