import torch
import json
from datasets import Dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from trl import DPOTrainer
import os

# --- 1. Load Local Preferences (JSONL) ---
def load_preferences(file_path):
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found. Generate some preferences in the Arena first.")
        return None
    
    data = {"prompt": [], "chosen": [], "rejected": []}
    with open(file_path, "r") as f:
        for line in f:
            obj = json.loads(line)
            data["prompt"].append(obj["prompt"])
            data["chosen"].append(obj["chosen"])
            data["rejected"].append(obj["rejected"])
    
    return Dataset.from_dict(data)

# --- 2. Training Configuration ---
model_id = "gpt2"  # Placeholder: In production use a base LLM like Llama-3 or Mistral
train_dataset = load_preferences("preferences.jsonl")

if train_dataset:
    print(f"Loaded {len(train_dataset)} preference pairs for training.")
    
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        device_map="auto"
    )
    
    # We also need a reference model to ensure the updated model doesn't drift too far.
    # The DPO loss compares the log-probabilities of the policy model vs the reference model.
    model_ref = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        device_map="auto"
    )

    # --- 3. DPO Loss Mapping Logic ---
    # The DPO loss function maximizes the margin between the chosen and rejected responses.
    # Logic: LogSigmoid(beta * ((log_policy(chosen) - log_ref(chosen)) - (log_policy(rejected) - log_ref(rejected))))
    #
    # 1. (log_policy(chosen) - log_ref(chosen)): This is the 'relative preference' for the chosen answer.
    # 2. (log_policy(rejected) - log_ref(rejected)): This is the 'relative preference' for the rejected answer.
    # 3. By subtracting 2 from 1, we get the 'Preference Margin'.
    # 4. 'beta' is a hyperparameter (usually 0.1) that controls how much we penalize deviation from the reference model.
    
    training_args = TrainingArguments(
        output_dir="./dpo_results",
        per_device_train_batch_size=4,
        max_steps=100,
        remove_unused_columns=False,
        gradient_accumulation_steps=1,
        learning_rate=1e-5,
        evaluation_strategy="no",
        logging_first_step=True,
        logging_steps=10,
        warmup_steps=10,
        report_to="none"
    )

    dpo_trainer = DPOTrainer(
        model,
        model_ref,
        args=training_args,
        beta=0.1,  # Beta controls the strength of the KL penalty
        train_dataset=train_dataset,
        tokenizer=tokenizer,
        max_prompt_length=512,
        max_length=1024,
    )

    print("Starting DPO Optimization...")
    # dpo_trainer.train() # Uncomment to run actual training
    print("DPO training routine configured. Ready to fine-tune weights for alignment.")
else:
    print("Waiting for arena data inputs to begin alignment cycle.")
