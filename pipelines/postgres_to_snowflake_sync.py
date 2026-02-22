import os
import psycopg2
import snowflake.connector
import pandas as pd
import time
from datetime import datetime
from dotenv import load_dotenv


load_dotenv()

# table sync from Postgres to Snowflake
TABLES_TO_SYNC = [
    {'name': 'ovc_cases', 'schema': 'RAW'},
    {'name': 'households', 'schema': 'RAW'},
    {'name': 'chvs', 'schema': 'RAW'},
    {'name': 'ovcs', 'schema': 'RAW'},
    {'name': 'caregivers', 'schema': 'RAW'},
    {'name': 'cbos', 'schema': 'RAW'},
    {'name': 'facilities', 'schema': 'RAW'},
    {'name': 'schools', 'schema': 'RAW'},
    {'name': 'immunization_schedule', 'schema': 'RAW'}
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
        
        # 1. Check if 'created_at' exists for incremental sync
        cur = pg_conn.cursor()
        cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}' AND column_name = 'created_at'")
        has_created_at = cur.fetchone() is not None
        
        # 2. Fetch data from Postgres
        pg_query = f"SELECT * FROM {table_name}"
        sf_cursor.execute(f"SHOW TABLES LIKE 'POSTGRES_{table_name.upper()}' IN SCHEMA {target_schema}")
        table_exists = sf_cursor.fetchone()
        
        last_sync = datetime(1900, 1, 1)
        if table_exists and has_created_at:
            sf_cursor.execute(f"SELECT MAX(created_at) FROM {target_schema}.POSTGRES_{table_name.upper()}")
            res = sf_cursor.fetchone()[0]
            if res: last_sync = res
        
        if has_created_at:
            print(f"   Syncing incremental data since {last_sync}...")
            df = pd.read_sql_query(f"{pg_query} WHERE created_at > %s", pg_conn, params=(last_sync,))
        else:
            print(f"   No 'created_at' column found. Performing FULL sync for {table_name}...")
            df = pd.read_sql_query(pg_query, pg_conn)
        
            if table_exists:
                print(f"   Truncating existing table for full reload...")
                sf_cursor.execute(f"TRUNCATE TABLE {target_schema}.POSTGRES_{table_name.upper()}")

        # 3. De-identify sensitive data
        def partial_mask_name(name):
            if not pd.notna(name) or str(name).strip() == "":
                return name
            parts = str(name).split()
            masked_parts = []
            for part in parts:
                if len(part) <= 2:
                    masked_parts.append(part[0] + "*" * (len(part)-1) if len(part) > 1 else "*")
                else:
                    masked_parts.append(part[0] + "*" * (len(part)-2) + part[-1])
            return " ".join(masked_parts)

        def mask_generic(val):
            if not pd.notna(val) or str(val).strip() == "":
                return val
            return "****"

        name_cols = {'caregiver_name', 'ovc_name', 'chv_name'}
        other_sensitive_cols = {'national_id', 'phone', 'birth_cert_no', 'ncpwd_no'}
        
        for col in df.columns:
            col_lower = col.lower()
            if col_lower in name_cols:
                print(f"   Applying partial masking to name: {col}")
                df[col] = df[col].apply(partial_mask_name)
            elif col_lower in other_sensitive_cols:
                print(f"   Applying full masking to: {col}")
                df[col] = df[col].apply(mask_generic)

        if df.empty:
            print(f"   No new records in {table_name}.")
            return

       
        if not table_exists:
            print(f"   Table POSTGRES_{table_name.upper()} doesn't exist. Creating...")
            # basic schema from dataframe
            cols_sql = []
            for col, dtype in df.dtypes.items():
                sf_type = "VARCHAR"
                if "int" in str(dtype): sf_type = "INT"
                elif "float" in str(dtype): sf_type = "FLOAT"
                elif "datetime" in str(dtype): sf_type = "TIMESTAMP_NTZ"
                cols_sql.append(f"{col.upper()} {sf_type}")
            
            sf_cursor.execute(f"""
                CREATE TABLE {target_schema}.POSTGRES_{table_name.upper()} (
                    {', '.join(cols_sql)},
                    _SYNCED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
                )
            """)

        # 3. Upload to Snowflake
        print(f"   Found {len(df)} new records. Uploading...")
        temp_file = f"temp_{table_name}.csv"
        df.to_csv(temp_file, index=False, header=False)
        
        # Snowflake COPY INTO requires column list if the CSV doesn't have headers
        col_list = ", ".join([c.upper() for c in df.columns])
        
        abs_path = os.path.abspath(temp_file).replace('\\', '/')
        sf_cursor.execute(f"PUT 'file://{abs_path}' @RAW.JALI_CSV_STAGE/sync/{table_name}/ OVERWRITE=TRUE")
        sf_cursor.execute(f"""
            COPY INTO {target_schema}.POSTGRES_{table_name.upper()} ({col_list})
            FROM @RAW.JALI_CSV_STAGE/sync/{table_name}/
            FILE_FORMAT = (TYPE = 'CSV' SKIP_HEADER = 0 FIELD_OPTIONALLY_ENCLOSED_BY = '\"')
        """)
        print(f"   Success: {len(df)} records added to {table_name}.")
        if os.path.exists(temp_file): os.remove(temp_file)

    except Exception as e:
        print(f"Error syncing {table_name}: {e}")
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
