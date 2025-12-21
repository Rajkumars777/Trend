# Technical Reference: End-to-End Pipeline & Algorithms

This document details the complete lifecycle of data within the Agri-Trend platform, from raw social media posts to actionable market insights. It explains **how** we gather, filter, process, and analyze data "from start to end".

---

## 🔁 The "Life of a Data Point" (End-to-End Flow)

The system operates as a linear **ETLA (Extract - Transform - Load - Analyze)** pipeline.

### Phase 1: Ingestion (The Gathering)
**Goal**: Cast a wide net to capture every possible conversation about agriculture.
**Source Code**: `scripts/social_media_pipeline.py`

We run multiple specialized "Miners" in parallel:

1.  **Reddit Miner**:
    *   **Technique**: Uses `snoowrap` or direct JSON API.
    *   **Strategy**: targeted searches for keywords like `Mandi`, `Harvest`, `Fertilizer` AND specific subreddits (`r/farming`, `r/agriculture`).
    *   **Output**: Raw text titles and self-text.

2.  **Google News Archive (The Time Machine)**:
    *   **Technique**: RSS Feed parsing (`feedparser`) with date-range filters.
    *   **Strategy**: Iterates through years (2005-2025) to build historical context.
    *   **Output**: News headlines and summaries.

3.  **YouTube Watcher**:
    *   **Technique**: Regex-based scraping of search result pages (to avoid API quotas).
    *   **Strategy**: Extracts video titles for queries like "Monsoon Forecast".
    *   **Output**: Video titles and descriptions.

4.  **Fediverse (Mastodon/Lemmy)**:
    *   **Technique**: ActivityPub API queries for `#farming` hashtags.
    *   **Output**: Decentralized social posts.

5.  **Meta Platforms (Facebook/Instagram)**:
    *   **Technique**: Web Proxy Mining (utilizing indexed search results via Google `site:` operators).
    *   **Strategy**: Targeted `site:facebook.com` and `site:instagram.com` queries for agricultural keywords.
    *   **Output**: Publicly indexed posts and community discussions.

---

### Phase 2: The Gatekeeper (Relevance Filtering)
**Goal**: Block "Noise" (Crypto farms, Server farms) before it pollutes the database.
**Source Code**: `scripts/advanced_analytics/relevance_gate.py` & `scripts/utils/ai_client.py`

Every raw post must pass the **Gatekeeper Logic**:

1.  **Step A: The Strickland Rule (Heuristic Filter)**
    *   **Input**: Raw Text.
    *   **Logic**: If text contains "Blacklisted Terms" (e.g., `crypto`, `server`, `gaming`), it is **IMMEDIATELY REJECTED** *unless* it also contains a **Strong Agri-Anchor** (e.g., `wheat`, `tractor`).
    *   **Why?**: Prevents "Stardew Valley" (game) posts from being counted as real farming news.

2.  **Step B: Zero-Shot Classification (AI Model)**
    *   **Model**: `valhalla/distilbart-mnli-12-1`
    *   **Logic**: The text is fed to the Transformer model with candidate labels: `["Agriculture", "Economy", "Noise"]`.
    *   **Decision**: If `Score(Agriculture) < 0.6`, the post is discarded.

---

### Phase 3: Cognitive Processing (Enrichment)
**Goal**: Turn raw text into structured data (Sentiment, Entities, Topics).
**Source Code**: `scripts/advanced_analytics/nlp_engine.py` & `scripts/utils/ai_client.py`

Accepted posts go through the **Enrichment Engine**:

1.  **Sentiment Analysis (Hybrid Model)**
    *   **Model**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
    *   **Hybrid Booster Logic**: The raw model score is *overridden* by domain rules:
        *   **Subsidy Cut Rule**: If text mentions "subsidy slashed", sentiment is forced to **NEGATIVE (-0.8)**.
        *   **Input Cost Rule**: If "fertilizer price hike", sentiment is forced to **NEGATIVE**.
        *   **Tech Boost**: If "drone launch", sentiment is forced to **POSITIVE**.

2.  **Entity Extraction (Knowledge Graph)**
    *   **Technique**: Ontology mapping (FoodOn).
    *   **Action**: Scans text for specific entities: `Rice` (Commodity), `Nashik` (Mandi), `Locust` (Pest).

3.  **Topic Modeling**:
    *   **Technique**: Keyword clustering.
    *   **Result**: Tags the post as `Weather`, `Policy`, `Market Price`, or `Pest Attack`.

---

### Phase 4: Network Analysis (Viral Risk)
**Goal**: Predict *future* panic based on *current* chatter velocity.
**Source Code**: `scripts/advanced_analytics/graph_engine.py`

The system builds a relationship graph to calculate **Risk Velocity**:

*   **Formula**: $$ \text{Risk} = \text{Sentiment} \times (1 + \text{UserInfluence} + \Delta\text{Velocity}) $$
*   **Logic**:
    *   It checks who posted (Influencer Score).
    *   It checks how fast they are gaining traction ($\Delta\text{Velocity}$).
    *   **Outcome**: If a high-influence user is accelerating on a negative topic, the system flags a **CRITICAL VIRAL SPIKE** (e.g., "Panic selling of onions starting in Nashik").

---

### Phase 5: Forecasting (The Oracle)
**Goal**: Predict future prices using the enriched data.
**Source Code**: `scripts/advanced_analytics/forecasting_engine.py`

1.  **Temporal Fusion Transformer (TFT)**:
    *   **Inputs**:
        *   Static Covariates: Location (Country/Region).
        *   Observed Inputs: Historical Prices, Weather Data.
        *   **Unknown Inputs**: The *Social Sentiment Index* generated in Phase 3.
    *   **Task**: Predict price for T+7 Days.

2.  **Conformal Prediction (Uncertainty)**:
    *   Instead of saying "Price will be ₹2500", it calculates a **Risk Interval**.
    *   **Output**: "Price will be between ₹2400 and ₹2600 (90% Confidence)."

---

## 📚 Appendix: AI Model Registry

| Model Name | Role | File |
| :--- | :--- | :--- |
| **DistilBART-MNLI** | Relevance Gatekeeper | `relevance_gate.py` |
| **RoBERTa-Sentiment** | Sentiment Scoring | `ai_client.py` |
| **AgriBERT** | Domain Concept Understanding | `nlp_engine.py` |
| **NeuralProphet** | Trend Forecasting | `forecasting_engine.py` |
