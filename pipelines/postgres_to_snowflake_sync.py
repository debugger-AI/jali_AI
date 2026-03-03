import os
import psycopg2
import snowflake.connector
import pandas as pd
import time
from datetime import datetime
from dotenv import load_dotenv


load_dotenv()

# List of tables to sync from Postgres to Snowflake
TABLES_TO_SYNC = [
    {'name': 'ovc_cases', 'schema': 'RAW'},
    {'name': 'households', 'schema': 'RAW'},
    {'name': 'health_workers', 'schema': 'RAW'}
]
SYNC_INTERVAL_SECONDS = 300 

def get_postgres_conn():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'jali_oltp'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASS', 'password'),
        port=os.getenv('DB_PORT', '5432')
    )

def get_snowflake_conn():
    return snowflake.connector.connect(
        account=os.getenv('SNOWFLAKE_ACCOUNT'),
        user=os.getenv('SNOWFLAKE_USER'),
        password=os.getenv('SNOWFLAKE_PASSWORD'),
        warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
        database=os.getenv('SNOWFLAKE_DATABASE'),
        schema=os.getenv('SNOWFLAKE_SCHEMA', 'RAW'),
        role=os.getenv('SNOWFLAKE_ROLE', 'ACCOUNTADMIN')
    )

def sync_table(table_info):
    table_name = table_info['name']
    target_schema = table_info['schema']
    print(f"[{datetime.now()}] Syncing table: {table_name}...")
    
    try:
        sf_conn = get_snowflake_conn()
        pg_conn = get_postgres_conn()
        sf_cursor = sf_conn.cursor()
        
        # Get last sync timestamp from Snowflake (incremental update)
        # Ensure the table exists in Snowflake first
        sf_cursor.execute(f"CREATE TABLE IF NOT EXISTS {target_schema}.POSTGRES_{table_name.upper()} AS SELECT * FROM {target_schema}.POSTGRES_{table_name.upper()} LIMIT 0")
        
        sf_cursor.execute(f"SELECT MAX(created_at) FROM {target_schema}.POSTGRES_{table_name.upper()}")
        last_sync = sf_cursor.fetchone()[0]
        
        if last_sync is None:
            last_sync = datetime(1900, 1, 1)
            print(f"   Initial sync for {table_name}.")
        
        # Get new data from Postgres
        pg_query = f"SELECT * FROM {table_name} WHERE created_at > %s"
        df = pd.read_sql_query(pg_query, pg_conn, params=(last_sync,))
        
        if df.empty:
            print(f"   No new records in {table_name}.")
        else:
            print(f"   Found {len(df)} new records. Uploading...")
            temp_file = f"temp_{table_name}.csv"
            df.to_csv(temp_file, index=False, header=False)
            
            # Stage load into Snowflake
            sf_cursor.execute(f"PUT 'file://{os.path.abspath(temp_file)}' @RAW.JALI_CSV_STAGE/sync/{table_name}/ OVERWRITE=TRUE")
            sf_cursor.execute(f"""
                COPY INTO {target_schema}.POSTGRES_{table_name.upper()} 
                FROM @RAW.JALI_CSV_STAGE/sync/{table_name}/
                FILE_FORMAT = (TYPE = 'CSV' SKIP_HEADER = 0 FIELD_OPTIONALLY_ENCLOSED_BY = '\"')
            """)
            print(f"   Success: {len(df)} records added to {table_name}.")
            if os.path.exists(temp_file): os.remove(temp_file)

    except Exception as e:
        print(f"❌ Error syncing {table_name}: {e}")
    finally:
        if 'sf_conn' in locals(): sf_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

def run_full_sync():
    print(f"--- Jali Pipeline: Starting Full Sync ---")
    for table in TABLES_TO_SYNC:
        sync_table(table)
    print(f"--- Jali Pipeline: Sync Sequence Finished ---")

if __name__ == "__main__":
    run_full_sync()
