"""MLflow tracking helpers.

All MLflow interaction is wrapped so the app keeps working even when MLflow is
unreachable or disabled (``ENABLE_MLFLOW=false``). Tracking failures are logged
but never break a user request.
"""

from __future__ import annotations

import contextlib
import time
from collections.abc import Iterator
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger
from app.llm.provider import estimate_cost_usd, get_provider_info

logger = get_logger(__name__)

_initialized = False


def _ensure_init() -> Any | None:
    """Lazily configure MLflow. Returns the mlflow module or None if disabled."""
    global _initialized
    if not settings.ENABLE_MLFLOW:
        return None
    try:
        import mlflow

        if not _initialized:
            mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
            mlflow.set_experiment(settings.MLFLOW_EXPERIMENT_NAME)
            _initialized = True
        return mlflow
    except Exception as exc:  # pragma: no cover - infra dependent
        logger.warning("mlflow_init_failed", error=str(exc))
        return None


@contextlib.contextmanager
def mlflow_run(run_name: str, tags: dict[str, str] | None = None) -> Iterator[Any | None]:
    """Context manager that starts an MLflow run if available."""
    mlflow = _ensure_init()
    if mlflow is None:
        yield None
        return
    try:
        with mlflow.start_run(run_name=run_name, tags=tags) as run:
            yield run
    except Exception as exc:  # pragma: no cover
        logger.warning("mlflow_run_failed", error=str(exc))
        yield None


def track_llm_call(
    *,
    agent: str,
    prompt_name: str,
    prompt_version: str,
    input_tokens: int,
    output_tokens: int,
    latency_ms: float,
) -> None:
    """Log metrics/params for a single LLM call to the active run."""
    mlflow = _ensure_init()
    if mlflow is None or mlflow.active_run() is None:
        return
    info = get_provider_info()
    cost = estimate_cost_usd(info.model, input_tokens, output_tokens)
    try:
        mlflow.log_params(
            {
                f"{agent}.provider": info.provider,
                f"{agent}.model": info.model,
                f"{agent}.prompt": f"{prompt_name}@{prompt_version}",
            }
        )
        mlflow.log_metrics(
            {
                f"{agent}.input_tokens": input_tokens,
                f"{agent}.output_tokens": output_tokens,
                f"{agent}.latency_ms": latency_ms,
                f"{agent}.cost_usd": cost,
            }
        )
    except Exception as exc:  # pragma: no cover
        logger.warning("mlflow_track_failed", error=str(exc))


def log_recommendation_run(
    *,
    user_id: int,
    query: str,
    num_candidates: int,
    num_final: int,
    total_latency_ms: float,
    accepted: bool | None = None,
) -> None:
    """Log a top-level recommendation pipeline run."""
    mlflow = _ensure_init()
    if mlflow is None or mlflow.active_run() is None:
        return
    try:
        mlflow.log_params({"user_id": user_id, "query": query[:240]})
        mlflow.log_metrics(
            {
                "candidates": num_candidates,
                "final_recommendations": num_final,
                "pipeline_latency_ms": total_latency_ms,
            }
        )
        if accepted is not None:
            mlflow.log_metric("accepted", int(accepted))
    except Exception as exc:  # pragma: no cover
        logger.warning("mlflow_reco_log_failed", error=str(exc))


class Timer:
    """Tiny helper to measure latency in milliseconds."""

    def __init__(self) -> None:
        self._start = 0.0
        self.elapsed_ms = 0.0

    def __enter__(self) -> Timer:
        self._start = time.perf_counter()
        return self

    def __exit__(self, *_: object) -> None:
        self.elapsed_ms = (time.perf_counter() - self._start) * 1000
