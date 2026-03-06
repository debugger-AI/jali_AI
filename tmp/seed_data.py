import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv('.env')

# Mapping of file name to table name
SEED_FILES = {
    'CRT_dataset.csv': 'RAW.CRT_DATASET',
    'FedCycleData.csv': 'RAW.FEDCYCLEDATA',
    'QualityOfCare.csv': 'RAW.QUALITYOFCARE',
    'HIV_adherence_dataset.csv': 'RAW.HIV_ADHERENCE_DATASET',
    'immunization_schedule.csv': 'RAW.IMMUNIZATION_SCHEDULE'
}

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
    print("Seeding RAW tables from local CSV files...")
    
    for filename, table in SEED_FILES.items():
        filepath = os.path.abspath(filename)
        if not os.path.exists(filepath):
            print(f" - {filename} not found, skipping...")
            continue
            
        print(f" - Uploading {filename} to {table}...")
        # Put file to internal stage
        cursor.execute(f"PUT 'file://{filepath.replace('\\', '/')}' @RAW.JALI_CSV_STAGE/{table}/")
        
        # Copy from stage to table
        cursor.execute(f"COPY INTO {table} FROM @RAW.JALI_CSV_STAGE/{table}/ FILE_FORMAT=(FORMAT_NAME=RAW.CSV_FORMAT) ON_ERROR='CONTINUE'")
        print(f"   Done.")

    print("\nData seeding complete. Running Feature Engineering...")
    # Manually trigger the tasks or run the inserts once to populate FEATURE tables
    cursor.execute("INSERT INTO FEATURES.UNIFIED_ADHERENCE_STORE (DISEASE_TYPE, PATIENT_ID, GENDER, AGE_GROUP, ADHERENCE_SCORE, BARRIERS_SCORE) SELECT 'TB', STUDYNUMBER::VARCHAR, GENDER::VARCHAR, CASE WHEN AGECAT_CALC = 1 THEN '18-24' ELSE 'Other' END, PILLCOUNT, MONITORPROBLEM FROM RAW.CRT_DATASET")
    cursor.execute("INSERT INTO FEATURES.FERTILITY_STORE (CLIENTID, AGE, BMI, CYCLE_LENGTH, HAS_PEAK_OVULATION, IS_REGULAR_CYCLE) SELECT CLIENTID, AGE, BMI, LENGTHOFCYCLE, CYCLEWITHPEAKORNOT, CASE WHEN LENGTHOFCYCLE BETWEEN 21 AND 35 THEN 1 ELSE 0 END FROM RAW.FEDCYCLEDATA")
    
    print("Database ready for training.")

finally:
    conn.close()
