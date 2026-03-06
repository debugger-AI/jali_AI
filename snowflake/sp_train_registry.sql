-- Snowflake Native MLOps Stored Procedure
-- This procedure runs natively in Snowflake to bypass local environment issues.

CREATE OR REPLACE PROCEDURE MLOPS.TRAIN_AND_REGISTER_PILLAR(pillar_name STRING)
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
PACKAGES = ('snowflake-snowpark-python', 'snowflake-ml-python', 'pandas', 'xgboost', 'scikit-learn')
HANDLER = 'main'
AS
$$
import pandas as pd
from xgboost import XGBClassifier
from sklearn.metrics import roc_auc_score
from snowflake.ml.registry import Registry

def main(session, pillar_name):
    # 1. Configuration
    config = {
        "hiv_adherence": {
            "table": "FEATURES.UNIFIED_ADHERENCE_STORE",
            "filter": "DISEASE_TYPE = 'HIV'",
            "features": ["ADHERENCE_SCORE", "BARRIERS_SCORE", "GENDER", "AGE_GROUP"],
            "target": "ADHERENCE_SCORE"
        },
        "tb_adherence": {
            "table": "FEATURES.UNIFIED_ADHERENCE_STORE",
            "filter": "DISEASE_TYPE = 'TB'",
            "features": ["ADHERENCE_SCORE", "BARRIERS_SCORE", "GENDER", "AGE_GROUP"],
            "target": "ADHERENCE_SCORE"
        }
    }
    
    if pillar_name not in config:
        return f"Error: Pillar {pillar_name} not configured."
    
    cfg = config[pillar_name]
    
    # 2. Load Data
    query = f"SELECT * FROM {cfg['table']} WHERE {cfg['filter']}"
    df = session.sql(query).to_pandas()
    
    if len(df) < 10:
        return f"Warning: Insufficient data for {pillar_name} ({len(df)} rows)."
    
    # 3. Simple Preprocessing
    # Label encode categoricals
    for col in ['GENDER', 'AGE_GROUP']:
        if col in df.columns:
            df[col] = df[col].astype('category').cat.codes
            
    target = cfg['target']
    features = [f for f in cfg['features'] if f in df.columns]
    
    # Binarize target if needed
    if df[target].nunique() > 2:
        median = df[target].median()
        df[target] = (df[target] >= median).astype(int)
    
    X = df[features]
    y = df[target]
    
    # 4. Train
    model = XGBClassifier(n_estimators=100, max_depth=4)
    model.fit(X, y)
    
    auc = roc_auc_score(y, model.predict_proba(X)[:,1])
    
    # 5. Register in Native Registry
    reg = Registry(session=session, database_name=session.get_current_database(), schema_name="MLOPS")
    
    model_name = f"JALI_{pillar_name.upper()}"
    version = f"V_SP_{pd.Timestamp.now().strftime('%Y%m%d_%H%M')}"
    
    mv = reg.log_model(
        model=model,
        model_name=model_name,
        version_name=version,
        sample_input_data=X.head(10),
        comment=f"Trained via Snowpark Stored Procedure. Local AUC: {auc:.4f}"
    )
    
    # 6. Update Legacy Audit Table
    session.sql(f"""
        INSERT INTO MLOPS.MODEL_REGISTRY (PILLAR, MODEL_NAME, MODEL_VERSION, STATUS, AUC_SCORE, TRAINING_ROWS)
        VALUES ('{pillar_name}', '{model_name}', '{version}', 'PRODUCTION', {auc}, {len(df)})
    """).collect()
    
    return f"Success: Registered {model_name} {version} with AUC {auc:.4f}"

$$;
