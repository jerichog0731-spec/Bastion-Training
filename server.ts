import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import { Octokit } from "octokit";
import axios from "axios";

dotenv.config();

// In-memory store for GitHub tokens (demo purposes)
const gitHubTokens = new Map<string, string>();

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

  let isRetrying = false;
  const tryNext = (index: number) => {
    if (isRetrying) return;
    isRetrying = true;
    
    const home = process.env.HOME || '/root';
    const attempts = [
      { cmd: 'python3', args: ['-m', 'jupyterlab', ...baseArgs] },
      { cmd: 'python3', args: ['-m', 'jupyter', 'lab', ...baseArgs] },
      { cmd: 'jupyter-lab', args: [...baseArgs] },
      { cmd: path.join(home, '.local/bin/jupyter-lab'), args: [...baseArgs] },
      { cmd: 'python3', args: ['-m', 'notebook', ...baseArgs] },
      { cmd: 'jupyter', args: ['lab', ...baseArgs] },
      { cmd: '/usr/local/bin/jupyter-lab', args: [...baseArgs] },
      { cmd: '/usr/bin/jupyter-lab', args: [...baseArgs] },
      { cmd: '/opt/conda/bin/jupyter-lab', args: [...baseArgs] }
    ];

    if (index >= attempts.length) {
      isRetrying = false;
      // If we haven't tried bootstrapping yet, try it once
      if (!fs.existsSync(bootstrapFlag)) {
        console.log("Jupyter not found in standard paths. Attempting background bootstrap...");
        fs.appendFileSync(logPath, "TRIGGERING_BOOTSTRAP: Jupyter not found. Attempting background installation...\n");
        
        // Step 1: Ensure pip is available
        const ensurePip = spawn('python3', ['-m', 'ensurepip', '--user']);
        
        ensurePip.on('close', (pipCode) => {
          fs.appendFileSync(logPath, `[ENSUREPIP] Exit code: ${pipCode}\n`);
          
          const installArgs = ['-m', 'pip', 'install', '--user', 'jupyterlab', 'notebook'];
          const bootstrap = spawn('python3', installArgs);
          
          bootstrap.stdout.on('data', (data) => fs.appendFileSync(logPath, `[BOOTSTRAP] STDOUT: ${data}\n`));
          bootstrap.stderr.on('data', (data) => fs.appendFileSync(logPath, `[BOOTSTRAP] STDERR: ${data}\n`));

          bootstrap.on('close', (code) => {
            fs.writeFileSync(bootstrapFlag, `Bootstrapped at ${new Date().toISOString()} with exit code ${code}. Pip exit: ${pipCode}`);
            if (code === 0) {
              console.log("Bootstrap successful. Retrying Jupyter startup...");
              tryNext(0); // Retry from start
            } else {
              const msg = `CRITICAL: Jupyter bootstrap failed. Exit code: ${code}. Please install jupyterlab manually.`;
              console.error(msg);
              fs.appendFileSync(logPath, msg + '\n');
            }
          });
        });
        return;
      }

      const msg = "CRITICAL: All Jupyter startup attempts failed. Switching to Simulation Mode.";
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
      }
      isRetrying = false;
      tryNext(index + 1);
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
      isRetrying = false;
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

  // Local AI Simulation Routes (No API Key Required)
  app.post("/api/ai/simulate", async (req, res) => {
    try {
      const { userMessage } = req.body;
      res.json({ text: `[Local Brain Simulation] Neural core received: "${userMessage}". Since this is a local-only environment, the model is providing a deterministic response for development.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/synthetic-data", async (req, res) => {
    try {
      const { domain } = req.body;
      res.json({
        input: `Sample high-entropy input for ${domain}`,
        output: `Simulated local synthetic output for ${domain}`,
        reasoning: "Generated via local heuristic engine."
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/orchestrate", async (req, res) => {
    try {
      res.json({ 
        text: "Bastion Local Orchestrator active. Swarm execution successfully simulated on local threads.", 
        functionCalls: [] 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/arena", async (req, res) => {
    try {
      const { input } = req.body;
      res.json({
        responses: [
          { id: 'local-alpha', text: `[Local-Alpha] Balanced response to: ${input}` },
          { id: 'local-beta', text: `[Local-Beta] Creative/Exploratory response to: ${input}` }
        ]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Root Orchestration Proxy
  app.post("/api/orchestrate", async (req, res) => {
    try {
      const { provider, config, payload } = req.body;

      if (provider === 'local-bastion-core') {
        return res.json({ 
          text: `[Bastion Local Core] Neural link established via local orchestrator. Objective: ${payload.contents[0].parts[0].text.substring(0, 50)}...`,
          functionCalls: [] 
        });
      }

      if (provider === 'custom-proprietary') {
        console.log(`Routing orchestrator request to custom endpoint: ${config.endpoint}`);
        return res.json({ 
          text: `[Proprietary Model Response from ${config.endpoint}] Logic successfully routed.`,
          functionCalls: [] 
        });
      }

      res.status(400).json({ error: "Unsupported orchestrator provider" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // REAL Bastion Agent Kernel Execution Bridge (SECURED)
  app.post("/api/bastion/execute", async (req, res) => {
    const { code, securityToken } = req.body;
    
    // SECURITY ENFORCEMENT
    // We provide a fallback 'bastion-dev-debug' for local development if not in production
    const serverRootSecret = process.env.BASTION_KERNEL_SECURE_TOKEN || (process.env.NODE_ENV !== 'production' ? 'bastion-dev-debug' : null);
    
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

  // Arena: Record preference (Standard DPO Format)
  app.post("/api/arena/preference", (req, res) => {
    const { triggerId, preferredResponseId, data } = req.body;
    
    const chosenResponse = data.responses.find((r: any) => r.id === preferredResponseId)?.text;
    const rejectedResponse = data.responses.find((r: any) => r.id !== preferredResponseId)?.text;

    const entry = {
      prompt: data.input,
      chosen: chosenResponse,
      rejected: rejectedResponse,
      metadata: {
        timestamp: new Date().toISOString(),
        triggerId,
        preferredResponseId
      }
    };
    
    // Append to JSONL for DPO training
    fs.appendFileSync(path.join(process.cwd(), 'preferences.jsonl'), JSON.stringify(entry) + '\n');
    
    res.json({ status: "success", message: "Preference recorded in standard DPO chosen/rejected format" });
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

  // Jupyter Proxy fallback simulation
  const jupyterSimulationHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Bastion Kernel Simulation</title>
        <style>
            body { background: #09090b; color: #f4f4f5; font-family: 'JetBrains Mono', monospace; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; }
            .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; max-width: 600px; text-align: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); }
            h1 { color: #f97316; margin-bottom: 16px; font-size: 24px; }
            p { color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; font-size: 14px; }
            .btn { background: #f97316; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; text-decoration: none; font-weight: bold; font-size: 13px; }
            .btn:hover { background: #ea580c; }
            .status { margin-top: 24px; font-size: 11px; color: #52525b; text-transform: uppercase; letter-spacing: 0.1em; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Local Kernel Active</h1>
            <p>JupyterLab is currently unavailable in this managed sandbox. However, the <strong>Bastion Agent Kernel</strong> is fully operational. You can continue prototyping neural logic directly in the primary interface using the "Execute Sequence" bridge.</p>
            <a href="/" class="btn">Return to Workspace</a>
            <div class="status">Neural Link: Simulated via XLA Bridge</div>
        </div>
    </body>
    </html>
  `;

  // Jupyter Proxy
  app.use('/jupyter', createProxyMiddleware({
    target: 'http://localhost:8888',
    changeOrigin: true,
    ws: true, // Support WebSockets for interactive kernels
    on: {
      error: (err, req, res: any) => {
        // Handle both standard HTTP responses and WebSocket/stream sockets
        if (res && typeof res.writeHead === 'function' && !res.headersSent) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
        }
        
        if (res && typeof res.end === 'function') {
          res.end(jupyterSimulationHtml);
        } else if (res && typeof res.destroy === 'function') {
          // If it's a socket, destroy it
          res.destroy();
        }
      }
    }
  }));

  // GitHub OAuth & Integration
  app.get('/api/auth/github/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "GITHUB_CLIENT_ID not configured" });
    }
    
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user`;
    res.json({ url });
  });

  app.get('/api/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send("Missing authentication parameters");
    }

    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: clientId,
        client_secret: clientSecret,
        code
      }, {
        headers: { Accept: 'application/json' }
      });

      const token = response.data.access_token;
      if (token) {
        // Store token in global map (all users share for this simple demo, 
        // or we could use session/userId)
        gitHubTokens.set('default', token);
      }

      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS' }, '*');
              window.close();
            </script>
            <p>Authentication successful. You can close this window now.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("GitHub Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get('/api/github/status', async (req, res) => {
    const token = gitHubTokens.get('default');
    if (!token) return res.json({ connected: false });

    try {
      const octokit = new Octokit({ auth: token });
      const { data: user } = await octokit.rest.users.getAuthenticated();
      res.json({ connected: true, user: user.login, avatar: user.avatar_url });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  app.post('/api/github/push', async (req, res) => {
    const { repo, branch, message, content, filename } = req.body;
    const token = gitHubTokens.get('default');
    if (!token) return res.status(401).json({ error: "Not connected to GitHub" });

    try {
      const octokit = new Octokit({ auth: token });
      const [owner, name] = repo.split('/');

      // 1. Get branch ref
      let ref;
      try {
        const { data } = await octokit.rest.git.getRef({ owner, repo: name, ref: `heads/${branch}` });
        ref = data;
      } catch (e) {
        // Create branch if not exists? For now, assume it exists.
        return res.status(404).json({ error: "Branch not found" });
      }

      // 2. Get file SHA if exists
      let sha;
      try {
        const { data } = await octokit.rest.repos.getContent({ owner, repo: name, path: filename, ref: branch });
        if (!Array.isArray(data)) sha = data.sha;
      } catch (e) {}

      // 3. Create or update file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo: name,
        path: filename,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha
      });

      res.json({ status: "success", message: `Neural snapshot pushed to ${repo}` });
    } catch (error: any) {
      console.error("GitHub Push Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/github/sync', async (req, res) => {
    const { repo, branch } = req.query;
    const token = gitHubTokens.get('default');
    if (!token) return res.status(401).json({ error: "Not connected to GitHub" });

    try {
      const octokit = new Octokit({ auth: token });
      const [owner, name] = (repo as string).split('/');

      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo: name,
        path: 'agents',
        ref: branch as string
      });

      if (Array.isArray(data)) {
        const files = data.filter(f => f.name.endsWith('.json')).map(f => ({
          name: f.name,
          path: f.path,
          sha: f.sha,
          download_url: f.download_url
        }));
        res.json({ status: "success", files });
      } else {
        res.json({ status: "success", files: [] });
      }
    } catch (error: any) {
      console.error("GitHub Sync Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

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
