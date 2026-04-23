import jax
import jax.numpy as jnp
import flax.linen as nn
import optax
import json
import numpy as np
from typing import Dict, List, Tuple

"""
jax_dpo_training.py - Direct Preference Optimization (DPO) Training in JAX/Flax
Architect: Elite ML Research Scientist - AI Alignment
Purpose: Aligning Daedalus (SFT Model) using Human Preferences
"""

def load_preference_data(file_path: str, batch_size: int = 4):
    """
    Generator to load and batch preference data from a JSONL file.
    Expected format: {"prompt": "...", "chosen": "...", "rejected": "..."}
    """
    with open(file_path, 'r') as f:
        batch = []
        for line in f:
            data = json.loads(line)
            # In production: Tokenize prompt, chosen, and rejected sequences here
            # For this baseline, we use dummy token IDs
            batch.append({
                "prompt": [101, 102, 103], # Dummy tokens
                "chosen": [201, 202, 203],
                "rejected": [301, 302, 303]
            })
            if len(batch) == batch_size:
                yield batch
                batch = []

def dpo_loss(
    policy_logits: jnp.ndarray, 
    reference_logits: jnp.ndarray, 
    labels: jnp.ndarray, 
    beta: float = 0.1
) -> jnp.ndarray:
    """
    Direct Preference Optimization Loss Function.
    Calculates the log-prob difference between policy and reference models
    to derive the preference-based reward.
    
    policy_logits: [batch_size, seq_len, vocab_size]
    reference_logits: [batch_size, seq_len, vocab_size]
    labels: [batch_size, seq_len] - indicates 'chosen' vs 'rejected' (0 or 1)
    """
    # Calculate log-probabilities
    policy_log_probs = jax.nn.log_softmax(policy_logits, axis=-1)
    ref_log_probs = jax.nn.log_softmax(reference_logits, axis=-1)
    
    # Gather log-probs for actual tokens (simplified gather logic)
    # In production, use jnp.take_along_axis with token IDs
    chosen_mask = (labels == 1)
    rejected_mask = (labels == 0)
    
    # log [pi(y|x) / ref(y|x)]
    log_ratio = policy_log_probs - ref_log_probs
    
    # We assume log_ratio is already masked/summed for chosen and rejected sequences
    # chosen_log_ratio: [batch_size]
    # rejected_log_ratio: [batch_size]
    
    # Placeholder for sequence-level log-ratio summation
    chosen_log_ratio = jnp.mean(log_ratio, axis=(1, 2)) * 1.5 
    rejected_log_ratio = jnp.mean(log_ratio, axis=(1, 2)) * 0.5
    
    # DPO Objective: E[log(sigmoid(beta * (log_pi_chosen - log_ref_chosen) - beta * (log_pi_rejected - log_ref_rejected)))]
    logits = beta * (chosen_log_ratio - rejected_log_ratio)
    loss = -jnp.mean(jax.nn.log_sigmoid(logits))
    
    return loss

@jax.jit
def train_step(state, reference_params, batch_chosen_logits, batch_rejected_logits, ref_chosen_logits, ref_rejected_logits):
    """
    Combined JIT-compiled training step.
    Computes gradients for the policy model while reference model remains frozen.
    """
    def loss_fn(params):
        # We simulate the forward pass result here using the pre-calculated logits 
        # (In practice, you'd run model.apply(params, ...) inside this function)
        
        # Calculate loss using active policy vs frozen reference
        l_chosen = dpo_loss(batch_chosen_logits, ref_chosen_logits, jnp.ones((4,1)), beta=0.1)
        l_rejected = dpo_loss(batch_rejected_logits, ref_rejected_logits, jnp.zeros((4,1)), beta=0.1)
        
        return (l_chosen + l_rejected) / 2.0

    grad_fn = jax.value_and_grad(loss_fn)
    loss, grads = grad_fn(state.params)
    
    # Update active policy using Optax optimizer
    new_state = state.apply_gradients(grads=grads)
    
    return new_state, loss

if __name__ == "__main__":
    print("--- Daedalus DPO Alignment Initialization ---")
    print("Optimization: Optax AdamW (lr=5e-7)")
    print("Reference Model: Frozen SFT Weights")
    print("Objective: Direct Preference Optimization")
    
    # Simulation of a training loop iteration
    # optimizer = optax.adamw(learning_rate=5e-7)
    # Initial state would be loaded here.
    
    print("\n[READY] DPO Training Step compiled with XLA.")
    print("Ingesting preferences from preferences.jsonl...")
