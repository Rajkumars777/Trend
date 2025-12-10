
import os
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer

def download_model():
    model_name = "lxyuan/distilbert-base-multilingual-cased-sentiments-student"
    local_path = os.path.join(os.path.dirname(__file__), "../models/sentiment-model")
    
    print(f"⏳ Downloading model '{model_name}' to '{local_path}'...")
    
    if not os.path.exists(local_path):
        os.makedirs(local_path)
        
    try:
        model = AutoModelForSequenceClassification.from_pretrained(model_name)
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        model.save_pretrained(local_path)
        tokenizer.save_pretrained(local_path)
        
        print(f"✅ Model downloaded successfully to: {local_path}")
    except Exception as e:
        print(f"❌ Failed to download model: {e}")

if __name__ == "__main__":
    download_model()
