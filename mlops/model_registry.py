"""
Jali MLOps — Model Registry
Handles logging models to the native Snowflake Model Registry
while maintaining legacy support for the audit tables.
"""

import os
from datetime import datetime
from snowflake.ml.registry import Registry

def register_model(session, pillar: str, metrics: dict, model_obj=None, sample_input=None, git_sha: str = None) -> str:
    """
    Log a model to the native Snowflake Model Registry and update audit tables.
    
    Args:
        session     : active Snowpark session
        pillar      : 'hiv_adherence' | 'tb_adherence' | 'immunization' | 'menstrual'
        metrics     : dict with performance scores
        model_obj   : the trained model object (XGBoost, Sklearn, etc.)
        sample_input: sample data for schema inference
        git_sha     : optional git commit SHA
    """
    db = session.get_current_database().replace('"', '')
    schema = "MLOPS"
    
    # 1. Initialize Native Registry
    reg = Registry(session=session, database_name=db, schema_name=schema)
    
    model_name = f"JALI_{pillar.upper()}"
    version = f"V{datetime.now().strftime('%Y%m%d_%H%M')}"
    git_sha = git_sha or os.getenv("GITHUB_SHA", "local")
    
    # 2. Log to Native Registry if model object exists
    if model_obj is not None:
        try:
            mv = reg.log_model(
                model=model_obj,
                model_name=model_name,
                version_name=version,
                sample_input_data=sample_input,
                comment=f"Pillar: {pillar}, Git SHA: {git_sha}, AUC: {metrics.get('auc', 0):.4f}"
            )
            print(f"   [Registry] Native Model {model_name} {version} logged successfully.")
        except Exception as e:
            print(f"   [WARNING] Native logging failed, falling back to audit table: {e}")

    # 3. LEGACY: Update the custom audit tables for backward compatibility
    auc = round(float(metrics.get("auc", 0)), 6)
    rows = int(metrics.get("training_rows", 0))
    
    session.sql(f"""
        INSERT INTO MLOPS.MODEL_REGISTRY (PILLAR, MODEL_NAME, MODEL_VERSION, STATUS, AUC_SCORE, TRAINING_ROWS, GIT_COMMIT_SHA)
        VALUES ('{pillar}', '{model_name}', '{version}', 'STAGING', {auc}, {rows}, '{git_sha}')
    """).collect()
    
    # Fetch the model_id for compatibility with legacy promote_to_production
    result = session.sql(f"SELECT MODEL_ID FROM MLOPS.MODEL_REGISTRY WHERE MODEL_VERSION = '{version}'").collect()
    model_id = result[0][0] if result else 0

    print(f"   [Registry] Audit log updated for {pillar} {version} (ID={model_id}).")
    return model_id

def promote_to_production(session, pillar: str, model_id: int):
    """Archive existing PRODUCTION and promote model_id."""
    session.sql(f"UPDATE MLOPS.MODEL_REGISTRY SET STATUS = 'ARCHIVED' WHERE PILLAR = '{pillar}' AND STATUS = 'PRODUCTION'").collect()
    session.sql(f"UPDATE MLOPS.MODEL_REGISTRY SET STATUS = 'PRODUCTION' WHERE MODEL_ID = {model_id}").collect()
    print(f"   [Registry] Model ID={model_id} promoted to PRODUCTION for {pillar}")

def get_latest_model(session, pillar: str) -> dict:
    """Return the current PRODUCTION model record."""
    result = session.sql(f"SELECT MODEL_ID, MODEL_VERSION, AUC_SCORE, TRAINED_AT FROM MLOPS.MODEL_REGISTRY WHERE PILLAR = '{pillar}' AND STATUS = 'PRODUCTION' ORDER BY TRAINED_AT DESC LIMIT 1").collect()
    if not result: return {}
    return {"model_id": result[0][0], "version": result[0][1], "auc": result[0][2], "trained_at": str(result[0][3])}
