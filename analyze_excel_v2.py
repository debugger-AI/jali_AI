import pandas as pd
import sys

# Set encoding to utf-8 for stdout
sys.stdout.reconfigure(encoding='utf-8')

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
        
        # Print first row as dictionary to see values clearly
        if not df.empty:
            print("First row sample:")
            print(df.iloc[0].to_dict())
        
except Exception as e:
    print(f"Error analyzing file: {e}")
