"""LLM provider abstraction.

Resolves a LangChain chat model based on ``LLM_PROVIDER`` so the rest of the
codebase is provider-agnostic. Supports:

* ``ollama``   - local OSS models (default, no API key required)
* ``openai``   - OpenAI models (requires ``OPENAI_API_KEY``)
* ``anthropic``- Anthropic models (requires ``ANTHROPIC_API_KEY``)
"""

from app.llm.provider import (
    estimate_cost_usd,
    get_chat_model,
    get_provider_info,
)

__all__ = ["get_chat_model", "get_provider_info", "estimate_cost_usd"]
