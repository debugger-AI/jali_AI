import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "jali_oltp")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "password")
DB_PORT = os.getenv("DB_PORT", "5432")

def setup_db():
    print(f"Attempting to connect to PostgreSQL at {DB_HOST}:{DB_PORT} as {DB_USER}")
    
    # Connect to default postgres DB first to create database if not exists
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        cur.execute("SELECT 1 FROM pg_database WHERE datname=%s", (DB_NAME,))
        if not cur.fetchone():
            print(f"Creating database {DB_NAME}...")
            cur.execute(f'CREATE DATABASE "{DB_NAME}"')
        else:
            print(f"Database {DB_NAME} already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Failed to connect to postgres server: {e}")
        return

    # Now connect to the actual DB and initialize schema
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()

        schema_path = os.path.join(os.path.dirname(__file__), "transactional DB", "schema.sql")
        with open(schema_path, "r") as f:
            schema_sql = f.read()

        print("Executing schema...")
        cur.execute(schema_sql)

        # Insert some dummy CHVs if missing
        cur.execute("SELECT COUNT(*) FROM CHVs")
        if cur.fetchone()[0] == 0:
            print("Inserting dummy CHVs...")
            chvs = [
                ("CHV-001", "Amara Kimani"),
                ("CHV-002", "David Ochieng"),
                ("CHV-003", "Sarah Wanjala"),
                ("CHV-004", "John Ngugi"),
            ]
            for chv_id, name in chvs:
                cur.execute("INSERT INTO CHVs (chv_id, chv_name) VALUES (%s, %s)", (chv_id, name))
                
        print("Database setup complete.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Failed to setup schema: {e}")

if __name__ == "__main__":
    setup_db()
