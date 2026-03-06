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
    print("RELOADING RAW DATA with EXPERT column mapping...")
    
    # 1. HIV Adherence (Mapping from 98-column CSV to 6-column table)
    # Col 1: included_cases, 3: ukvsusa, 6: age_years, 7: gender, 31: marstotal, 80: phq_total_af
    print(" - Mapping and Loading HIV Adherence...")
    cursor.execute("TRUNCATE TABLE RAW.HIV_ADHERENCE_DATASET")
    cursor.execute("""
        COPY INTO RAW.HIV_ADHERENCE_DATASET (INCLUDED_CASES, UKVSUSA, AGE_YEARS, GENDER, MARSTOTAL, PHQ_TOTAL_AF)
        FROM (SELECT $1, $3, $6, $7, $31, $80 FROM @RAW.JALI_CSV_STAGE/RAW.HIV_ADHERENCE_DATASET/)
        FILE_FORMAT = (FORMAT_NAME=RAW.CSV_FORMAT)
        ON_ERROR = 'CONTINUE'
    """)

    # 2. CRT Dataset (Mapping 32-column CSV to 32-column table)
    # The original Jali.sql had this right but let's confirm load
    print(" - Reloading CRT dataset...")
    cursor.execute("TRUNCATE TABLE RAW.CRT_DATASET")
    cursor.execute("""
        COPY INTO RAW.CRT_DATASET FROM @RAW.JALI_CSV_STAGE/RAW.CRT_DATASET/
        FILE_FORMAT = (FORMAT_NAME=RAW.CSV_FORMAT)
        ON_ERROR = 'CONTINUE'
    """)

    # 3. FedCycleData (Mapping 11-column CSV to 11-column table)
    print(" - Reloading FedCycle data...")
    cursor.execute("TRUNCATE TABLE RAW.FEDCYCLEDATA")
    cursor.execute("""
        COPY INTO RAW.FEDCYCLEDATA FROM @RAW.JALI_CSV_STAGE/RAW.FEDCYCLEDATA/
        FILE_FORMAT = (FORMAT_NAME=RAW.CSV_FORMAT)
        ON_ERROR = 'CONTINUE'
    """)

    # 4. Re-run Feature Store population to apply the corrected RAW mapping
    print("\nRepopulating Feature Stores...")
    cursor.execute("TRUNCATE TABLE FEATURES.UNIFIED_ADHERENCE_STORE")
    cursor.execute("TRUNCATE TABLE FEATURES.FERTILITY_STORE")

    # TB
    cursor.execute("INSERT INTO FEATURES.UNIFIED_ADHERENCE_STORE (DISEASE_TYPE, PATIENT_ID, GENDER, AGE_GROUP, ADHERENCE_SCORE, BARRIERS_SCORE) SELECT 'TB', STUDYNUMBER::VARCHAR, CASE WHEN GENDER = 1 THEN 'M' ELSE 'F' END, CASE WHEN AGECAT_CALC = 1 THEN '18-24' ELSE 'Other' END, PILLCOUNT, MONITORPROBLEM FROM RAW.CRT_DATASET")
    
    # HIV (Now with hundreds of more rows expected!)
    cursor.execute("INSERT INTO FEATURES.UNIFIED_ADHERENCE_STORE (DISEASE_TYPE, PATIENT_ID, GENDER, AGE_GROUP, ADHERENCE_SCORE, BARRIERS_SCORE) SELECT 'HIV', INCLUDED_CASES, GENDER, CASE WHEN AGE_YEARS < 25 THEN 'Youth' ELSE 'Adult' END, PHQ_TOTAL_AF, MARSTOTAL FROM RAW.HIV_ADHERENCE_DATASET WHERE PHQ_TOTAL_AF IS NOT NULL")
    
    # Immunization (OVC)
    cursor.execute("""
        INSERT INTO FEATURES.UNIFIED_ADHERENCE_STORE 
            (DISEASE_TYPE, PATIENT_ID, GENDER, AGE_GROUP, ADHERENCE_SCORE, BARRIERS_SCORE, 
             METADATA_JSON)
        SELECT 
            'OVC_LIVE', 
            ovc_id, 
            'UNKNOWN', 
            'OVC', 
            CASE WHEN suppression_status = 'Suppressed' THEN 1.0 ELSE 0.0 END,
            NULL,
            OBJECT_CONSTRUCT(
                'art_status', COALESCE(art_status, 'Unknown'),
                'eligibility', COALESCE(eligibility, 'Unknown'),
                'immunization_status', COALESCE(immunization_status, 'Unknown'),
                'chv_id', COALESCE(chv_id, 'Unknown')
            )
        FROM RAW.POSTGRES_OVC_CASES
    """)
    
    # Menstrual
    cursor.execute("INSERT INTO FEATURES.FERTILITY_STORE (CLIENTID, AGE, BMI, CYCLE_LENGTH, HAS_PEAK_OVULATION, IS_REGULAR_CYCLE) SELECT CLIENTID, AGE, BMI, LENGTHOFCYCLE, CYCLEWITHPEAKORNOT, CASE WHEN LENGTHOFCYCLE BETWEEN 21 AND 35 THEN 1 ELSE 0 END FROM RAW.FEDCYCLEDATA")

    print("\n[SUCCESS] Raw Data and Feature Stores Repopulated correctly!")

finally:
    conn.close()
