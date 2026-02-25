import os
import json
import time
import psycopg2
from datetime import datetime
from confluent_kafka import Producer
from dotenv import load_dotenv

load_dotenv()

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_TOPIC_PREFIX = 'jali.sync.'

# Database configuration
TABLES_TO_WATCH = [
    'ovc_cases',
    'households',
    'health_workers'
]

def get_postgres_conn():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'Jali DB'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASS', 'postgres'),
        port=os.getenv('DB_PORT', '5432')
    )

def delivery_report(err, msg):
    if err is not None:
        print(f'❌ Message delivery failed: {err}')
    else:
        print(f'✅ Message delivered to {msg.topic()} [{msg.partition()}]')

def json_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def run_producer():
    print(f"🚀 Starting Kafka Producer for Jali...")
    
    producer_conf = {
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
        'client.id': 'jali-producer'
    }
    
    producer = Producer(producer_conf)
    
    # Store last seen ID for each table to simulate CDC via polling
    # In a real production environment, you'd use Debezium or logical replication
    last_ids = {table: 0 for table in TABLES_TO_WATCH}
    
    try:
        conn = get_postgres_conn()
        cursor = conn.cursor()
        
        # Initialize last_ids with current max IDs
        for table in TABLES_TO_WATCH:
            cursor.execute(f"SELECT MAX(id) FROM {table}")
            res = cursor.fetchone()[0]
            last_ids[table] = res if res else 0
            print(f"   Initial ID for {table}: {last_ids[table]}")

        while True:
            for table in TABLES_TO_WATCH:
                # Poll for new records
                query = f"SELECT * FROM {table} WHERE id > %s ORDER BY id ASC"
                cursor.execute(query, (last_ids[table],))
                
                columns = [desc[0] for desc in cursor.description]
                records = cursor.fetchall()
                
                for row in records:
                    record = dict(zip(columns, row))
                    topic = f"{KAFKA_TOPIC_PREFIX}{table}"
                    
                    # Send to Kafka
                    producer.produce(
                        topic, 
                        key=str(record['id']), 
                        value=json.dumps(record, default=json_serializer).encode('utf-8'),
                        callback=delivery_report
                    )
                    last_ids[table] = record['id']
                    
            producer.flush()
            time.sleep(2) # Poll every 2 seconds
            
    except Exception as e:
        print(f"❌ Error in producer loop: {e}")
    finally:
        if 'conn' in locals(): conn.close()
        print("🛑 Producer stopped.")

if __name__ == "__main__":
    run_producer()
