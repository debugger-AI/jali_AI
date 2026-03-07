import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv('.env')

def check_drift_data():
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
        print("--- [DRIFT TABLE CHECK] ---")
        cursor.execute("SELECT COUNT(*) FROM MLOPS.DRIFT_MONITOR")
        count = cursor.fetchone()[0]
        print(f"Total Drift Records: {count}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_drift_data()
