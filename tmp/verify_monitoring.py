import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv('.env')

conn = snowflake.connector.connect(
    user=os.getenv('SNOWFLAKE_USER'),
    password=os.getenv('SNOWFLAKE_PASSWORD'),
    account=os.getenv('SNOWFLAKE_ACCOUNT'),
    warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
    database=os.getenv('SNOWFLAKE_DATABASE'),
    role=os.getenv('SNOWFLAKE_ROLE')
)

try:
    cursor = conn.cursor()
    
    print("--- [NATIVE MODEL REGISTRY] ---")
    try:
        cursor.execute("SHOW MODELS IN SCHEMA MLOPS")
        # SHOW MODELS index: 1=Name, 6=Version, 2=Comment
        for row in cursor:
            print(f" - Native Model: {row[1]} | Version: {row[6]} | Comment: {row[2]}")
    except Exception as e:
        print(f"   [ERROR] Could not query native models: {e}")

    print("\n--- [AUDIT TABLE REGISTRY] ---")
    cursor.execute("SELECT COUNT(*) FROM MLOPS.MODEL_REGISTRY")
    print(f"Audit Entries: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT PILLAR, MODEL_VERSION, AUC_SCORE, STATUS FROM MLOPS.MODEL_REGISTRY ORDER BY TRAINED_AT DESC LIMIT 10")
    for row in cursor:
        print(f" - {row[0]}: {row[1]} (AUC: {row[2]:.4f}) [{row[3]}]")
        
    print("\n--- [MONITORING VIEW] ---")
    cursor.execute("SELECT PILLAR, CURRENT_VERSION, CURRENT_AUC FROM MLOPS.V_LATEST_MODEL_PERFORMANCE")
    for row in cursor:
        print(f" - {row[0]}: v{row[1]} | AUC: {row[2]}")

finally:
    conn.close()
