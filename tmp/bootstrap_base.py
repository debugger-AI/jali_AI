import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv('.env')

def run_sql_file(conn, file_path):
    with open(file_path, 'r') as f:
        # Split by semicolon but ignore semicolons inside single quotes or comments
        # This is a simple split, better SQL parsers exist but this handles most cases
        sql_commands = f.read().split(';')
        for command in sql_commands:
            if command.strip():
                try:
                    conn.cursor().execute(command)
                    print(f"Executed command from {file_path}")
                except Exception as e:
                    print(f"Error in {file_path}: {e}")

conn = snowflake.connector.connect(
    user=os.getenv('SNOWFLAKE_USER'),
    password=os.getenv('SNOWFLAKE_PASSWORD'),
    account=os.getenv('SNOWFLAKE_ACCOUNT'),
    warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
    database=os.getenv('SNOWFLAKE_DATABASE'),
    role=os.getenv('SNOWFLAKE_ROLE')
)

try:
    print("Bootstrapping Base Tables (Jali.sql)...")
    run_sql_file(conn, 'Analytical DB/Jali.sql')
    
    print("Bootstrapping Feature Engineering (feature_engineering.sql)...")
    run_sql_file(conn, 'snowflake/feature_engineering.sql')
    
    print("Bootstrapping Unified Features (unified_ml_features.sql)...")
    run_sql_file(conn, 'snowflake/unified_ml_features.sql')
    
    print("Base Architecture Bootstrap Complete!")
finally:
    conn.close()
