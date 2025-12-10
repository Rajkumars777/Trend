
from transformers import pipeline

def debug():
    print("Loading model...")
    pipe = pipeline("sentiment-analysis", model="lxyuan/distilbert-base-multilingual-cased-sentiments-student", device=-1)
    
    samples = [
        "I love this farming technique!",
        "The crop failed deeply and we are sad.",
        "Wheat is a grain."
    ]
    
    for s in samples:
        res = pipe(s, truncation=True, top_k=1)
        print(f"Input: {s}")
        print(f"Raw Output: {res}")

if __name__ == "__main__":
    debug()
