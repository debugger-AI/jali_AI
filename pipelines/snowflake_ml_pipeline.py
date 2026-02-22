import os
import argparse
import pandas as pd
import snowflake.connector
from dotenv import load_dotenv

# Import models
import sys
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from models import (
    TBAdherenceModel,
    MenstrualTrackingModel,
    HIVQocModel,
    HIVAdherenceModel
)
from models.immunization_tracker import ImmunizationTracker


load_dotenv()

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

def fetch_data(source_type, dataset_name):
    if source_type == 'local':
        file_map = {
            'tb': 'CRT_dataset.csv',
            'menstrual': 'FedCycleData.csv',
            'hiv_qoc': 'QualityOfCare.csv',
            'hiv_adherence': 'HIV_adherence_dataset.csv'
        }
        path = os.path.join(project_root, file_map[dataset_name])
        print(f"   Reading local CSV: {path}")
        return pd.read_csv(path)
    
    else:
        print(f"   Fetching {dataset_name} from Snowflake...")
        query_map = {
            'tb': 'SELECT * FROM RAW.CRT_DATASET',
            'menstrual': 'SELECT * FROM RAW.FEDCYCLEDATA',
            'hiv_qoc': 'SELECT * FROM RAW.QUALITYOFCARE',
            'hiv_adherence': 'SELECT * FROM RAW.HIV_ADHERENCE_DATASET'
        }
        conn = get_snowflake_conn()
        try:
            df = pd.read_sql_query(query_map[dataset_name], conn)
            return df
        finally:
            conn.close()

def run_pipeline(source='local', models_to_run='all'):
    print(f"==================================================")
    print(f"JALI ML PILLARS - Source: {source.upper()}")
    print(f"==================================================")

    # Definitive 4 Pillars
    # 1. HIV Adherence (Processes both Adherence and QoC datasets)
    if models_to_run in ['all', 'hiv']:
        print(f"\n[PILLAR 1] HIV ADHERENCE")
        models = [HIVAdherenceModel(), HIVQocModel()]
        datasets = ['hiv_adherence', 'hiv_qoc']
        for model, ds in zip(models, datasets):
            try:
                df = fetch_data(source, ds)
                model.train(df)
                model.save()
                print(f"   Done: {model.model_name} processed.")
            except Exception as e:
                print(f"   Error in HIV step ({ds}): {e}")

    # 2. TB Adherence
    if models_to_run in ['all', 'tb']:
        print(f"\n[PILLAR 2] TB ADHERENCE")
        try:
            model = TBAdherenceModel()
            df = fetch_data(source, 'tb')
            model.train(df)
            model.save()
            print(f"   Done: TB Adherence Model processed.")
        except Exception as e:
            print(f"   Error in TB step: {e}")

    # 3. Immunization Tracker
    if models_to_run in ['all', 'immunization']:
        print(f"\n[PILLAR 3] IMMUNIZATION TRACKER")
        try:
            if source == 'snowflake':
                print("   Fetching updated schedule from Snowflake...")
                conn = get_snowflake_conn()
                schedule_df = pd.read_sql_query("SELECT * FROM RAW.POSTGRES_IMMUNIZATION_SCHEDULE", conn)
                conn.close()
            else:
                print("   Reading local schedule...")
                schedule_df = pd.read_csv(os.path.join(project_root, 'immunization_schedule.csv'))
            
            tracker = ImmunizationTracker(schedule_df)
            
            if source == 'snowflake':
                print("   Processing OVC immunization records...")
                conn = get_snowflake_conn()
                ovc_query = """
                    SELECT c.ovc_id, o.ovc_name, o.dob, c.immunization_status 
                    FROM RAW.POSTGRES_OVC_CASES c
                    JOIN RAW.POSTGRES_OVCS o ON c.ovc_id = o.ovc_id
                    LIMIT 10
                """
                ovc_df = pd.read_sql_query(ovc_query, conn)
                conn.close()
                results = tracker.batch_process_ovc(ovc_df)
                print("\nSample Immunization Schedule Results:")
                print(results)
            else:
                print("   Immunization tracker ready. (Skipping batch process in local mode)")
        except Exception as e:
            print(f"   Error in Immunization step: {e}")

    # 4. Menstrual Tracking
    if models_to_run in ['all', 'menstrual']:
        print(f"\n[PILLAR 4] MENSTRUAL TRACKING")
        try:
            model = MenstrualTrackingModel()
            df = fetch_data(source, 'menstrual')
            model.train(df)
            model.save()
            print(f"   Done: Menstrual Tracking Model processed.")
        except Exception as e:
            print(f"   Error in Menstrual step: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Jali ML Pillars Runner')
    parser.add_argument('--source', type=str, default='local', choices=['local', 'snowflake'],
                        help='Data source: local CSV or Snowflake table')
    parser.add_argument('--models', type=str, default='all', 
                        help='Pillar to run: all, hiv, tb, immunization, or menstrual')
    
    args = parser.parse_args()
    run_pipeline(source=args.source, models_to_run=args.models)
