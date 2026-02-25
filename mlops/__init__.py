"""
Jali MLOps package.
Exposes the core trainer, registry, and drift monitor.
"""

from .snowpark_trainer import run_pipeline
from .model_registry   import register_model, promote_to_production, get_latest_model
from .drift_monitor    import compute_and_log_drift
from .retrain_trigger  import check_and_trigger

__all__ = [
    "run_pipeline",
    "register_model",
    "promote_to_production",
    "get_latest_model",
    "compute_and_log_drift",
    "check_and_trigger",
]
