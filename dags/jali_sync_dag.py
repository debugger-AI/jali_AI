from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
import sys
import os

# ---------------------------------------------------------------------------
# Project path resolution (works in both WSL and Windows-mounted paths)
# ---------------------------------------------------------------------------
PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(PROJECT_PATH, "pipelines"))
sys.path.append(os.path.join(PROJECT_PATH, "mlops"))

# Import sync function
try:
    from postgres_to_snowflake_sync import run_full_sync
except ImportError:
    def run_full_sync():
        print("Error: Could not find postgres_to_snowflake_sync.py in pipelines folder.")

# Import retrain trigger
try:
    from retrain_trigger import check_and_trigger
except ImportError:
    def check_and_trigger():
        print("MLOps retrain_trigger not yet available — skipping.")

# ---------------------------------------------------------------------------
# DAG defaults
# ---------------------------------------------------------------------------
default_args = {
    'owner': 'Jali_Data_Engineer',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

# ---------------------------------------------------------------------------
# DAG definition: sync Postgres → Snowflake, then retrain ML models if needed
# ---------------------------------------------------------------------------
with DAG(
    'jali_snowflake_ml_pipeline',
    default_args=default_args,
    description='Sync Postgres → Snowflake RAW, then trigger Snowpark ML retraining if new data detected',
    schedule='@hourly',
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=['jali', 'production', 'mlops', 'snowpark'],
) as dag:

    # Task 1: Sync all Postgres tables → Snowflake RAW schema
    sync_task = PythonOperator(
        task_id='sync_all_postgres_tables',
        python_callable=run_full_sync,
        doc_md="""
        ### Multi-Table Sync
        Iterates through all configured Postgres tables and syncs them
        into the Snowflake RAW schema incrementally.
        Retries 3 times on failure with a 5-minute delay.
        """,
    )

    # Task 2: Check Snowflake streams for new data; retrain if detected
    retrain_task = PythonOperator(
        task_id='trigger_snowpark_retraining',
        python_callable=check_and_trigger,
        doc_md="""
        ### Snowpark ML Retraining
        Checks each RAW stream (HIV, TB, Menstrual, OVC) for new data via
        SYSTEM$STREAM_HAS_DATA. If new data is present, calls
        mlops/snowpark_trainer.py for the affected pillars. Logs every run
        to MLOPS.TRAINING_RUNS in Snowflake.
        """,
    )

    # Pipeline order: sync must complete before retraining
    sync_task >> retrain_task
