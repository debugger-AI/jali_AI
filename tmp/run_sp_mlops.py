import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv('.env')

def deploy_and_run_sp():
    conn = snowflake.connector.connect(
        user=os.getenv('SNOWFLAKE_USER'),
        password=os.getenv('SNOWFLAKE_PASSWORD'),
        account=os.getenv('SNOWFLAKE_ACCOUNT'),
        warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
        database=os.getenv('SNOWFLAKE_DATABASE'),
        role=os.getenv('SNOWFLAKE_ROLE')
    )

    try:
        cursor = conn.cursor()
        print("DEPLOYING Native Registration Stored Procedure...")
        
        # Read the SQL file
        with open('snowflake/sp_train_registry.sql', 'r') as f:
            sql_content = f.read()
        
        # Execute the CREATE PROCEDURE statement
        # We need to handle the whole block
        cursor.execute(sql_content)
        print("   [SUCCESS] Stored Procedure Deployed.")
        
        # Run for HIV
        print("\nRUNNING HIV Registration (In-Snowflake)...")
        cursor.execute("CALL MLOPS.TRAIN_AND_REGISTER_PILLAR('hiv_adherence')")
        print(f"   [RESULT] {cursor.fetchone()[0]}")
        
        # Run for TB
        print("\nRUNNING TB Registration (In-Snowflake)...")
        cursor.execute("CALL MLOPS.TRAIN_AND_REGISTER_PILLAR('tb_adherence')")
        print(f"   [RESULT] {cursor.fetchone()[0]}")

        # Run for Immunization
        print("\nRUNNING Immunization Registration (In-Snowflake)...")
        cursor.execute("CALL MLOPS.TRAIN_AND_REGISTER_PILLAR('immunization')")
        print(f"   [RESULT] {cursor.fetchone()[0]}")

    finally:
        conn.close()

if __name__ == "__main__":
    deploy_and_run_sp()
