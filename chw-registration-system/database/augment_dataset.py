"""
Augmentation Script for Jali System
Imports data from auxiliary datasets into the health tracking modules
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os

# Database connection settings
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'tumikia_jamii',
    'user': 'postgres',
    'password': 'your_password_here'
}

# File paths
FED_CYCLE_DATA = r'C:\Users\jerem\OneDrive\Desktop\Jali\FedCycleData071012 (2).csv'
CHINA_CRT_DATA = r'C:\Users\jerem\OneDrive\Desktop\Jali\ChinaCRT_dataset.csv'

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def augment_menstrual_data(conn):
    """Import menstrual tracking data from FedCycleData"""
    print("Augmenting Menstrual Tracking data from FedCycleData...")
    df = pd.read_csv(FED_CYCLE_DATA)
    cursor = conn.cursor()
    
    # We need some existing OVCs to link to. 
    # For augmentation/demo, we'll link to first N OVCs or create dummy entries.
    cursor.execute("SELECT ovc_id FROM ovc_registration WHERE gender = 'Female' LIMIT 100")
    ovc_ids = [r[0] for r in cursor.fetchall()]
    
    if not ovc_ids:
        print(" ! No female OVCs found. Skipping link. Creating dummy IDs 1-100 for demo.")
        ovc_ids = list(range(1, 101))

    imported = 0
    for idx, row in df.iterrows():
        # Cycle through OVC IDs for demo purposes
        ovc_id = ovc_ids[idx % len(ovc_ids)]
        
        cursor.execute("""
            INSERT INTO menstrual_tracking_logs (
                beneficiary_id, beneficiary_type, cycle_number, start_date, 
                cycle_length, menses_length, bleeding_intensity, menses_score, unusual_bleeding
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            ovc_id, 
            'OVC',
            int(row.get('CycleNumber', 1)),
            '2024-01-01', # Placeholder start date
            int(row.get('LengthofCycle', 28)) if pd.notna(row.get('LengthofCycle')) else None,
            int(row.get('LengthofMenses', 5)) if pd.notna(row.get('LengthofMenses')) else None,
            int(row.get('MeanBleedingIntensity', 3)) if pd.notna(row.get('MeanBleedingIntensity')) else None,
            int(row.get('TotalMensesScore', 10)) if pd.notna(row.get('TotalMensesScore')) else None,
            row.get('UnusualBleeding', 0) == 1
        ))
        imported += 1
        if imported >= 500: break # Limit for demo
        
    conn.commit()
    print(f"✓ Imported {imported} menstrual cycles.")

def augment_adherence_data(conn):
    """Import TB/HIV adherence data from ChinaCRT"""
    print("Augmenting Medication Adherence data from ChinaCRT...")
    df = pd.read_csv(CHINA_CRT_DATA)
    cursor = conn.cursor()
    
    cursor.execute("SELECT ovc_id FROM ovc_registration LIMIT 100")
    ovc_ids = [r[0] for r in cursor.fetchall()]
    
    if not ovc_ids:
        ovc_ids = list(range(1, 101))

    imported = 0
    for idx, row in df.iterrows():
        ovc_id = ovc_ids[idx % len(ovc_ids)]
        
        # Determine medication type based on arm/context (ChinaCRT is primarily TB)
        med_type = 'TB-DOTS' if row.get('arm') in [1, 2] else 'HIV-ART'
        
        cursor.execute("""
            INSERT INTO medication_adherence_logs (
                ovc_id, medication_type, check_date, 
                pills_dispensed, pills_remaining,
                missed_doses_3d, missed_doses_7d, total_missed_cycle,
                supervision_type, monitor_problem_detected
            ) VALUES (%s, %s, CURRENT_DATE, %s, %s, %s, %s, %s, %s, %s)
        """, (
            ovc_id,
            med_type,
            int(row.get('pillcount', 30)) if pd.notna(row.get('pillcount')) else 30,
            None, # logic for remaining could be added
            int(row.get('miss3dose', 0)) if pd.notna(row.get('miss3dose')) else 0,
            int(row.get('miss7dose', 0)) if pd.notna(row.get('miss7dose')) else 0,
            int(row.get('totalmissed_pc', 0)) if pd.notna(row.get('totalmissed_pc')) else 0,
            'Digital-Monitor' if row.get('IM_medmon') == 1 else 'DOTS-CHV',
            row.get('monitorproblem', 0) == 1
        ))
        imported += 1
        if imported >= 500: break
        
    conn.commit()
    print(f"✓ Imported {imported} adherence logs.")

def main():
    try:
        conn = get_connection()
        print("Connected to database.")
        
        augment_menstrual_data(conn)
        augment_adherence_data(conn)
        
        conn.close()
        print("Augmentation complete.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
