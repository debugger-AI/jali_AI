import pandas as pd
import os

file_path = 'Tumikia Data.xlsx'

try:
    xl = pd.ExcelFile(file_path)
    print(f"File found: {file_path}")
    print(f"Sheet names: {xl.sheet_names}")
    
    for sheet in xl.sheet_names:
        print(f"\n--- Analyzing Sheet: {sheet} ---")
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=5)
        print("Columns:")
        for col in df.columns:
            print(f"  - {col} ({df[col].dtype})")
        print("Sample Data (first 2 rows):")
        print(df.head(2).to_string())
        
except Exception as e:
    print(f"Error analyzing file: {e}")
