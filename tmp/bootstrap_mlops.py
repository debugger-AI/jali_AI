import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv('.env')

def run_sql_file(conn, file_path):
    with open(file_path, 'r') as f:
        sql_commands = f.read().split(';')
        for command in sql_commands:
            if command.strip():
                try:
                    conn.cursor().execute(command)
                    print(f"Executed: {command[:50]}...")
                except Exception as e:
                    print(f"Error executing command: {e}")

conn = snowflake.connector.connect(
    user=os.getenv('SNOWFLAKE_USER'),
    password=os.getenv('SNOWFLAKE_PASSWORD'),
    account=os.getenv('SNOWFLAKE_ACCOUNT'),
    warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
    database=os.getenv('SNOWFLAKE_DATABASE'),
    role=os.getenv('SNOWFLAKE_ROLE')
)

try:
    print("Bootstrapping MLOps Schema...")
    run_sql_file(conn, 'snowflake/mlops_schema.sql')
    print("Creating Monitoring Views...")
    run_sql_file(conn, 'snowflake/monitoring_views.sql')
    print("Bootstrap Complete!")
finally:
    conn.close()
