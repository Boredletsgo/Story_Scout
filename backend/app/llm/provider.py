"""LLM provider factory and cost estimation."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from langchain_core.language_models.chat_models import BaseChatModel

from app.core.config import LLMProvider, settings
from app.core.exceptions import LLMProviderError
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass(frozen=True)
class ProviderInfo:
    provider: LLMProvider
    model: str
    requires_key: bool
    key_present: bool


# Approximate USD per 1K tokens (input, output). Local models are free.
# Used only for the MLOps cost dashboard; not billed.
_COST_TABLE: dict[str, tuple[float, float]] = {
    "gpt-4o-mini": (0.00015, 0.00060),
    "gpt-4o": (0.0025, 0.010),
    "claude-3-5-haiku-latest": (0.0008, 0.004),
    "claude-3-5-sonnet-latest": (0.003, 0.015),
}


def get_provider_info() -> ProviderInfo:
    """Describe the currently configured provider/model."""
    provider = settings.LLM_PROVIDER
    if provider == "openai":
        return ProviderInfo("openai", settings.OPENAI_MODEL, True, bool(settings.OPENAI_API_KEY))
    if provider == "anthropic":
        return ProviderInfo(
            "anthropic", settings.ANTHROPIC_MODEL, True, bool(settings.ANTHROPIC_API_KEY)
        )
    return ProviderInfo("ollama", settings.OLLAMA_MODEL, False, True)


@lru_cache(maxsize=8)
def _build_model(
    provider: LLMProvider, model: str, temperature: float, max_tokens: int
) -> BaseChatModel:
    """Construct (and cache) a LangChain chat model for the provider."""
    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise LLMProviderError("OPENAI_API_KEY is required when LLM_PROVIDER=openai.")
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=settings.OPENAI_API_KEY,
            timeout=60,
        )

    if provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY:
            raise LLMProviderError("ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic.")
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model_name=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=settings.ANTHROPIC_API_KEY,
            timeout=60,
        )

    # default: ollama (local OSS)
    from langchain_ollama import ChatOllama

    return ChatOllama(
        model=model,
        temperature=temperature,
        num_predict=max_tokens,
        base_url=settings.OLLAMA_BASE_URL,
    )


def get_chat_model(
    *,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> BaseChatModel:
    """Return a configured chat model for the active provider."""
    info = get_provider_info()
    temp = settings.LLM_TEMPERATURE if temperature is None else temperature
    tokens = settings.LLM_MAX_TOKENS if max_tokens is None else max_tokens
    logger.debug("llm_resolve", provider=info.provider, model=info.model)
    return _build_model(info.provider, info.model, temp, tokens)


def estimate_cost_usd(model: str, input_tokens: int, output_tokens: int) -> float:
    """Best-effort cost estimate in USD for a single LLM call."""
    rate = _COST_TABLE.get(model)
    if rate is None:
        return 0.0
    in_rate, out_rate = rate
    return round((input_tokens / 1000) * in_rate + (output_tokens / 1000) * out_rate, 6)
