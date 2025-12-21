
import time
import statistics

import sys
import os

# Add script dir to path (Parent directory 'scripts/')
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from cognitive_pipeline import CognitivePipeline

def run_benchmark(event_count=50):
    print(f"🚀 Starting Benchmark Run ({event_count} events)...")
    
    pipeline = CognitivePipeline()
    
    # Instrumentation Hooks
    latencies = []
    start_time = time.time()
    
    # We override process_stream slightly to capture metrics
    # Instead of modifying the class, we wrap the generator if possible or just rely on a subclass
    
    # Let's subclass for instrumentation to avoid touching the main code
    class BenchmarkedPipeline(CognitivePipeline):
        def __init__(self):
            super().__init__()
            self.relevant_count = 0
            self.irrelevant_count = 0
            self.forecast_times = []
            
        def process_stream_bench(self, max_events):
            print("   📡 Connecting to Benchmark Stream...")
            stream = self._real_data_stream() # Use real data source logic (which is simulated in main but fetches from social fetchers)
            
            count = 0
            for event in stream:
                if count >= max_events: break
                
                t0 = time.time()
                
                # Copy-paste logic from main process_stream for 1:1 comparison
                # 0. Gate
                if not self.relevance_gate.is_relevant(event['text']):
                    self.irrelevant_count += 1
                    latencies.append((time.time() - t0) * 1000)
                    continue
                else:
                    self.relevant_count += 1

                # 1. NLP
                aspects = self.nlp.aspect_based_sentiment(event['text'])
                entities = self.nlp.detect_entities(event['text'])
                
                # 2. GNN
                gnn_risk = self.graph_engine.propagate_risk(
                    topic=entities[0]['entity'] if entities else "General",
                    sentiment_score=sum(aspects.values()),
                    user_influence_score=0.5
                )
                
                # 3. Drift
                sentiment_score = sum(aspects.values()) / 3
                _ = self.drift_detector.check_distribution_shift(sentiment_score)
                
                # 4. Window
                self.window_buffer.append({
                    "ds": event['timestamp'],
                    "sentiment": sentiment_score,
                    "price": event['base_price']
                })
                
                latencies.append((time.time() - t0) * 1000) # Processing Latency
                
                # 5. Forecast
                if len(self.window_buffer) >= self.window_size:
                    ft0 = time.time()
                    self._trigger_micro_batch_forecast()
                    self.forecast_times.append((time.time() - ft0) * 1000)
                    self.window_buffer = []

                count += 1
                
            return count

    bp = BenchmarkedPipeline()
    bp.process_stream_bench(max_events=event_count)
    
    total_time = time.time() - start_time
    
    print("\n📊 BENCHMARK RESULTS")
    print("====================")
    print(f"Total Events Processed: {event_count}")
    print(f"Total Runtime: {round(total_time, 2)}s")
    print(f"Throughput: {round(event_count / total_time, 2)} events/sec")
    print("-" * 20)
    print(f"Avg Event Latency: {round(statistics.mean(latencies), 2)} ms")
    print(f"Max Event Latency: {round(max(latencies), 2)} ms")
    if bp.forecast_times:
        print(f"Avg Forecast Latency: {round(statistics.mean(bp.forecast_times), 2)} ms")
    print("-" * 20)
    print(f"Relevance Gate Stats:")
    print(f"   - Kept: {bp.relevant_count}")
    print(f"   - Blocked: {bp.irrelevant_count}")
    print(f"   - Reduction Rate: {round((bp.irrelevant_count / (bp.relevant_count + bp.irrelevant_count))*100, 1)}%")
    print("====================")

if __name__ == "__main__":
    run_benchmark(50)
