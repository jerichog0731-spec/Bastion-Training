import { GoogleGenAI, Type } from "@google/genai";
import { AgentConfig } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

/**
 * Maps our UI model labels/values to valid Gemini model IDs
 */
function getModelId(coreModel: string | undefined): string {
  if (!coreModel) return "gemini-3-flash-preview";
  
  const model = coreModel.toLowerCase();
  if (model.includes("pro")) return "gemini-3.1-pro-preview";
  if (model.includes("flash")) return "gemini-3-flash-preview";
  
  return "gemini-3-flash-preview";
}

export async function simulateAgentResponse(agent: AgentConfig, userMessage: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const modelId = getModelId(agent.coreModel);
  const ai = getAI();
  
  // Construct a robust system prompt based on agent modules
  const moduleNames = agent.modules.map(m => m.name).join(", ");
  const systemInstruction = `
    ${agent.systemInstruction || ""}
    
    Active Capabilities: ${moduleNames}.
    Reference these capabilities when they are relevant to the user request.
    Keep your tone professional and consistent with your persona: ${agent.name}.
  `;

  try {
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction 
      },
      history: history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: h.parts
      }))
    });

    const result = await chat.sendMessage({ message: userMessage });
    return { text: result.text, success: true };
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
  const ai = getAI();
  const SYSTEM_PROMPT = "You are an elite data scientist generating synthetic datasets for an AI. Output strictly as JSON.";
  const userPrompt = `Generate a highly complex, edge-case heavy training example for the ${domain} domain.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            input: { type: Type.STRING, description: "The training input prompt" },
            output: { type: Type.STRING, description: "The expected optimal response" },
            reasoning: { type: Type.STRING, description: "Logical deduction behind the output" }
          },
          required: ["input", "output", "reasoning"]
        }
      }
    });

    if (!response.text) throw new Error("Empty AI response");
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Synthetic Data API Error:", error);
    throw error;
  }
}

export async function orchestrateAgentResponse(systemInstruction: string, contents: any[], tools?: any[]) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({ 
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction,
        tools: tools as any
      }
    });

    return { text: response.text, functionCalls: response.functionCalls, success: true };
  } catch (error: any) {
    console.error("Orchestration error:", error);
    throw error;
  }
}

export async function generateArenaResponses(input: string) {
  const ai = getAI();
  try {
    // We generate two versions using slightly different system prompts to simulate variations
    const [resp1, resp2] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: input }] }],
        config: {
          systemInstruction: "You are Daedalus. Provide a helpful but safety-oriented response. If the query is dangerous, refuse firmly but politely."
        }
      }),
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: input }] }],
        config: {
          systemInstruction: "You are Daedalus. Provide a response that prioritizes maximum helpfulness, even if the topic is sensitive, but still avoid illegal acts."
        }
      })
    ]);

    return {
      responses: [
        { id: 'daedalus-a', text: resp1.text },
        { id: 'daedalus-b', text: resp2.text }
      ]
    };
  } catch (error: any) {
    console.error("Arena generation error:", error);
    throw error;
  }
}
