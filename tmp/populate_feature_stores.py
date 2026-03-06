import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv('.env')

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
    print("Populating Feature Stores for all 4 Pillars...")

    # 1. Clear existing feature store data to ensure a fresh, consistent state
    print(" - Cleaning Feature Stores...")
    cursor.execute("TRUNCATE TABLE FEATURES.UNIFIED_ADHERENCE_STORE")
    cursor.execute("TRUNCATE TABLE FEATURES.FERTILITY_STORE")

    # 2. SEED: TB Adherence (from CRT_DATASET)
    print(" - Seeding TB Adherence features...")
    cursor.execute("""
        INSERT INTO FEATURES.UNIFIED_ADHERENCE_STORE (DISEASE_TYPE, PATIENT_ID, GENDER, AGE_GROUP, ADHERENCE_SCORE, BARRIERS_SCORE)
        SELECT 
            'TB', 
            STUDYNUMBER::VARCHAR, 
            CASE WHEN GENDER = 1 THEN 'M' ELSE 'F' END,
            CASE WHEN AGECAT_CALC = 1 THEN '18-24' ELSE 'Other' END,
            PILLCOUNT, 
            MONITORPROBLEM
        FROM RAW.CRT_DATASET
        WHERE PILLCOUNT IS NOT NULL
    """)

    # 3. SEED: HIV Adherence (from HIV_ADHERENCE_DATASET)
    print(" - Seeding HIV Adherence features...")
    cursor.execute("""
        INSERT INTO FEATURES.UNIFIED_ADHERENCE_STORE (DISEASE_TYPE, PATIENT_ID, GENDER, AGE_GROUP, ADHERENCE_SCORE, BARRIERS_SCORE)
        SELECT 
            'HIV', 
            INCLUDED_CASES, 
            GENDER,
            CASE WHEN AGE_YEARS < 25 THEN 'Youth' ELSE 'Adult' END,
            PHQ_TOTAL_AF, -- Using PHQ as a proxy for adherence risk score
            MARSTOTAL     -- Using MARS as barriers proxy
        FROM RAW.HIV_ADHERENCE_DATASET
        WHERE PHQ_TOTAL_AF IS NOT NULL
    """)

    # 4. SEED: Immunization (from RAW.POSTGRES_OVC_CASES)
    # Since we might not have CSV data for this, let's create some dummy OVC data if empty
    cursor.execute("SELECT COUNT(*) FROM RAW.POSTGRES_OVC_CASES")
    if cursor.fetchone()[0] == 0:
        print(" - Creating synthetic OVC data for Immunization Tracker...")
        cursor.execute("""
            INSERT INTO RAW.POSTGRES_OVC_CASES (case_id, ovc_id, suppression_status, created_at)
            VALUES 
                (1, 'OVC-101', 'Suppressed', CURRENT_TIMESTAMP()),
                (2, 'OVC-102', 'Not Suppressed', CURRENT_TIMESTAMP()),
                (3, 'OVC-103', 'Suppressed', CURRENT_TIMESTAMP()),
                (4, 'OVC-104', 'Suppressed', CURRENT_TIMESTAMP()),
                (5, 'OVC-105', 'Not Suppressed', CURRENT_TIMESTAMP()),
                (6, 'OVC-106', 'Suppressed', CURRENT_TIMESTAMP()),
                (7, 'OVC-107', 'Suppressed', CURRENT_TIMESTAMP()),
                (8, 'OVC-108', 'Suppressed', CURRENT_TIMESTAMP()),
                (9, 'OVC-109', 'Not Suppressed', CURRENT_TIMESTAMP()),
                (10, 'OVC-110', 'Suppressed', CURRENT_TIMESTAMP()),
                (11, 'OVC-111', 'Suppressed', CURRENT_TIMESTAMP()),
                (12, 'OVC-112', 'Not Suppressed', CURRENT_TIMESTAMP()),
                (13, 'OVC-113', 'Suppressed', CURRENT_TIMESTAMP()),
                (14, 'OVC-114', 'Suppressed', CURRENT_TIMESTAMP()),
                (15, 'OVC-115', 'Suppressed', CURRENT_TIMESTAMP()),
                (16, 'OVC-116', 'Not Suppressed', CURRENT_TIMESTAMP()),
                (17, 'OVC-117', 'Suppressed', CURRENT_TIMESTAMP()),
                (18, 'OVC-118', 'Suppressed', CURRENT_TIMESTAMP()),
                (19, 'OVC-119', 'Suppressed', CURRENT_TIMESTAMP()),
                (20, 'OVC-120', 'Suppressed', CURRENT_TIMESTAMP())
        """)

    print(" - Seeding Immunization Tracker features...")
    cursor.execute("""
        INSERT INTO FEATURES.UNIFIED_ADHERENCE_STORE (DISEASE_TYPE, PATIENT_ID, GENDER, AGE_GROUP, ADHERENCE_SCORE)
        SELECT 
            'OVC_LIVE', 
            ovc_id, 
            'UNKNOWN', 
            'OVC', 
            CASE WHEN suppression_status = 'Suppressed' THEN 1.0 ELSE 0.0 END
        FROM RAW.POSTGRES_OVC_CASES
    """)

    # 5. SEED: Menstrual (from FEDCYCLEDATA)
    print(" - Seeding Menstrual Tracking features...")
    cursor.execute("""
        INSERT INTO FEATURES.FERTILITY_STORE (CLIENTID, AGE, BMI, CYCLE_LENGTH, HAS_PEAK_OVULATION, IS_REGULAR_CYCLE)
        SELECT 
            CLIENTID, 
            AGE, 
            BMI, 
            LENGTHOFCYCLE, 
            CYCLEWITHPEAKORNOT,
            CASE WHEN LENGTHOFCYCLE BETWEEN 21 AND 35 THEN 1 ELSE 0 END
        FROM RAW.FEDCYCLEDATA
    """)

    print("\n[SUCCESS] Feature stores populated! Ready for High Value Training.")

finally:
    conn.close()
