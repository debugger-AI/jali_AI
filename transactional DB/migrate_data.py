import pandas as pd
import psycopg2
from psycopg2 import sql
import os
import math
from datetime import datetime

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "Jali DB")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "Twenty@20")
DB_PORT = os.getenv("DB_PORT", "5432")

FILE_PATH = 'Tumikia Data.csv'

def clean_value(val):
    if pd.isna(val) or str(val).lower() == 'nan' or str(val).strip() == '':
        return None
    if isinstance(val, (int, float)):
        return val
    return str(val).strip()

def clean_date(val):
    if pd.isna(val) or str(val).lower() == 'nan' or str(val).strip() == '':
        return None
    try:
        return pd.to_datetime(val).date()
    except:
        return None

def ensure_database():
    """Connects to default 'postgres' db to ensure 'jali_oltp' exists"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT,
            database='postgres'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check if DB exists
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (DB_NAME,))
        exists = cur.fetchone()
        
        if not exists:
            print(f"Database '{DB_NAME}' does not exist. Creating it...")
            cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(DB_NAME)))
            print(f"Database '{DB_NAME}' created.")
        else:
            print(f"Database '{DB_NAME}' already exists.")
            
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Warning: Could not check/create database: {e}")
        return False

def migrate():
    print("--- Jali Data Migration (PostgreSQL) ---")
    
    # Try to ensure DB exists first
    ensure_database()
    
    print(f"Connecting to database '{DB_NAME}'...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        cur = conn.cursor()
        print("Connected.")
    except Exception as e:
        print(f"Connection Failed: {e}")
        print("\nTIP: Make sure your PostgreSQL server is running and the user 'postgres' has password 'password'.")
        print("You can modify the script or set environment variables to change credentials.")
        return

    # 1. Apply Schema
    print("Applying schema.sql...")
    try:
        with open('schema.sql', 'r') as f:
            schema = f.read()
            cur.execute(schema)
            conn.commit()
    except Exception as e:
        print(f"Schema Error: {e}")
        conn.rollback()
        return

    # 2. Read CSV
    if not os.path.exists(FILE_PATH):
        print(f"Error: {FILE_PATH} not found in current directory.")
        return
        
    print(f"Reading {FILE_PATH}...")
    df = pd.read_csv(FILE_PATH, low_memory=False)
    print(f"Loaded {len(df)} rows.")

    # 3. Load Dimensions
    print("Loading organizations...")
    cbos = df[['cbo_id', 'cbo']].dropna(subset=['cbo_id']).drop_duplicates('cbo_id')
    for _, row in cbos.iterrows():
        cur.execute("INSERT INTO cbos (cbo_id, cbo_name) VALUES (%s, %s) ON CONFLICT (cbo_id) DO NOTHING", 
                    (clean_value(row['cbo_id']), clean_value(row['cbo'])))

    print("Loading CHVs/CHWs...")
    chvs = df[['chv_id', 'chv_names']].dropna(subset=['chv_id']).drop_duplicates('chv_id')
    for _, row in chvs.iterrows():
        cur.execute("INSERT INTO chvs (chv_id, chv_name) VALUES (%s, %s) ON CONFLICT (chv_id) DO NOTHING", 
                    (clean_value(row['chv_id']), clean_value(row['chv_names'])))

    print("Loading Households & Locations...")
    households = df[[
        'household', 'chv_id', 'cbo_id', 'ward_id', 'ward', 
        'consituency_id', 'constituency', 'countyid', 'county'
    ]].dropna(subset=['household']).drop_duplicates('household')
    
    for _, row in households.iterrows():
        cur.execute("""
            INSERT INTO households (
                household_id, chv_id, cbo_id, ward_id, ward_name, 
                constituency_id, constituency_name, county_id, county_name
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) 
            ON CONFLICT (household_id) DO NOTHING
        """, (
            clean_value(row['household']), clean_value(row['chv_id']), clean_value(row['cbo_id']),
            clean_value(row['ward_id']), clean_value(row['ward']),
            clean_value(row['consituency_id']), clean_value(row['constituency']),
            clean_value(row['countyid']), clean_value(row['county'])
        ))

    print("Loading Caregivers...")
    caregivers = df[[
        'caregiver_id', 'household', 'caregiver_names', 'caregiver_nationalid', 
        'phone', 'caregiver_gender', 'caregiver_dob', 'caregiverhivstatus',
        'caregiver_type', 'father_alive', 'mother_alive'
    ]].dropna(subset=['caregiver_id']).drop_duplicates('caregiver_id')
    
    for _, row in caregivers.iterrows():
        cur.execute("""
            INSERT INTO caregivers (
                caregiver_id, household_id, caregiver_name, national_id, phone, 
                gender, dob, hiv_status, caregiver_type, father_alive, mother_alive
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
            ON CONFLICT (caregiver_id) DO NOTHING
        """, (
            clean_value(row['caregiver_id']), clean_value(row['household']),
            clean_value(row['caregiver_names']), clean_value(row['caregiver_nationalid']),
            clean_value(row['phone']), clean_value(row['caregiver_gender']),
            clean_date(row['caregiver_dob']), clean_value(row['caregiverhivstatus']),
            clean_value(row['caregiver_type']), clean_value(row['father_alive']),
            clean_value(row['mother_alive'])
        ))

    print("Loading OVCs...")
    ovcs = df[[
        'ovc_id', 'household', 'ovc_names', 'gender', 'dob', 
        'bcertnumber', 'ncpwdnumber', 'ovcdisability', 'ovchivstatus'
    ]].dropna(subset=['ovc_id']).drop_duplicates('ovc_id')
    
    for _, row in ovcs.iterrows():
        cur.execute("""
            INSERT INTO ovcs (
                ovc_id, household_id, ovc_name, gender, dob, 
                birth_cert_no, ncpwd_no, disability_status, hiv_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) 
            ON CONFLICT (ovc_id) DO NOTHING
        """, (
            clean_value(row['ovc_id']), clean_value(row['household']),
            clean_value(row['ovc_names']), clean_value(row['gender']),
            clean_date(row['dob']), clean_value(row['bcertnumber']),
            clean_value(row['ncpwdnumber']), clean_value(row['ovcdisability']),
            clean_value(row['ovchivstatus'])
        ))

    print("Loading Facilities & Schools...")
    facilities = df[['facility_id', 'facility', 'facility_mfl_code']].dropna(subset=['facility_id']).drop_duplicates('facility_id')
    for _, row in facilities.iterrows():
        cur.execute("INSERT INTO facilities (facility_id, facility_name, mfl_code) VALUES (%s, %s, %s) ON CONFLICT (facility_id) DO NOTHING",
                   (clean_value(row['facility_id']), clean_value(row['facility']), clean_value(row['facility_mfl_code'])))
                   
    schools = df[['school_id', 'school_name', 'schoollevel']].dropna(subset=['school_id']).drop_duplicates('school_id')
    for _, row in schools.iterrows():
        cur.execute("INSERT INTO schools (school_id, school_name, school_level) VALUES (%s, %s, %s) ON CONFLICT (school_id) DO NOTHING",
                   (clean_value(row['school_id']), clean_value(row['school_name']), clean_value(row['schoollevel'])))

    # 4. Final Load
    print("Loading Process Tracking Events...")
    case_count = 0
    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO ovc_cases (
                ovc_id, caregiver_id, chv_id, facility_id, school_id,
                date_of_event, date_of_linkage, registration_date, exit_date,
                art_status, ccc_number, duration_on_art, viral_load, 
                suppression_status, immunization_status, eligibility,
                exit_status, exit_reason
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            clean_value(row['ovc_id']), clean_value(row['caregiver_id']), clean_value(row['chv_id']),
            clean_value(row['facility_id']), clean_value(row['school_id']),
            clean_date(row['date_of_event']), clean_date(row['date_of_linkage']),
            clean_date(row['registration_date']), clean_date(row['exit_date']),
            clean_value(row['artstatus']), clean_value(row['ccc_number']),
            clean_value(row['duration_on_art']), clean_value(row['viral_load']),
            clean_value(row['suppression']), clean_value(row['immunization']),
            clean_value(row['eligibility']), clean_value(row['exit_status']),
            clean_value(row['exit_reason'])
        ))
        case_count += 1
        if case_count % 2000 == 0:
            print(f"Progress: {case_count} rows loaded...")
            conn.commit()

    conn.commit()
    print(f"--- Migration Successful! ---")
    print(f"Final Count: {case_count} events stored.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    migrate()
