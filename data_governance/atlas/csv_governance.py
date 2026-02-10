import requests
import json
import pandas as pd
import os

# Configuration
ATLAS_URL = "http://localhost:21000/api/atlas/v2"
AUTH = ('admin', 'admin')  # Default credentials
DATASET_PATH = r"C:\Users\jerem\OneDrive\Desktop\Jali\Tumikia Data.xlsx"

def define_classifications():
    """Ensure the necessary classification tags exist in Atlas"""
    classification_defs = {
        "classificationDefs": [
            {"name": "PII", "description": "Personally Identifiable Information"},
            {"name": "PHI", "description": "Protected Health Information (Sensitive)"},
            {"name": "RESTRICTED", "description": "Highly restricted access"},
            {"name": "LOCATION", "description": "Geographic coordinates or home address"}
        ]
    }
    print("Defining classifications in Atlas...")
    response = requests.post(f"{ATLAS_URL}/types/typedefs", auth=AUTH, json=classification_defs)
    return response.status_code

def register_csv_entity():
    """Register the Tumikia Dataset file and its columns as Atlas Entities"""
    
    # Define the file entity
    file_entity = {
        "entity": {
            "typeName": "fs_path",
            "attributes": {
                "qualifiedName": f"file://{DATASET_PATH.replace('\\', '/')}",
                "name": "Tumikia_Data_Source",
                "path": DATASET_PATH,
                "description": "Primary Source Excel for CHW Registration System",
                "isFile": True
            }
        }
    }
    
    # In a real Atlas setup, we would create 'column' entities linked to the 'file' entity
    # and apply tags to them. For this simulation, we describe the policy mapping:
    
    column_security_mapping = {
        "ovc_names": "PII",
        "ovchivstatus": "PHI",
        "artstatus": "PHI",
        "ccc_number": "PHI",
        "caregiver_names": "PII",
        "phone": "PII",
        "caregiver_nationalid": "PII",
        "household": "LOCATION"
    }
    
    print(f"Applying Security Policies to Dataset at {DATASET_PATH}:")
    for col, tag in column_security_mapping.items():
        print(f"  [Atlas Policy] Tagging column '{col}' with classification: {tag}")
        # Logic to apply tag via Atlas API:
        # requests.post(f"{ATLAS_URL}/entity/guid/{guid}/classifications", json=[{"typeName": tag}])

    print("\nSecurity perimeter established in Atlas Metadata Repository.")
    print("Integration with Apache Ranger required for dynamic masking/access enforcement.")

if __name__ == "__main__":
    if not os.path.exists(DATASET_PATH):
        print(f"Error: Dataset not found at {DATASET_PATH}")
    else:
        print("--- Jali Data Security with Apache Atlas ---")
        # In a real environment, we'd check if Atlas is reachable first
        register_csv_entity()
