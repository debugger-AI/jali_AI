import pandas as pd
import psycopg2
from psycopg2 import sql
import os
import math
import numpy as np
from datetime import datetime

# Database Configuration - UPDATE THESE or use .env
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "jali_oltp")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "password")
DB_PORT = os.getenv("DB_PORT", "5432")

FILE_PATH = 'Tumikia Data.xlsx'

def clean_value(val):
    """Handle NaN and cleanup values for SQL"""
    if pd.isna(val) or val == 'nan':
        return None
    if isinstance(val, (int, float)):
        return val
    return str(val).strip()

def clean_date(val):
    """Handle date parsing safe"""
    if pd.isna(val) or val == '' or str(val).lower() == 'nan':
        return None
    try:
        if isinstance(val, str):
            # Attempt generic parse if string
            return pd.to_datetime(val).date()
        return val.date() if hasattr(val, 'date') else val
    except:
        return None

def migrate():
    print("Connecting to Database...")
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
        print("Please check your database credentials in the script or .env")
        return

    # Run Schema
    print("Applying Schema...")
    try:
        with open('schema.sql', 'r') as f:
            schema = f.read()
            cur.execute(schema)
            conn.commit()
    except Exception as e:
        print(f"Schema Error: {e}")
        conn.rollback()
        return

    print("Reading Excel Data... (This may take a moment)")
    # Read in chunks if file is huge, but 13MB is fine for memory
    df = pd.read_excel(FILE_PATH, sheet_name='Sheet1')
    
    total_rows = len(df)
    print(f"Processing {total_rows} rows...")
    
    # helper for upserting dimensions
    def insert_dim(table, id_col, name_col, id_val, name_val, extra_cols={}):
        if not id_val:
            return
        
        cols = [id_col, name_col] + list(extra_cols.keys())
        vals = [id_val, name_val] + list(extra_cols.values())
        
        placeholders = ', '.join(['%s'] * len(cols))
        columns = ', '.join(cols)
        
        stmt = sql.SQL("INSERT INTO {} ({}) VALUES ({}) ON CONFLICT ({}) DO NOTHING").format(
            sql.Identifier(table),
            sql.SQL(columns),
            sql.SQL(placeholders),
            sql.Identifier(id_col)
        )
        cur.execute(stmt, vals)

    # Process Rows
    count = 0
    for index, row in df.iterrows():
        # Clean IDs
        cbo_id = clean_value(row.get('cbo_id'))
        chv_id = clean_value(row.get('chv_id'))
        facility_id = clean_value(row.get('facility_id'))
        school_id = clean_value(row.get('school_id'))
        caregiver_id = clean_value(row.get('caregiver_id'))
        ovc_id = clean_value(row.get('ovc_id'))
        
        # 1. Insert Dimensions
        if cbo_id:
            insert_dim('cbos', 'cbo_id', 'cbo_name', cbo_id, clean_value(row.get('cbo')))
            
        if chv_id:
            insert_dim('chvs', 'chv_id', 'chv_name', chv_id, clean_value(row.get('chv_names')))
            
        if facility_id:
            insert_dim('facilities', 'facility_id', 'facility_name', 
                      facility_id, clean_value(row.get('facility')), 
                      {'mfl_code': clean_value(row.get('facility_mfl_code'))})
            
        if school_id:
            insert_dim('schools', 'school_id', 'school_name', 
                      school_id, clean_value(row.get('school_name')),
                      {'school_level': clean_value(row.get('schoollevel'))})
                      
        if caregiver_id:
            # Full caregiver insert
            cg_vals = {
                'caregiver_id': caregiver_id,
                'caregiver_name': clean_value(row.get('caregiver_names')),
                'national_id': clean_value(row.get('caregiver_nationalid')),
                'phone': clean_value(row.get('phone')),
                'gender': clean_value(row.get('caregiver_gender')),
                'dob': clean_date(row.get('caregiver_dob')),
                'hiv_status': clean_value(row.get('caregiverhivstatus')),
                'household_info': clean_value(row.get('household')),
                'caregiver_type': clean_value(row.get('caregiver_type')),
                'father_alive': clean_value(row.get('father_alive')),
                'mother_alive': clean_value(row.get('mother_alive'))
            }
            # Construct insert specifically for caregiver
            cols = list(cg_vals.keys())
            placeholders = ', '.join(['%s'] * len(cols))
            stmt = sql.SQL("INSERT INTO caregivers ({}) VALUES ({}) ON CONFLICT (caregiver_id) DO NOTHING").format(
                sql.SQL(', '.join(cols)), sql.SQL(placeholders)
            )
            cur.execute(stmt, list(cg_vals.values()))

        if ovc_id:
            # OVC Insert
            ovc_vals = {
                'ovc_id': ovc_id,
                'ovc_name': clean_value(row.get('ovc_names')),
                'gender': clean_value(row.get('gender')),
                'dob': clean_date(row.get('dob')),
                'birth_cert_no': clean_value(row.get('bcertnumber')),
                'ncpwd_no': clean_value(row.get('ncpwdnumber')),
                'disability_status': clean_value(row.get('ovcdisability')),
                'hiv_status': clean_value(row.get('ovchivstatus'))
            }
            cols = list(ovc_vals.keys())
            placeholders = ', '.join(['%s'] * len(cols))
            stmt = sql.SQL("INSERT INTO ovcs ({}) VALUES ({}) ON CONFLICT (ovc_id) DO NOTHING").format(
                sql.SQL(', '.join(cols)), sql.SQL(placeholders)
            )
            cur.execute(stmt, list(ovc_vals.values()))
            
        # 2. Insert Case/Event
        case_vals = {
            'ovc_id': ovc_id,
            'caregiver_id': caregiver_id,
            'chv_id': chv_id,
            'cbo_id': cbo_id,
            'facility_id': facility_id,
            'school_id': school_id,
            
            'ward_id': clean_value(row.get('ward_id')),
            'ward_name': clean_value(row.get('ward')),
            'constituency_id': clean_value(row.get('consituency_id')),
            'constituency_name': clean_value(row.get('constituency')),
            'county_id': clean_value(row.get('countyid')),
            'county_name': clean_value(row.get('county')),
            
            'date_of_event': clean_date(row.get('date_of_event')),
            'date_of_linkage': clean_date(row.get('date_of_linkage')),
            'registration_date': clean_date(row.get('registration_date')),
            'exit_date': clean_date(row.get('exit_date')),
            
            'art_status': clean_value(row.get('artstatus')),
            'ccc_number': clean_value(row.get('ccc_number')),
            'duration_on_art': clean_value(row.get('duration_on_art')),
            'viral_load': clean_value(row.get('viral_load')),
            'suppression_status': clean_value(row.get('suppression')),
            'immunization_status': clean_value(row.get('immunization')),
            'eligibility': clean_value(row.get('eligibility')),
            'exit_status': clean_value(row.get('exit_status')),
            'exit_reason': clean_value(row.get('exit_reason'))
        }
        
        cols = list(case_vals.keys())
        placeholders = ', '.join(['%s'] * len(cols))
        stmt = sql.SQL("INSERT INTO ovc_cases ({}) VALUES ({})").format(
            sql.SQL(', '.join(cols)), sql.SQL(placeholders)
        )
        cur.execute(stmt, list(case_vals.values()))
        
        count += 1
        if count % 1000 == 0:
            print(f"Processed {count} rows...")
            conn.commit()

    conn.commit()
    print("Migration Complete!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    migrate()
