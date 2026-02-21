from airflow import DAG
from airflow.providers.standard.operators.python import PythonOperator
from datetime import datetime, timedelta
import sys
import os


PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(PROJECT_PATH, "pipelines"))

# Import the sync function from the pipelines folder
try:
    from postgres_to_snowflake_sync import run_full_sync
except ImportError:
    
    def run_full_sync():
        print("Error: Could not find postgres_to_snowflake_sync.py in pipelines folder.")

# workflow dag defination
default_args = {
    'owner': 'Jali_Data_Engineer',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 3,                 
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'jali_snowflake_ml_sync',
    default_args=default_args,
    description='Professional sync: Entire Postgres DB -> Snowflake RAW',
    schedule='@hourly',
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=['jali', 'production', 'multi-table'],
) as dag:

  
    sync_task = PythonOperator(
        task_id='sync_all_postgres_tables',
        python_callable=run_full_sync,
        doc_md="""
        ### Multi-Table Sync
        This task iterates through all configured Postgres tables and syncs them 
        into the Snowflake RAW schema incrementally.
        """
    )



  
