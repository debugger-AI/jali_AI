"""
Jali MLOps — Monitoring Setup
Initializes native Snowflake Model Monitors for all production health pillars.
"""

import os
import sys
from snowflake.snowpark import Session
from dotenv import load_dotenv

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
load_dotenv(os.path.join(project_root, ".env"))

def get_session():
    return Session.builder.configs({
        "account":   os.getenv("SNOWFLAKE_ACCOUNT"),
        "user":      os.getenv("SNOWFLAKE_USER"),
        "password":  os.getenv("SNOWFLAKE_PASSWORD"),
        "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE"),
        "database":  os.getenv("SNOWFLAKE_DATABASE"),
        "schema":    "MLOPS",
        "role":      os.getenv("SNOWFLAKE_ROLE", "ACCOUNTADMIN"),
    }).create()

def setup_monitors():
    session = get_session()
    print("[Monitoring] Initializing Inference Table...")
    
    # Ensure the table is created (though schema.sql should handle this)
    session.sql("""
        CREATE TABLE IF NOT EXISTS MLOPS.INFERENCE_LOGS (
            EVENT_ID NUMBER AUTOINCREMENT PRIMARY KEY,
            PILLAR VARCHAR(50),
            MODEL_VERSION VARCHAR(100),
            TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
            ADHERENCE_SCORE FLOAT,
            BARRIERS_SCORE FLOAT,
            GENDER VARCHAR(50),
            AGE_GROUP VARCHAR(50),
            AGE FLOAT,
            BMI FLOAT,
            CYCLE_LENGTH FLOAT,
            ART_STATUS VARCHAR(50),
            ELIGIBILITY VARCHAR(50),
            IMMUNIZATION_STATUS VARCHAR(50),
            PREDICTION VARIANT,
            LABEL VARIANT
        )
    """).collect()

    # Get production models from the registry
    registry_query = """
        SELECT PILLAR, MODEL_NAME, MODEL_VERSION 
        FROM MLOPS.MODEL_REGISTRY 
        WHERE STATUS = 'PRODUCTION'
    """
    production_models = session.sql(registry_query).collect()
    
    if not production_models:
        print("[Monitoring] [WARNING] No PRODUCTION models found. Train models first.")
        return

    for row in production_models:
        pillar, model_name, version = row
        monitor_name = f"{model_name}_MONITOR"
        print(f"[Monitoring] Setting up monitor for {pillar} ({model_name} {version})...")
        
        # Use SQL to create the monitor natively
        # We specify the baseline table based on the pillar's feature view
        baseline_table = "FEATURES.UNIFIED_ADHERENCE_STORE"
        if pillar == "menstrual":
            baseline_table = "FEATURES.FERTILITY_STORE"
            
        try:
            # Drop existing monitor if any
            session.sql(f"DROP MODEL MONITOR IF EXISTS {monitor_name}").collect()
            
            # The confirmed working syntax uses WITH and array parameters
            create_sql = f"""
                CREATE MODEL MONITOR {monitor_name}
                WITH
                MODEL = {model_name}
                VERSION = {version}
                MODEL_TYPE = BINARY_CLASSIFICATION
                SOURCE_TABLE = MLOPS.INFERENCE_LOGS
                TIMESTAMP_COLUMN = TIMESTAMP
                PREDICTION_CLASS_COLUMNS = ('PREDICTION')
                LABEL_COLUMNS = ('LABEL')
                AGGREGATION_WINDOW = '1 DAY'
                BASELINE_TABLE = {baseline_table}
            """
            session.sql(create_sql).collect()
            print(f"   [SUCCESS] Monitor {monitor_name} created.")
        except Exception as e:
            print(f"   [ERROR] Failed to create monitor for {pillar}: {e}")

    session.close()

if __name__ == "__main__":
    setup_monitors()
