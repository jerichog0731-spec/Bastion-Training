import jax
import jax.numpy as jnp
from flax import linen as nn
from typing import Optional, Tuple, Union

"""
model.py - Optimized 13B Decoder-Only Transformer Architecture in JAX/Flax
Architect: Elite AI Systems Architect
Target: XLA Compilation for NPU Acceleration via StableHLO
"""

class RMSNorm(nn.Module):
    """
    Root Mean Square Layer Normalization.
    Eliminates the mean-centering and additive bias of standard LayerNorm for efficiency.
    """
    dim: int
    eps: float = 1e-6

    @nn.compact
    def __call__(self, x: jnp.ndarray) -> jnp.ndarray:
        # x shape: [..., dim]
        scale = self.param('scale', nn.initializers.ones, (self.dim,))
        variance = jnp.mean(jnp.square(x), axis=-1, keepdims=True)
        norm_x = x * jax.lax.rsqrt(variance + self.eps)
        return scale * norm_x

def precompute_rope_freqs(dim: int, seq_len: int, theta: float = 10000.0) -> jnp.ndarray:
    """
    Precompute the frequencies for Rotary Position Embeddings.
    Shape: [seq_len, dim // 2]
    """
    freqs = 1.0 / (theta ** (jnp.arange(0, dim, 2)[: (dim // 2)].astype(jnp.float32) / dim))
    t = jnp.arange(seq_len)
    freqs = jnp.outer(t, freqs)
    return freqs

def apply_rope(x: jnp.ndarray, freqs: jnp.ndarray) -> jnp.ndarray:
    """
    Apply Rotary Position Embeddings to a tensor.
    x shape: [batch, seq_len, num_heads, head_dim]
    freqs shape: [seq_len, head_dim // 2]
    """
    # Split x into real and imaginary parts (pairs)
    x_real, x_imag = jnp.array_split(x, 2, axis=-1)
    
    # cos and sin components
    cos = jnp.cos(freqs)[None, :, None, :]
    sin = jnp.sin(freqs)[None, :, None, :]
    
    # x_rot = x * cos + x_conjugate * sin
    # In real terms: [x1*cos - x2*sin, x1*sin + x2*cos]
    out_real = x_real * cos - x_imag * sin
    out_imag = x_real * sin + x_imag * cos
    
    return jnp.concatenate([out_real, out_imag], axis=-1)

class GroupedQueryAttention(nn.Module):
    """
    Grouped Query Attention (GQA) mechanism.
    Reduces memory overhead of KV cache by sharing Key/Value heads across Query heads.
    """
    hidden_size: int
    num_heads: int
    num_kv_heads: int
    head_dim: int
    
    @nn.compact
    def __call__(self, x: jnp.ndarray, freqs: jnp.ndarray, mask: Optional[jnp.ndarray] = None) -> jnp.ndarray:
        # x shape: [batch, seq_len, hidden_size]
        B, L, D = x.shape
        
        q_proj = nn.Dense(self.num_heads * self.head_dim, use_bias=False)(x)
        k_proj = nn.Dense(self.num_kv_heads * self.head_dim, use_bias=False)(x)
        v_proj = nn.Dense(self.num_kv_heads * self.head_dim, use_bias=False)(x)
        
        # Reshape for multi-head processing
        q = q_proj.reshape(B, L, self.num_heads, self.head_dim)
        k = k_proj.reshape(B, L, self.num_kv_heads, self.head_dim)
        v = v_proj.reshape(B, L, self.num_kv_heads, self.head_dim)
        
        # Apply RoPE
        q = apply_rope(q, freqs)
        k = apply_rope(k, freqs)
        
        # GQA: Repeat keys/values to match query head count
        # num_groups = num_heads // num_kv_heads
        if self.num_heads != self.num_kv_heads:
            k = jnp.repeat(k, self.num_heads // self.num_kv_heads, axis=2)
            v = jnp.repeat(v, self.num_heads // self.num_kv_heads, axis=2)
        
        # [batch, num_heads, seq_len, head_dim]
        q = q.transpose(0, 2, 1, 3)
        k = k.transpose(0, 2, 1, 3)
        v = v.transpose(0, 2, 1, 3)
        
        # Scaled dot-product attention
        scores = jnp.matmul(q, k.transpose(0, 1, 3, 2)) / jnp.sqrt(self.head_dim)
        
        if mask is not None:
            scores = scores + mask
            
        attn_weights = nn.softmax(scores, axis=-1)
        output = jnp.matmul(attn_weights, v)
        
        # Restore shape
        output = output.transpose(0, 2, 1, 3).reshape(B, L, -1)
        
        return nn.Dense(self.hidden_size, use_bias=False)(output)

class SwiGLU(nn.Module):
    """
    Swish-Gated Linear Unit activation.
    Proven effective in large scale language models like Llama-2.
    """
    intermediate_size: int
    
    @nn.compact
    def __call__(self, x: jnp.ndarray) -> jnp.ndarray:
        gate = nn.Dense(self.intermediate_size, use_bias=False)(x)
        value = nn.Dense(self.intermediate_size, use_bias=False)(x)
        return jax.nn.silu(gate) * value

class MLPBlock(nn.Module):
    """
    Standard MLP block with SwiGLU.
    """
    hidden_size: int
    intermediate_size: int
    
    @nn.compact
    def __call__(self, x: jnp.ndarray) -> jnp.ndarray:
        # x shape: [batch, seq_len, hidden_size]
        x = SwiGLU(self.intermediate_size)(x)
        return nn.Dense(self.hidden_size, use_bias=False)(x)

class TransformerBlock(nn.Module):
    """
    A single Transformer layer combining Attention and MLP.
    """
    hidden_size: int
    num_heads: int
    num_kv_heads: int
    intermediate_size: int
    
    @nn.compact
    def __call__(self, x: jnp.ndarray, freqs: jnp.ndarray, mask: Optional[jnp.ndarray] = None) -> jnp.ndarray:
        # Pre-normalization paradigm
        h = x + GroupedQueryAttention(
            hidden_size=self.hidden_size,
            num_heads=self.num_heads,
            num_kv_heads=self.num_kv_heads,
            head_dim=self.hidden_size // self.num_heads
        )(RMSNorm(self.hidden_size)(x), freqs, mask)
        
        out = h + MLPBlock(
            hidden_size=self.hidden_size,
            intermediate_size=self.intermediate_size
        )(RMSNorm(self.hidden_size)(h))
        
        return out

class LanguageModel(nn.Module):
    """
    Final Decoder-Only Transformer Architecture.
    Targeting 13B Parameters.
    """
    vocab_size: int
    num_layers: int
    hidden_size: int
    num_heads: int
    num_kv_heads: int
    intermediate_size: int
    max_seq_len: int = 8192
    
    @nn.compact
    def __call__(self, input_ids: jnp.ndarray) -> jnp.ndarray:
        # input_ids: [batch, seq_len]
        B, L = input_ids.shape
        
        # Token Embeddings
        x = nn.Embed(num_embeddings=self.vocab_size, features=self.hidden_size)(input_ids)
        
        # Precompute RoPE freqs for the current sequence
        freqs = precompute_rope_freqs(self.hidden_size // self.num_heads, L)
        
        # Causal mask construction
        mask = jnp.full((L, L), -1e10)
        mask = jnp.triu(mask, k=1)
        
        for _ in range(self.num_layers):
            x = TransformerBlock(
                hidden_size=self.hidden_size,
                num_heads=self.num_heads,
                num_kv_heads=self.num_kv_heads,
                intermediate_size=self.intermediate_size
            )(x, freqs, mask)
            
        x = RMSNorm(self.hidden_size)(x)
        logits = nn.Dense(self.vocab_size, use_bias=False)(x)
        
        return logits

# --- Configuration for 13B Parameters (Reference) ---
# hidden_size = 5120
# num_layers = 40
# num_heads = 40
# num_kv_heads = 10 (GQA with ratio 4:1)
# intermediate_size = 13824
# vocab_size = 32000
