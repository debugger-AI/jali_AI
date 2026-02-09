"""
Data Import Script for CHW Registration System
Loads county_data.json and Tumikia Data.xlsx into PostgreSQL database
"""

import json
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
import os

# Database connection settings
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'tumikia_jamii',
    'user': 'postgres',
    'password': 'your_password_here'  # Update this
}

# File paths
COUNTY_DATA_PATH = r'C:\Users\jerem\OneDrive\Desktop\Jali\county_data.json'
TUMIKIA_DATA_PATH = r'C:\Users\jerem\OneDrive\Desktop\Jali\Tumikia Data.xlsx'


def get_connection():
    """Create database connection"""
    return psycopg2.connect(**DB_CONFIG)


def load_county_data(conn):
    """Load counties, constituencies, and wards from JSON file"""
    print("Loading county data from JSON...")
    
    with open(COUNTY_DATA_PATH, 'r', encoding='utf-8') as f:
        county_data = json.load(f)
    
    cursor = conn.cursor()
    
    counties_inserted = 0
    constituencies_inserted = 0
    wards_inserted = 0
    
    for county in county_data:
        county_name = county['name']
        
        # Insert county
        cursor.execute("""
            INSERT INTO counties (county_name) 
            VALUES (%s) 
            ON CONFLICT (county_name) DO UPDATE SET county_name = EXCLUDED.county_name
            RETURNING county_id
        """, (county_name,))
        county_id = cursor.fetchone()[0]
        counties_inserted += 1
        
        # Process constituencies
        for constituency in county.get('constituencies', []):
            constituency_name = constituency['name']
            
            cursor.execute("""
                INSERT INTO constituencies (constituency_name, county_id) 
                VALUES (%s, %s) 
                ON CONFLICT (constituency_name, county_id) DO UPDATE 
                SET constituency_name = EXCLUDED.constituency_name
                RETURNING constituency_id
            """, (constituency_name, county_id))
            constituency_id = cursor.fetchone()[0]
            constituencies_inserted += 1
            
            # Process wards
            for ward in constituency.get('wards', []):
                ward_name = ward['name']
                
                cursor.execute("""
                    INSERT INTO wards (ward_name, constituency_id) 
                    VALUES (%s, %s) 
                    ON CONFLICT (ward_name, constituency_id) DO UPDATE 
                    SET ward_name = EXCLUDED.ward_name
                    RETURNING ward_id
                """, (ward_name, constituency_id))
                wards_inserted += 1
    
    conn.commit()
    print(f"✓ Loaded {counties_inserted} counties, {constituencies_inserted} constituencies, {wards_inserted} wards")
    return True


def get_or_create_ward(cursor, ward_name, ward_id_from_data, constituency_name, county_name):
    """Get or create ward by name and return ward_id"""
    if ward_id_from_data and pd.notna(ward_id_from_data):
        # Check if ward exists with this ID
        cursor.execute("SELECT ward_id FROM wards WHERE ward_id = %s", (int(ward_id_from_data),))
        result = cursor.fetchone()
        if result:
            return result[0]
    
    if ward_name and pd.notna(ward_name):
        # Try to find by name
        cursor.execute("""
            SELECT w.ward_id FROM wards w
            JOIN constituencies c ON w.constituency_id = c.constituency_id
            JOIN counties co ON c.county_id = co.county_id
            WHERE LOWER(w.ward_name) = LOWER(%s)
            LIMIT 1
        """, (str(ward_name),))
        result = cursor.fetchone()
        if result:
            return result[0]
    
    return None


def get_or_create_cbo(cursor, cbo_id, cbo_name, ward_id):
    """Get or create CBO and return cbo_id"""
    if cbo_id and pd.notna(cbo_id):
        cursor.execute("SELECT cbo_id FROM cbos WHERE cbo_id = %s", (int(cbo_id),))
        result = cursor.fetchone()
        if result:
            return result[0]
    
    if cbo_name and pd.notna(cbo_name):
        cursor.execute("""
            INSERT INTO cbos (cbo_name, ward_id) 
            VALUES (%s, %s) 
            ON CONFLICT DO NOTHING
            RETURNING cbo_id
        """, (str(cbo_name), ward_id))
        result = cursor.fetchone()
        if result:
            return result[0]
        
        # If insert didn't return (due to conflict), fetch
        cursor.execute("SELECT cbo_id FROM cbos WHERE cbo_name = %s LIMIT 1", (str(cbo_name),))
        result = cursor.fetchone()
        if result:
            return result[0]
    
    return None


def get_or_create_chv(cursor, chv_id, chv_names, ward_id, cbo_id):
    """Get or create CHV and return chv_id"""
    if chv_id and pd.notna(chv_id):
        cursor.execute("SELECT chv_id FROM chv_users WHERE chv_id = %s", (int(chv_id),))
        result = cursor.fetchone()
        if result:
            return result[0]
    
    if chv_names and pd.notna(chv_names):
        cursor.execute("""
            INSERT INTO chv_users (chv_names, ward_id, cbo_id) 
            VALUES (%s, %s, %s) 
            ON CONFLICT DO NOTHING
            RETURNING chv_id
        """, (str(chv_names), ward_id, cbo_id))
        result = cursor.fetchone()
        if result:
            return result[0]
        
        cursor.execute("SELECT chv_id FROM chv_users WHERE chv_names = %s LIMIT 1", (str(chv_names),))
        result = cursor.fetchone()
        if result:
            return result[0]
    
    return None


def get_or_create_facility(cursor, facility_id, facility_name, facility_mfl_code, ward_id):
    """Get or create health facility and return facility_id"""
    if facility_id and pd.notna(facility_id):
        cursor.execute("SELECT facility_id FROM health_facilities WHERE facility_id = %s", (int(facility_id),))
        result = cursor.fetchone()
        if result:
            return result[0]
    
    if facility_name and pd.notna(facility_name):
        mfl_code = str(facility_mfl_code) if pd.notna(facility_mfl_code) else None
        cursor.execute("""
            INSERT INTO health_facilities (facility_name, facility_mfl_code, ward_id) 
            VALUES (%s, %s, %s) 
            ON CONFLICT (facility_mfl_code) DO UPDATE SET facility_name = EXCLUDED.facility_name
            RETURNING facility_id
        """, (str(facility_name), mfl_code, ward_id))
        result = cursor.fetchone()
        if result:
            return result[0]
    
    return None


def get_or_create_school(cursor, school_id, school_name, ward_id):
    """Get or create school and return school_id"""
    if school_id and pd.notna(school_id):
        cursor.execute("SELECT school_id FROM schools WHERE school_id = %s", (int(school_id),))
        result = cursor.fetchone()
        if result:
            return result[0]
    
    if school_name and pd.notna(school_name):
        cursor.execute("""
            INSERT INTO schools (school_name, ward_id) 
            VALUES (%s, %s) 
            ON CONFLICT DO NOTHING
            RETURNING school_id
        """, (str(school_name), ward_id))
        result = cursor.fetchone()
        if result:
            return result[0]
        
        cursor.execute("SELECT school_id FROM schools WHERE school_name = %s LIMIT 1", (str(school_name),))
        result = cursor.fetchone()
        if result:
            return result[0]
    
    return None


def get_or_create_caregiver(cursor, row, ward_id):
    """Get or create caregiver and return caregiver_id"""
    caregiver_id = row.get('caregiver_id')
    caregiver_names = row.get('caregiver_names')
    
    if caregiver_id and pd.notna(caregiver_id):
        cursor.execute("SELECT caregiver_id FROM caregivers WHERE caregiver_id = %s", (int(caregiver_id),))
        result = cursor.fetchone()
        if result:
            return result[0]
    
    if caregiver_names and pd.notna(caregiver_names):
        phone = str(row.get('phone')) if pd.notna(row.get('phone')) else None
        national_id = str(row.get('caregiver_nationalid')) if pd.notna(row.get('caregiver_nationalid')) else None
        hiv_status = str(row.get('caregiverhivstatus')) if pd.notna(row.get('caregiverhivstatus')) else 'Unknown'
        gender = str(row.get('caregiver_gender')) if pd.notna(row.get('caregiver_gender')) else None
        caregiver_type = str(row.get('caregiver_type')) if pd.notna(row.get('caregiver_type')) else None
        
        # Parse DOB
        caregiver_dob = None
        if pd.notna(row.get('caregiver_dob')):
            try:
                caregiver_dob = pd.to_datetime(row.get('caregiver_dob')).date()
            except:
                pass
        
        caregiver_age = int(row.get('caregiver_age')) if pd.notna(row.get('caregiver_age')) else None
        
        # Normalize HIV status
        if hiv_status not in ['Positive', 'Negative', 'Unknown', 'Declined to Disclose']:
            hiv_status = 'Unknown'
        
        # Normalize gender
        if gender and gender not in ['Male', 'Female', 'Other']:
            gender = 'Other' if gender else None
        
        cursor.execute("""
            INSERT INTO caregivers (
                caregiver_names, caregiver_dob, caregiver_age, caregiver_gender,
                caregiver_national_id, phone, caregiver_hiv_status, caregiver_type, ward_id
            ) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) 
            ON CONFLICT DO NOTHING
            RETURNING caregiver_id
        """, (
            str(caregiver_names), caregiver_dob, caregiver_age, gender,
            national_id, phone, hiv_status, caregiver_type, ward_id
        ))
        result = cursor.fetchone()
        if result:
            return result[0]
        
        # If conflict, try to find existing
        if phone:
            cursor.execute("SELECT caregiver_id FROM caregivers WHERE phone = %s LIMIT 1", (phone,))
            result = cursor.fetchone()
            if result:
                return result[0]
    
    return None


def parse_date(value):
    """Parse various date formats"""
    if pd.isna(value):
        return None
    try:
        return pd.to_datetime(value).date()
    except:
        return None


def normalize_hiv_status(status):
    """Normalize HIV status values"""
    if pd.isna(status):
        return 'Unknown'
    status_str = str(status).strip().lower()
    if status_str in ['positive', 'pos', '+', 'hiv+', 'hiv positive']:
        return 'Positive'
    elif status_str in ['negative', 'neg', '-', 'hiv-', 'hiv negative']:
        return 'Negative'
    elif status_str in ['exposed', 'hei', 'hiv exposed']:
        return 'Exposed'
    elif status_str in ['declined', 'declined to disclose', 'not disclosed']:
        return 'Declined to Disclose'
    return 'Unknown'


def normalize_gender(gender):
    """Normalize gender values"""
    if pd.isna(gender):
        return None
    gender_str = str(gender).strip().lower()
    if gender_str in ['male', 'm', 'boy']:
        return 'Male'
    elif gender_str in ['female', 'f', 'girl']:
        return 'Female'
    return 'Other'


def normalize_school_level(level):
    """Normalize school level values"""
    if pd.isna(level):
        return None
    level_str = str(level).strip().lower()
    if 'pre' in level_str or 'ecd' in level_str or 'nursery' in level_str:
        return 'Pre-Primary'
    elif 'lower' in level_str or ('primary' in level_str and ('1' in level_str or '2' in level_str or '3' in level_str)):
        return 'Lower Primary'
    elif 'upper' in level_str or ('primary' in level_str and ('4' in level_str or '5' in level_str or '6' in level_str)):
        return 'Upper Primary'
    elif 'junior' in level_str or 'jss' in level_str:
        return 'Junior Secondary'
    elif 'senior' in level_str or 'sss' in level_str or 'secondary' in level_str:
        return 'Senior Secondary'
    elif 'tertiary' in level_str or 'college' in level_str or 'university' in level_str:
        return 'Tertiary'
    elif 'not in school' in level_str or 'none' in level_str or 'out' in level_str:
        return 'Not in School'
    elif 'primary' in level_str:
        return 'Lower Primary'
    return 'Not Applicable'


def load_tumikia_data(conn):
    """Load Tumikia Data from Excel file"""
    print("Loading Tumikia Data from Excel...")
    
    df = pd.read_excel(TUMIKIA_DATA_PATH)
    print(f"  Found {len(df)} records to import")
    
    cursor = conn.cursor()
    
    imported = 0
    errors = 0
    
    for idx, row in df.iterrows():
        try:
            # Get or create related entities
            ward_id = get_or_create_ward(
                cursor, 
                row.get('ward'),
                row.get('ward_id'),
                row.get('constituency'),
                row.get('county')
            )
            
            cbo_id = get_or_create_cbo(cursor, row.get('cbo_id'), row.get('cbo'), ward_id)
            chv_id = get_or_create_chv(cursor, row.get('chv_id'), row.get('chv_names'), ward_id, cbo_id)
            facility_id = get_or_create_facility(
                cursor, 
                row.get('facility_id'),
                row.get('facility'),
                row.get('facility_mfl_code'),
                ward_id
            )
            school_id = get_or_create_school(cursor, row.get('school_id'), row.get('school_name'), ward_id)
            caregiver_id = get_or_create_caregiver(cursor, row, ward_id)
            
            # Parse dates
            date_of_birth = parse_date(row.get('date_of_birth'))
            date_of_linkage = parse_date(row.get('date_of_linkage'))
            date_of_event = parse_date(row.get('date_of_event'))
            registration_date = parse_date(row.get('registration_date')) or datetime.now().date()
            exit_date = parse_date(row.get('exit_date'))
            
            # Normalize values
            gender = normalize_gender(row.get('gender'))
            ovc_hiv_status = normalize_hiv_status(row.get('ovchivstatus'))
            school_level = normalize_school_level(row.get('schoollevel'))
            
            # Get integer values safely
            def safe_int(val):
                if pd.isna(val):
                    return None
                try:
                    return int(val)
                except:
                    return None
            
            age = safe_int(row.get('age'))
            age_at_reg = safe_int(row.get('age_at_reg'))
            duration_on_art = safe_int(row.get('duration_on_art'))
            duration_in_program = safe_int(row.get('duration_in_program'))
            
            # Get string values safely
            def safe_str(val):
                if pd.isna(val):
                    return None
                return str(val).strip()
            
            # Insert OVC record
            cursor.execute("""
                INSERT INTO ovc_registration (
                    ovc_names, gender, dob, date_of_birth, age, age_at_reg, age_range,
                    birth_cert, birth_cert_number, ovc_disability, ncpwd_number,
                    ovc_hiv_status, art_status, facility_id, date_of_linkage, ccc_number,
                    duration_on_art, viral_load, date_of_event, suppression,
                    ward_id, household, cbo_id, chv_id, caregiver_id, caregiver_relation,
                    father_alive, mother_alive, school_level, school_id, class_grade,
                    registration_date, duration_in_program, immunization, eligibility,
                    exit_status, exit_date, exit_reason
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s
                )
            """, (
                safe_str(row.get('ovc_names')),
                gender,
                safe_str(row.get('dob')),
                date_of_birth,
                age,
                age_at_reg,
                safe_str(row.get('agerange')),
                row.get('birthcert') == True or str(row.get('birthcert')).lower() == 'yes',
                safe_str(row.get('bcertnumber')),
                safe_str(row.get('ovcdisability')),
                safe_str(row.get('ncpwdnumber')),
                ovc_hiv_status,
                safe_str(row.get('artstatus')),
                facility_id,
                date_of_linkage,
                safe_str(row.get('ccc_number')),
                duration_on_art,
                safe_str(row.get('viral_load')),
                date_of_event,
                safe_str(row.get('suppression')),
                ward_id,
                safe_str(row.get('household')),
                cbo_id,
                chv_id,
                caregiver_id,
                safe_str(row.get('caregiver_relation')),
                safe_str(row.get('father_alive')),
                safe_str(row.get('mother_alive')),
                school_level,
                school_id,
                safe_str(row.get('class')),
                registration_date,
                duration_in_program,
                safe_str(row.get('immunization')),
                safe_str(row.get('eligibility')),
                safe_str(row.get('exit_status')),
                exit_date,
                safe_str(row.get('exit_reason'))
            ))
            
            imported += 1
            
            if imported % 1000 == 0:
                conn.commit()
                print(f"  Imported {imported} records...")
                
        except Exception as e:
            errors += 1
            if errors <= 10:
                print(f"  Error on row {idx}: {str(e)[:100]}")
    
    conn.commit()
    print(f"✓ Imported {imported} OVC records ({errors} errors)")
    return True


def main():
    """Main import function"""
    print("=" * 60)
    print("CHW Registration System - Data Import")
    print("=" * 60)
    
    # Check if files exist
    if not os.path.exists(COUNTY_DATA_PATH):
        print(f"ERROR: County data file not found: {COUNTY_DATA_PATH}")
        return
    
    if not os.path.exists(TUMIKIA_DATA_PATH):
        print(f"ERROR: Tumikia data file not found: {TUMIKIA_DATA_PATH}")
        return
    
    try:
        conn = get_connection()
        print("✓ Connected to PostgreSQL database")
        
        # Load county data first (for ward references)
        load_county_data(conn)
        
        # Load Tumikia data
        load_tumikia_data(conn)
        
        # Print summary
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM counties")
        print(f"\nSummary:")
        print(f"  Counties: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM constituencies")
        print(f"  Constituencies: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM wards")
        print(f"  Wards: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM cbos")
        print(f"  CBOs: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM chv_users")
        print(f"  CHV Users: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM caregivers")
        print(f"  Caregivers: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM ovc_registration")
        print(f"  OVC Registrations: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM health_facilities")
        print(f"  Health Facilities: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM schools")
        print(f"  Schools: {cursor.fetchone()[0]}")
        
        conn.close()
        print("\n✓ Import completed successfully!")
        
    except psycopg2.OperationalError as e:
        print(f"ERROR: Could not connect to database: {e}")
        print("\nMake sure PostgreSQL is running and update DB_CONFIG with your credentials.")
        print("Then run the schema.sql file first to create the tables.")
    except Exception as e:
        print(f"ERROR: {e}")
        raise


if __name__ == "__main__":
    main()
