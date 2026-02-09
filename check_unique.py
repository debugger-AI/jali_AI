import pandas as pd

file_path = 'Tumikia Data.xlsx'

try:
    # Read just the columns needed to check uniqueness
    df = pd.read_excel(file_path, sheet_name='Sheet1', usecols=['ovc_id'])
    
    total_rows = len(df)
    unique_ovc = df['ovc_id'].nunique()
    
    print(f"Total rows: {total_rows}")
    print(f"Unique OVC IDs: {unique_ovc}")
    
    if total_rows > unique_ovc:
        print("Dataset contains multiple rows per OVC (Longitudinal or Duplicates)")
    else:
        print("Dataset contains one row per OVC")
        
except Exception as e:
    print(f"Error: {e}")
