"""
Jali MLOps — Model Registry
Handles writing training results to Snowflake MLOPS.MODEL_REGISTRY
and MLOPS.MODEL_METRICS tables.
"""

import os
from datetime import datetime, timezone


def _next_version(session, pillar: str) -> str:
    """Auto-increment semantic version for a given pillar."""
    result = session.sql(
        f"SELECT MAX(MODEL_VERSION) FROM MLOPS.MODEL_REGISTRY WHERE PILLAR = '{pillar}'"
    ).collect()
    latest = result[0][0] if result and result[0][0] else None
    if latest is None:
        return "v1.0"
    try:
        major, minor = latest.lstrip("v").split(".")
        return f"v{major}.{int(minor) + 1}"
    except Exception:
        return "v1.0"


def register_model(session, pillar: str, metrics: dict, git_sha: str = None) -> int:
    """
    Insert a new model version into MODEL_REGISTRY with STAGING status.
    Returns the new MODEL_ID.

    Args:
        session  : active Snowpark session
        pillar   : 'hiv_adherence' | 'tb_adherence' | 'immunization' | 'menstrual'
        metrics  : dict with keys auc, f1, precision, recall, training_rows
        git_sha  : optional git commit SHA from CI/CD environment
    """
    version = _next_version(session, pillar)
    git_sha = git_sha or os.getenv("GITHUB_SHA", "local")
    auc        = round(float(metrics.get("auc", 0)), 6)
    f1         = round(float(metrics.get("f1", 0)), 6)
    precision  = round(float(metrics.get("precision", 0)), 6)
    recall     = round(float(metrics.get("recall", 0)), 6)
    rows       = int(metrics.get("training_rows", 0))

    model_name = f"jali_{pillar}_xgb"

    session.sql(f"""
        INSERT INTO MLOPS.MODEL_REGISTRY
            (PILLAR, MODEL_NAME, MODEL_VERSION, STATUS,
             AUC_SCORE, F1_SCORE, PRECISION_SCORE, RECALL_SCORE,
             TRAINING_ROWS, GIT_COMMIT_SHA)
        VALUES
            ('{pillar}', '{model_name}', '{version}', 'STAGING',
             {auc}, {f1}, {precision}, {recall},
             {rows}, '{git_sha}')
    """).collect()

    # Fetch the new MODEL_ID
    result = session.sql(
        f"""
        SELECT MODEL_ID FROM MLOPS.MODEL_REGISTRY
        WHERE PILLAR = '{pillar}' AND MODEL_VERSION = '{version}'
        ORDER BY TRAINED_AT DESC LIMIT 1
        """
    ).collect()
    model_id = result[0][0]

    # Log individual metrics to time-series table
    for metric_name, value in [
        ("auc", auc), ("f1", f1),
        ("precision", precision), ("recall", recall),
        ("training_rows", rows)
    ]:
        session.sql(f"""
            INSERT INTO MLOPS.MODEL_METRICS (MODEL_ID, PILLAR, METRIC_NAME, METRIC_VALUE)
            VALUES ({model_id}, '{pillar}', '{metric_name}', {value})
        """).collect()

    print(f"   [Registry] {pillar} {version} registered (ID={model_id}, AUC={auc:.4f})")
    return model_id


def promote_to_production(session, pillar: str, model_id: int):
    """
    Archive the current PRODUCTION model for this pillar,
    then promote model_id to PRODUCTION.
    """
    # Archive existing production models
    session.sql(f"""
        UPDATE MLOPS.MODEL_REGISTRY
        SET STATUS = 'ARCHIVED'
        WHERE PILLAR = '{pillar}' AND STATUS = 'PRODUCTION'
    """).collect()

    # Promote new model
    session.sql(f"""
        UPDATE MLOPS.MODEL_REGISTRY
        SET STATUS = 'PRODUCTION'
        WHERE MODEL_ID = {model_id}
    """).collect()
    print(f"   [Registry] Model ID={model_id} promoted to PRODUCTION for pillar '{pillar}'")


def get_latest_model(session, pillar: str) -> dict:
    """Return the current PRODUCTION model record for a pillar."""
    result = session.sql(f"""
        SELECT MODEL_ID, MODEL_VERSION, AUC_SCORE, F1_SCORE, TRAINED_AT
        FROM MLOPS.MODEL_REGISTRY
        WHERE PILLAR = '{pillar}' AND STATUS = 'PRODUCTION'
        ORDER BY TRAINED_AT DESC LIMIT 1
    """).collect()

    if not result:
        return {}
    row = result[0]
    return {
        "model_id": row[0],
        "version": row[1],
        "auc": row[2],
        "f1": row[3],
        "trained_at": str(row[4]),
    }
