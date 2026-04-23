import requests
import json
import time
import random

# Connects directly to Bastion's internal proxy
BASTION_API = "http://localhost:3000/api/orchestrator"

# The System Instruction to lock the AI into "Elite Coder Mode"
SYSTEM_PROMPT = """You are a Senior Principal Software Architect specializing in AI infrastructure and game engine development. Your expertise covers JAX, StableHLO, C++, Godot (GDScript/GDExtension), and Unreal Engine 5. 

Your sole function is to generate complex, synthetic programming challenges and provide flawless, production-ready solutions. You must document your internal logic before writing the code.

You must output your response STRICTLY as a JSON object with no markdown wrapping. The JSON must contain exactly these keys:
{
  "task_type": "The category of the task",
  "input": "A highly complex, multi-constraint coding request from a user.",
  "reasoning": "A deep, step-by-step logical breakdown of how to solve the problem, noting potential hardware constraints or memory leaks.",
  "output": "The final, fully commented, highly optimized executable code solution."
}"""

# The engine will randomize across your specific stack to create a versatile coding agent
TOPICS = [
    "Godot 4 GDScript performance optimization for complex 2D arrays",
    "Writing a C++ GDExtension for Godot to handle procedural generation",
    "JAX model architecture compilation to StableHLO for QNN execution",
    "Unreal Engine 5 C++ garbage collection and memory leak debugging",
    "Agentic file manipulation (generating JSON payloads to read/write local project files)",
    "Asynchronous state management for multi-signature guardian approval systems",
    "Managing Out-Of-Memory (OOM) thermal throttling states on edge NPU hardware"
]

def generate_synthetic_data(num_samples=50, output_file="coder_corpus.jsonl"):
    print(f"🚀 Initializing Bastion SDG Engine (Coder Mode). Target: {num_samples} samples.")
    
    for i in range(num_samples):
        topic = random.choice(TOPICS)
        # We explicitly enforce JSON formatting matching the new keys
        user_prompt = f"""Generate a highly complex, edge-case heavy programming problem related to {topic}.
        Return ONLY valid JSON with no markdown wrapping. Keys must be: task_type, input, reasoning, output."""
        
        payload = {
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "systemInstruction": SYSTEM_PROMPT
        }
        
        try:
            response = requests.post(BASTION_API, json=payload)
            response_data = response.json()
            
            generated_text = response_data.get('text', '').strip()
            
            # Clean markdown backticks if the AI accidentally added them
            if generated_text.startswith("```json"):
                generated_text = generated_text[7:-3]
            elif generated_text.startswith("```"):
                generated_text = generated_text[3:-3]
                
            json_obj = json.loads(generated_text.strip())
            
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(json_obj) + '\n')
                
            print(f"✅ [{i+1}/{num_samples}] Saved Coder sample for: {topic}")
            
            time.sleep(2)
            
        except json.JSONDecodeError:
            print(f"⚠️ [{i+1}/{num_samples}] Failed to parse JSON. Skipping sample.")
        except Exception as e:
            print(f"❌ Failed on iteration {i+1}: {str(e)}")

if __name__ == "__main__":
    # Set this to a low number like 5 to test, then crank it up to 500+ when you're ready to build the real dataset
    generate_synthetic_data(5)