import os
import json
import asyncio
import uuid
import psycopg2
from datetime import datetime
from pydantic import BaseModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from confluent_kafka import Consumer, Producer, KafkaError
import snowflake.connector
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kafka Consumer configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_TOPICS = ['jali.sync.ovc_cases', 'jali.sync.households', 'jali.sync.health_workers']

# Snowflake configuration
def get_snowflake_conn():
    return snowflake.connector.connect(
        account=os.getenv('SNOWFLAKE_ACCOUNT'),
        user=os.getenv('SNOWFLAKE_USER'),
        password=os.getenv('SNOWFLAKE_PASSWORD'),
        warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
        database=os.getenv('SNOWFLAKE_DATABASE'),
        schema=os.getenv('SNOWFLAKE_SCHEMA', 'RAW'),
        role=os.getenv('SNOWFLAKE_ROLE', 'ACCOUNTADMIN')
    )

# Postgres configuration
def get_postgres_conn():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "jali_oltp"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASS", "password"),
        port=os.getenv("DB_PORT", "5432")
    )

class HouseholdCreate(BaseModel):
    chv_id: str
    county_name: str
    constituency_name: str
    ward_name: str
    cbo_id: str = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass 

manager = ConnectionManager()

async def kafka_consumer_loop():
    # Only start Kafka consumer if bootstrap servers are reachable
    # This avoids crashing if Kafka is not yet running
    conf = {
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
        'group.id': 'jali-realtime-group',
        'auto.offset.reset': 'latest',
        'socket.timeout.ms': 5000,
        'reconnect.backoff.ms': 1000,
    }
    
    try:
        consumer = Consumer(conf)
        consumer.subscribe(KAFKA_TOPICS)
        print(f"📡 Real-time consumer listening on {KAFKA_TOPICS}...")
        
        while True:
            msg = consumer.poll(1.0)
            
            if msg is None:
                await asyncio.sleep(0.1)
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"❌ Kafka Error: {msg.error()}")
                    await asyncio.sleep(5) # Wait before retry
                    continue
            
            topic = msg.topic()
            data = json.loads(msg.value().decode('utf-8'))
            
            payload = {
                "topic": topic,
                "data": data,
                "timestamp": str(asyncio.get_event_loop().time())
            }
            
            await manager.broadcast(json.dumps(payload))
            
    except Exception as e:
        print(f"❌ Error in Kafka consumer task: {e}")
    finally:
        if 'consumer' in locals(): consumer.close()

# ----------------------------------------------------
# Postgres Endpoints
# ----------------------------------------------------

@app.get("/api/chvs")
async def get_chvs():
    """Fetch all CHVs to populate dropdowns or assignments"""
    try:
        conn = get_postgres_conn()
        cur = conn.cursor()
        cur.execute("SELECT chv_id, chv_name FROM CHVs")
        chvs = [{"id": row[0], "name": row[1]} for row in cur.fetchall()]
        return {"chvs": chvs}
    except Exception as e:
        return {"error": str(e), "chvs": []}
    finally:
        if 'conn' in locals(): conn.close()

@app.post("/api/households")
async def create_household(req: HouseholdCreate):
    """Register a new household/family in Postgres and emit event to Kafka"""
    try:
        conn = get_postgres_conn()
        cur = conn.cursor()
        
        # Generate a new unique ID for the household
        household_id = f"HH-{uuid.uuid4().hex[:8].upper()}"
        
        # Insert into Postgres
        query = """
            INSERT INTO households 
            (household_id, chv_id, cbo_id, ward_name, constituency_name, county_name) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cur.execute(query, (
            household_id, req.chv_id, req.cbo_id, 
            req.ward_name, req.constituency_name, req.county_name
        ))
        conn.commit()
        
        # Stream event directly to Kafka
        try:
            producer_conf = {'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS, 'client.id': 'jali-api'}
            producer = Producer(producer_conf)
            record = {
                "household_id": household_id,
                "chv_id": req.chv_id,
                "ward_name": req.ward_name,
                "county_name": req.county_name,
                "timestamp": datetime.now().isoformat()
            }
            producer.produce("jali.sync.households", key=household_id, value=json.dumps(record).encode('utf-8'))
            producer.flush(timeout=2.0)
        except Exception as kafka_err:
            print(f"Kafka emit warning: {kafka_err}")
            
        return {"status": "success", "household_id": household_id}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'conn' in locals(): conn.close()

# ----------------------------------------------------
# Dashboard Stats & Snowflake
# ----------------------------------------------------
@app.get("/api/stats")
async def get_dashboard_stats():
    """Fetch live stats from Snowflake"""
    try:
        conn = get_snowflake_conn()
        cursor = conn.cursor()
        
        # Query Active Cases
        cursor.execute("SELECT COUNT(*) FROM RAW.POSTGRES_OVC_CASES")
        active_cases = cursor.fetchone()[0]
        
        # Query Families Reached (Households)
        cursor.execute("SELECT COUNT(*) FROM RAW.POSTGRES_HOUSEHOLDS")
        families_reached = cursor.fetchone()[0]
        
        # Query Health Visits (Placeholder or actual table if exists)
        cursor.execute("SELECT COUNT(*) FROM RAW.POSTGRES_CHVS")
        chw_count = cursor.fetchone()[0]

        # Query dynamic cases from Postgres sync
        cursor.execute('''
            SELECT 
                o.ovc_name, 
                h.county_name, 
                c.art_status,
                TO_CHAR(c.date_of_event, 'YYYY-MM-DD')
            FROM RAW.POSTGRES_OVC_CASES c
            JOIN RAW.POSTGRES_OVCS o ON c.ovc_id = o.ovc_id
            JOIN RAW.POSTGRES_HOUSEHOLDS h ON o.household_id = h.household_id
            ORDER BY c.date_of_event DESC NULLS LAST
            LIMIT 3
        ''')
        
        recent_cases = []
        for row in cursor.fetchall():
            name = row[0] if row[0] else "Unknown OVC"
            initials = "".join([n[0] for n in name.split(" ") if n]) if name else "??"
            
            recent_cases.append({
                "name": name,
                "initials": initials[:2].upper(),
                "caseType": f"HIV Care — {row[2] or 'Follow Up'}",
                "location": str(row[1]) if row[1] else "Nairobi",
                "urgency": "high" if str(row[2]).upper() == "NEW" else "medium",
                "lastVisit": str(row[3]) if row[3] else "Recently",
                "progress": 65
            })

        # Calculate some dummy trends for now
        stats = {
            "activeCases": {"value": str(active_cases), "change": "+3", "changeType": "positive"},
            "familiesReached": {"value": str(families_reached), "change": "+12", "changeType": "positive"},
            "healthVisits": {"value": str(chw_count * 4), "change": "+8", "changeType": "positive"},
            "impactScore": {"value": "94%", "change": "+2%", "changeType": "positive"},
            "cases": recent_cases
        }
        
        return stats
    except Exception as e:
        print(f"❌ Error fetching stats from Snowflake: {e}")
        return {
            "error": str(e),
            "fallback": True,
            "activeCases": {"value": "24", "change": "+3", "changeType": "positive"},
            "familiesReached": {"value": "156", "change": "+12", "changeType": "positive"},
            "healthVisits": {"value": "48", "change": "+8", "changeType": "positive"},
            "impactScore": {"value": "92%", "change": "+5%", "changeType": "positive"}
        }
    finally:
        if 'conn' in locals(): conn.close()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(kafka_consumer_loop())

@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
