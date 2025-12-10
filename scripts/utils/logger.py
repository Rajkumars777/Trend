
import os
import datetime
import uuid
import pymongo
from dotenv import load_dotenv

# Load env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

MONGO_URI = os.getenv('MONGODB_URI')
if not MONGO_URI:
    MONGO_URI = 'mongodb://localhost:27017/agri_trend_dashboard'

class PipelineLogger:
    def __init__(self):
        self.client = pymongo.MongoClient(MONGO_URI)
        self.db = self.client.get_database('agri_trend_dashboard')
        self.collection = self.db['pipeline_runs']
        self.run_id = str(uuid.uuid4())
        self.steps = []
        self.start_time = None
        self.job_name = "Unknown"

    def start_run(self, job_name):
        self.job_name = job_name
        self.start_time = datetime.datetime.now()
        print(f"📝 [LOG] Starting Run: {self.run_id} ({job_name})")
        
        run_doc = {
            "run_id": self.run_id,
            "job_name": self.job_name,
            "status": "RUNNING",
            "start_time": self.start_time,
            "steps": [],
            "metrics": {}
        }
        self.collection.insert_one(run_doc)
        return self.run_id

    def log_step(self, step_name, status="INFO", details=None):
        timestamp = datetime.datetime.now()
        step = {
            "name": step_name,
            "status": status,
            "timestamp": timestamp,
            "details": details or ""
        }
        self.steps.append(step)
        
        self.collection.update_one(
            {"run_id": self.run_id},
            {"$push": {"steps": step}, "$set": {"last_updated": timestamp}}
        )
        print(f"   👉 [{status}] {step_name}")

    def finish_run(self, status="SUCCESS", metrics=None):
        end_time = datetime.datetime.now()
        duration = (end_time - self.start_time).total_seconds()
        
        update_doc = {
            "status": status,
            "end_time": end_time,
            "duration_seconds": duration,
        }
        if metrics:
            update_doc["metrics"] = metrics

        self.collection.update_one(
            {"run_id": self.run_id},
            {"$set": update_doc}
        )
        print(f"✅ [LOG] Finished Run: {self.run_id} - {status} ({duration}s)")
