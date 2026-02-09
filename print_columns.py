import pandas as pd
import sys

file_path = 'Tumikia Data.xlsx'

try:
    df = pd.read_excel(file_path, sheet_name='Sheet1', nrows=5)
    
    with open('cols.txt', 'w', encoding='utf-8') as f:
        f.write("Columns:\n")
        for col in df.columns:
            f.write(f"{col}\n")
        
    print("Columns written to cols.txt")
        
except Exception as e:
    print(f"Error: {e}")
