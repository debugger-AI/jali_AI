import requests
import json

# Configuration
ATLAS_URL = "http://localhost:21000/api/atlas/v2"
AUTH = ('admin', 'admin')  # Default credentials

def create_tag_defs():
    """Define Governance Classifications (Tags)"""
    
    classification_defs = {
        "classificationDefs": [
            {
                "name": "PII",
                "description": "Personally Identifiable Information",
                "superTypes": [],
                "attributeDefs": []
            },
            {
                "name": "SENSITIVE_HEALTH",
                "description": "Sensitive Health Information (HIV Status, etc.)",
                "superTypes": [],
                "attributeDefs": []
            },
            {
                "name": "LOCATION_DATA",
                "description": "Granular location data",
                "superTypes": [],
                "attributeDefs": []
            }
        ],
        "entityDefs": [],
        "enumDefs": [],
        "structDefs": []
    }
    
    try:
        response = requests.post(f"{ATLAS_URL}/types/typedefs", auth=AUTH, json=classification_defs)
        if response.status_code == 200:
            print("Successfully defined tags: PII, SENSITIVE_HEALTH, LOCATION_DATA")
        else:
            print(f"Error defining tags: {response.text}")
    except Exception as e:
        print(f"Connection failed: {e}")

def register_table_metadata(table_name, columns, description):
    """Register a Postgres logical table in Atlas"""
    
    entity = {
        "entity": {
            "typeName": "rdbms_table",
            "attributes": {
                "qualifiedName": f"postgres.public.{table_name}@cluster",
                "name": table_name,
                "description": description,
                "owner": "jali_admin"
            }
        }
    }
    
    # This is a simplified call; usually you need to define the RDBMS types first if not present
    # But this script serves as the template for the 'bridge'
    print(f"Registering metadata for table: {table_name}")
    # requests.post(f"{ATLAS_URL}/entity", auth=AUTH, json=entity)

if __name__ == "__main__":
    print("--- Jali Governance Policy Sync ---")
    print("Target Atlas: " + ATLAS_URL)
    
    # 1. Create Tags
    create_tag_defs()
    
    # 2. Register Metadata (Simulation)
    # In production, we'd iterate over the Schema info
    tables = [
        ("ovc_registration", ["ovc_names", "dob", "hiv_status"], "Main OVC Registry"),
        ("caregivers", ["caregiver_names", "phone", "national_id"], "Caregiver Data")
    ]
    
    for table, cols, desc in tables:
        register_table_metadata(table, cols, desc)
        
    print("\nNote: Ensure Docker Container is running before executing for real.")
