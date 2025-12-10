
import os
# Force usage of PyTorch before importing transformers
os.environ["USE_TORCH"] = "True"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
# HACK: Disable TF loading in transformers
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"

import torch
# Check if we can import pipeline without crashing
from transformers import pipeline

def test_load():
    try:
        print("Loading pipeline...")
        # device=-1 for CPU
        pipe = pipeline("sentiment-analysis", model="lxyuan/distilbert-base-multilingual-cased-sentiments-student", device=-1)
        print("✅ Pipeline loaded successfully!")
        
        res = pipe("I love this amazing crop!", truncation=True, top_k=1)
        print(f"Test Result: {res}")
        
    except Exception as e:
        print(f"❌ Failed to load: {e}")

if __name__ == "__main__":
    test_load()
