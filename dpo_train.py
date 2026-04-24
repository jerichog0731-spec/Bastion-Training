import os
import json
import torch
from datasets import Dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from trl import DPOTrainer

def load_preferences_jsonl(file_path):
    """
    Loads preferences from a JSONL file in the chosen/rejected format.
    Expected format per line: {"prompt": "...", "chosen": "...", "rejected": "..."}
    """
    data = []
    with open(file_path, 'r') as f:
        for line in f:
            data.append(json.loads(line))
    return Dataset.from_list(data)

def train_dpo(model_name="gpt2", dataset_path="preferences.jsonl"):
    # 1. Load Model and Tokenizer
    # For DPO, we usually use a reference model and a policy model.
    # DPOTrainer handles creating the reference model internally if not provided.
    model = AutoModelForCausalLM.from_pretrained(
        model_name, 
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto"
    )
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 2. Load Dataset
    dataset = load_preferences_jsonl(dataset_path)

    # 3. Setup Training Arguments
    training_args = TrainingArguments(
        output_dir="./dpo_output",
        per_device_train_batch_size=4,
        max_steps=1000,
        learning_rate=1e-5,
        logging_steps=10,
        save_steps=100,
        evaluation_strategy="steps",
        eval_steps=100,
        remove_unused_columns=False,
    )

    # 4. Initialize DPO Trainer
    # The 'beta' parameter controls the strength of the KL penalty.
    # The loss function maps chosen/rejected margins:
    # Loss = -log(sigmoid(beta * (log(pi(y_w|x)/ref(y_w|x)) - log(pi(y_l|x)/ref(y_l|x)))))
    # This directly optimizes the policy to prefer 'chosen' over 'rejected'.
    dpo_trainer = DPOTrainer(
        model,
        args=training_args,
        beta=0.1,  # KL penalty strength
        train_dataset=dataset,
        tokenizer=tokenizer,
        max_prompt_length=512,
        max_length=1024,
    )

    # 5. Execute Training
    print("Starting DPO training loop...")
    dpo_trainer.train()
    print("Training complete. Saving model...")
    dpo_trainer.save_model("./dpo_final_model")

if __name__ == "__main__":
    # Ensure a preferences.jsonl exists for demonstration
    if not os.path.exists("preferences.jsonl"):
        with open("preferences.jsonl", "w") as f:
            f.write(json.dumps({
                "prompt": "What is the capital of France?",
                "chosen": "The capital of France is Paris.",
                "rejected": "I think it is London."
            }) + "\n")
    
    train_status = train_dpo()
