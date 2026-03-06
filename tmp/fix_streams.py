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
    print("Creating missing Snowflake Streams in RAW schema...")
    
    # Create the streams used by the auto-retrain task and trigger
    cursor.execute("CREATE OR REPLACE STREAM RAW.HIV_ADHERENCE_STREAM ON TABLE RAW.HIV_ADHERENCE_DATASET")
    print(" - Created RAW.HIV_ADHERENCE_STREAM")
    
    cursor.execute("CREATE OR REPLACE STREAM RAW.CRT_STREAM ON TABLE RAW.CRT_DATASET")
    print(" - Created RAW.CRT_STREAM")
    
    cursor.execute("CREATE OR REPLACE STREAM RAW.FEDCYCLE_STREAM ON TABLE RAW.FEDCYCLEDATA")
    print(" - Created RAW.FEDCYCLE_STREAM")
    
    cursor.execute("CREATE OR REPLACE STREAM RAW.POSTGRES_OVC_STREAM ON TABLE RAW.POSTGRES_OVC_CASES")
    print(" - Created RAW.POSTGRES_OVC_STREAM")

    print("\nResuming Retrain Tasks...")
    cursor.execute("ALTER TASK MLOPS.TSK_AUTO_RETRAIN_FLAG RESUME")
    print(" - Resumed MLOPS.TSK_AUTO_RETRAIN_FLAG")

    print("\nSuccess! The 'must be a valid stream name' error should be resolved.")

finally:
    conn.close()
