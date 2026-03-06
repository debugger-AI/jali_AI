"""
Jali MLOps — Mock Prediction Logger
Populates MLOPS.INFERENCE_LOGS to demonstrate native Snowflake monitoring charts.
"""

import os
import sys
import random
import pandas as pd
from datetime import datetime, timedelta
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

def log_mock_predictions():
    session = get_session()
    print("[Mock] Logging simulated inference data...")

    # Get production models
    registry_query = "SELECT PILLAR, MODEL_VERSION FROM MLOPS.MODEL_REGISTRY WHERE STATUS = 'PRODUCTION'"
    models = session.sql(registry_query).collect()
    
    if not models:
        print("[Mock] [ERROR] No PRODUCTION models found.")
        return

    data = []
    # Simulate data for the last 7 days
    for day in range(7):
        ts = datetime.now() - timedelta(days=day)
        for row in models:
            pillar, version = row
            # Create 10 mock entries per day per pillar
            for _ in range(10):
                # Simulate features and predictions
                # We add some "drift" for the last few days in HIV
                drift_factor = 0.2 if (pillar == "hiv_adherence" and day < 3) else 0.0
                
                entry = {
                    "PILLAR": pillar,
                    "MODEL_VERSION": version,
                    "TIMESTAMP": ts,
                    "ADHERENCE_SCORE": random.uniform(0.4, 0.9) - drift_factor,
                    "BARRIERS_SCORE": random.uniform(0, 5) + (drift_factor * 2),
                    "GENDER": random.choice(["Male", "Female"]),
                    "AGE_GROUP": random.choice(["18-24", "25-34", "35-44"]),
                    "PREDICTION": random.choice([0, 1]),
                    "LABEL": random.choice([0, 1])
                }
                data.append(entry)

    # Convert to Snowpark DF and save
    df = pd.DataFrame(data)
    # Convert TIMESTAMP to string for Snowflake format if needed, but Snowpark handled it usually
    session.create_dataframe(df).write.mode("append").save_as_table("MLOPS.INFERENCE_LOGS")
    
    print(f"[Mock] [SUCCESS] Logged {len(df)} rows of simulated inference data.")
    session.close()

if __name__ == "__main__":
    log_mock_predictions()
