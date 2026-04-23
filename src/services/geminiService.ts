import { AgentConfig } from "../types";

/**
 * Maps our UI model labels/values to valid Gemini model IDs
 */
function getModelId(coreModel: string | undefined): string {
  if (!coreModel) return "gemini-1.5-flash";
  
  const model = coreModel.toLowerCase();
  if (model.includes("pro")) return "gemini-1.5-pro";
  if (model.includes("flash")) return "gemini-1.5-flash";
  
  return "gemini-1.5-flash";
}

export async function simulateAgentResponse(agent: AgentConfig, userMessage: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const modelId = getModelId(agent.coreModel);
  const moduleNames = agent.modules.map(m => m.name).join(", ");
  const systemInstruction = `
    ${agent.systemInstruction || ""}
    
    Active Capabilities: ${moduleNames}.
    Reference these capabilities when they are relevant to the user request.
    Keep your tone professional and consistent with your persona: ${agent.name}.
  `;

  try {
    const response = await fetch('/api/gemini/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId,
        systemInstruction,
        history,
        userMessage
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return { text: data.text, success: true };
  } catch (error: any) {
    console.error("Simulation error:", error);
    return { 
      text: "Simulation Engine Error", 
      success: false, 
      error: error?.message || "Unknown error",
      logs: [
        `[${new Date().toISOString()}] CRITICAL_FAILURE: Failed to synthesize response.`,
        `[${new Date().toISOString()}] CONTEXT: Attempted to use model ${modelId} with modules [${moduleNames}]`,
        `[${new Date().toISOString()}] STACK_TRACE: ${error?.stack?.slice(0, 100)}...`
      ]
    };
  }
}

export async function generateSyntheticData(domain: string) {
  try {
    const response = await fetch('/api/gemini/synthetic-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Synthetic Data API Error:", error);
    throw error;
  }
}

export async function orchestrateAgentResponse(systemInstruction: string, contents: any[], tools?: any[]) {
  try {
    const response = await fetch('/api/gemini/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction,
        contents,
        tools
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return { text: data.text, functionCalls: data.functionCalls, success: true };
  } catch (error: any) {
    console.error("Orchestration error:", error);
    throw error;
  }
}

export async function generateArenaResponses(input: string) {
  try {
    const response = await fetch('/api/gemini/arena', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Arena generation error:", error);
    throw error;
  }
}
