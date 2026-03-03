import os
import json
import logging
from confluent_kafka import Consumer, KafkaError, KafkaException
from dotenv import load_dotenv

# Import Jali components
import sys
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from ai.llm_service import LLMService
from notifications.alert_manager import AlertManager

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_TOPIC = 'jali.ml.predictions'
KAFKA_GROUP_ID = 'jali_ai_agent_group'

def run_consumer():
    logger.info("🚀 Starting Jali AI Agent Kafka Consumer...")
    
    conf = {
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
        'group.id': KAFKA_GROUP_ID,
        'auto.offset.reset': 'earliest'
    }
    
    try:
        consumer = Consumer(conf)
        consumer.subscribe([KAFKA_TOPIC])
    except Exception as e:
        logger.error(f"Failed to initialize Kafka Consumer: {e}")
        return

    llm_service = LLMService()
    alert_manager = AlertManager()
    
    logger.info(f"Subscribed to topic: {KAFKA_TOPIC}. Waiting for prediction events...")
    
    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            
            if msg is None:
                continue
            
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    # End of partition event
                    logger.debug(f"{msg.topic()} [{msg.partition()}] reached end at offset {msg.offset()}")
                elif msg.error():
                    raise KafkaException(msg.error())
                continue
            
            # Process the prediction event
            try:
                event_data = json.loads(msg.value().decode('utf-8'))
                logger.info(f"Received prediction event for user {event_data.get('user_id')}")
                
                # Use LLM to generate the personalized message based on the context
                personalized_message = llm_service.generate_alert_message(event_data)
                
                # Dispatch the message using the AlertManager
                channel = event_data.get('preferred_channel', 'sms')
                alert_manager.send_custom(
                    user_id=event_data.get('user_id'), 
                    message=personalized_message, 
                    channel=channel
                )
                
            except json.JSONDecodeError:
                logger.error("Failed to decode Kafka message as JSON")
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                
    except KeyboardInterrupt:
        logger.info("Consumer stopped by user.")
    finally:
        consumer.close()
        logger.info("Kafka Consumer closed.")

if __name__ == "__main__":
    run_consumer()
