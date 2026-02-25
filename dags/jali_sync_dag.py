from airflow import DAG
<<<<<<< HEAD
from airflow.operators.python import PythonOperator
=======
from airflow.providers.standard.operators.python import PythonOperator
>>>>>>> feature/ml-models
from datetime import datetime, timedelta
import sys
import os


<<<<<<< HEAD
PROJECT_PATH = "/mnt/c/Users/jerem/OneDrive/Desktop/Jali"
=======
PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
>>>>>>> feature/ml-models
sys.path.append(os.path.join(PROJECT_PATH, "pipelines"))

# Import the sync function from the pipelines folder
try:
<<<<<<< HEAD
    from postgres_to_snowflake_sync import sync_ovc_cases
except ImportError:
    
    def sync_ovc_cases():
=======
    from postgres_to_snowflake_sync import run_full_sync
except ImportError:
    
    def run_full_sync():
>>>>>>> feature/ml-models
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
<<<<<<< HEAD
    description='Professional sync: Postgres -> Snowflake for Jali ML',
    schedule_interval='@hourly',
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=['jali', 'production', 'consistency'],
=======
    description='Professional sync: Entire Postgres DB -> Snowflake RAW',
    schedule='@hourly',
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=['jali', 'production', 'multi-table'],
>>>>>>> feature/ml-models
) as dag:

  
    sync_task = PythonOperator(
<<<<<<< HEAD
        task_id='sync_live_postgres_data',
        python_callable=sync_ovc_cases,
        doc_md="""
        ### Consistency Guard
        This task performs incremental loading based on the last record in Snowflake.
        If it fails, it will auto-retry 3 times before alerting the admin.
=======
        task_id='sync_all_postgres_tables',
        python_callable=run_full_sync,
        doc_md="""
        ### Multi-Table Sync
        This task iterates through all configured Postgres tables and syncs them 
        into the Snowflake RAW schema incrementally.
>>>>>>> feature/ml-models
        """
    )



  
