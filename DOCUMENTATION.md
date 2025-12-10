# Agri-Trend Analytics Platform - Technical Documentation

## 1. Project Overview
The **Agri-Trend Analytics Platform** is an intelligent system designed to provide real-time insights into agricultural markets. It bridges the gap between **quantitative market data** (prices, exchange rates) and **qualitative social signals** (farmer sentiment, discussions) to forecast trends.

**Core Mission:** To predict agricultural market shifts by analyzing the correlation between social sentiment and market indicators.

## 2. System Architecture & Workflows

### End-to-End Workflow
The system operates on a strictly linear "Extract-Transform-Load-Analyze" (ETLA) pipeline model. This linearity ensures data integrity and simplifies debugging by creating clear state transitions.

1.  **Data Ingestion (Raw Input)**
    *   **Action**: The system polls external APIs (Yahoo Finance for market data, World Bank for economic stats) and scrapes social platforms (Reddit for unstructured text).
    *   **Input State**: Disparate, unstructured JSON and raw HTML/Text.
    *   **Output State**: Raw documents stored in memory or temporary buffers.

2.  **Normalization (Standardization)**
    *   **Action**: Disparate data formats are unified. Currencies are normalized to USD baselines before local conversion. Text is stripped of URLs, special characters, and non-alphanumeric noise to prepare for NLP.
    *   **Input State**: Raw mixed-format data.
    *   **Output State**: Cleaned strings and standardized numerical objects.

3.  **AI Enrichment (Intelligence Injection)**
    *   **Action**: Clean data is passed through the `AgriAIClient`.
        *   *Classification*: Determines if content is "Agricultural" vs "Noise".
        *   *Sentiment Analysis*: Assigns a polarity vector (-1.0 to +1.0).
        *   *Topic Modeling*: Tags content with categories like "Weather" or "Policy".
    *   **Input State**: Clean text.
    *   **Output State**: Annotated JSON documents (`posts` collection) containing metadata like `sentiment_score` and `detected_keywords`.

4.  **Statistical Forecasting (Temporal Projection)**
    *   **Action**: The system aggregates enriched sentiment scores by day. A Linear Regression model is trained on this time-series data to extrapolate the trend line for the upcoming 7 days.
    *   **Input State**: Time-series historical data.
    *   **Output State**: Future date-value pairs (`forecasts` collection).

5.  **Visualization (Consumption)**
    *   **Action**: The Next.js frontend fetches the pre-processed and forecasted data via internal APIs to render interactive maps, trend charts, and alerts.
    *   **Input State**: Structured database records.
    *   **Output State**: User-facing React components and SVG visualizations.

### Phase 1: Data Gathering (Ingestion)
**File:** `scripts/agri_pipeline.py` (Function: `fetch_all`)

### Phase 1: Data Gathering (Ingestion) Detail
**File:** `scripts/agri_pipeline.py` (Function: `fetch_all`)

The system aggregates data from three distinct sources using the following specifications:

#### 1. Global Financial & Market Data
*   **Source**: Yahoo Finance (`yfinance`).
*   **Method**: Live Futures Aggregation + Currency Conversion.
*   **Process**:
    1.  Fetch Global Futures (e.g., Chicago Wheat `ZW=F`, Rough Rice `ZR=F`).
    2.  Fetch Real-time Exchange Rates (e.g., `USD` -> `INR`).
    3.  **Real-Time Price Calculation**: `Futures_Price * Exch_Rate * Unit_Conversion_Factor * Local_Premium`
*   **Data Extracted**:
    *   `INR=X`, `JPY=X`, `PHP=X`
    *   Commodity Tickers: `ZR=F`, `ZW=F`, `ZC=F`, `ZS=F`, `CT=F`
*   **Example Data**:
    ```json
    { 
      "commodity": "Rice (Basmati)", 
      "price": "₹3850.45", 
      "source": "Live Futures",
      "trend": "+1.2%" 
    }
    ```

#### 2. Socio-Economic Indicators & Weather
*   **Source**: World Bank Open Data & OpenWeatherMap.
*   **Method**: REST API.
*   **Authentication**: 
    -   World Bank: **Open Data** (No Key).
    -   Weather: **API Key Required** (`OPENWEATHER_API_KEY` in `.env.local`).
*   **Process**: 
    -   Queries specific indicators like `NV.AGR.TOTL.ZS` (Agri GDP %).
    -   Fetches real-time temperature and rainfall for capital cities.
*   **Example Response**:
    ```json
    { "country": "India", "gdp_share_agri": 16.5, "weather": {"temp": 32.5, "rain": 0.0} }
    ```

#### 3. Social Discourse (Qualitative)
*   **Source**: Reddit
*   **Method**: Public Search JSON Endpoint (Scraping).
*   **Endpoint**: `https://www.reddit.com/search.json?q={query}`
*   **Authentication**: **None** (User-Agent header only).
    *   *Note*: While `snoowrap` is in the package mainly for future auth, the current script uses direct HTTP requests for simpler zero-setup access.
*   **Extraction Process**:
    1.  Construct query from keywords: `"Rice OR Wheat OR Farming"`.
    2.  Fetch JSON feed.
    3.  Normalize `data.children[].data` into internal Post format.
*   **Input Example (Raw)**:
    ```json
    {
       "title": "Soy powder plant will process more Ontario beans at home",
       "selftext": "",
       "score": 5,
       "subreddit": "farming",
       "created_utc": 1733507445.0,
       "author": "MennoniteDan"
    }
    ```

#### 4. Google News
*   **Source**: Google News RSS
*   **Method**: XML Parsing (`xml.etree`).
*   **Endpoint**: `https://news.google.com/rss/search?q={QUERY}`
*   **Authentication**: **Public RSS** (No Key).
*   **Process**: Parses `<item>` tags for title and publication date.
*   **Example Data**:
    ```json
    {
      "title": "Global Rice Prices Hit 15-Year High",
      "source": "news",
      "url": "https://news.google.com/..."
    }
    ```

#### 5. YouTube (Video Intelligence)
*   **Source**: YouTube Search Results
*   **Method**: HTML Regex Extraction (Scraping).
*   **Endpoint**: `https://www.youtube.com/results?search_query={QUERY}`
*   **Authentication**: **None** (Public HTML).
*   **Process**:
    1.  Fetches search results page.
    2.  Uses Regex `r'"videoId":"([a-zA-Z0-9_-]{11})"'` to extract video IDs.
    3.  Constructs valid `youtu.be` links.
*   **Example Data**:
    ```json
    {
      "title": "YouTube Video: dQw4w9WgXcQ",
      "content": "Video discussion on agriculture...",
      "source": "youtube",
      "url": "https://youtu.be/dQw4w9WgXcQ"
    }
    ```

### Phase 2: Data Processing & Feature Extraction (Deep Dive)
**File:** `scripts/agri_pipeline.py` (Function: `enrich_data`)

This phase transforms unstructured text into structured, queryable data using a multi-stage AI pipeline.

#### Step 1: Text Normalization & Cleaning
*   **Goal**: Remove noise to improve Model performance.
*   **Algorithm**: Regex-based string manipulation.
*   **Actions**:
    *   Strip URLs (e.g., `https://...` -> ``).
    *   Remove special occurrences but preserve hashtags (`#Rice` -> `#Rice`).
    *   Content Truncation: Limiting text to 512 tokens to match Transformer model limits.
    *   **Transformation Example**:
        *   *Input*: "Soy powder plant at home! Read more: https://redd.it/xyz"
        *   *Output*: "Soy powder plant at home!"

#### Step 2: Relevance Filtering (Zero-Shot Classification)
*   **Goal**: Filter out off-topic posts (e.g., "farming XP" in video games).
*   **Model**: `facebook/bart-large-mnli` (hosted via Hugging Face API).
*   **Technique**: **Zero-Shot Learning**. The model is fed the text and a candidate label `["agriculture"]`. It outputs an entailment score.
*   **Logic**: `IF score("agriculture") > 0.5 THEN Keep ELSE Discard`.
*   **Transformation Example**:
    *   *Input*: "Soy powder plant will process more Ontario beans..."
    *   *Model Output*: `Label: "agriculture", Score: 0.98`
    *   *Result*: **KEEP** (Relevant)

#### Step 3: Feature Extraction

**A. Sentiment Analysis**
*   **Goal**: Determine the emotional pole of the text (Positive/Negative/Neutral).
*   **Model**: `distilbert-base-multilingual-cased-sentiments-student` (Local or Cloud).
*   **Algorithm**:
    1.  **Inference**: Model outputs probabilities, e.g., `{"positive": 0.9, "negative": 0.1}`.
    2.  **Thresholding**: A "Noise Gate" is applied. If the confidence score is `< 0.2`, the sentiment is forced to **Neutral**. This prevents weak/uncertain predictions from skewing the data.
    3.  **Transformation Example**:
        *   *Input*: "...process more Ontario beans at home"
        *   *Model Output*: `Label: "POSITIVE", Score: 0.5624`
        *   *Check*: `0.5624 > 0.2` (Threshold) -> **Pass**
        *   *Final Attribute*: `sentiment_class: "Positive"`

**B. Topic Modeling**
*   **Goal**: Assign a specific category to the post.
*   **Model**: `facebook/bart-large-mnli` (reused).
*   **Candidate Labels**: `["Market Prices", "Weather", "Pests & Disease", "Farming Technology", "Government Policy"]`.
*   **Output**: The label with the highest entailment score is assigned.
*   **Transformation Example**:
    *   *Input*: "Soy powder plant..."
    *   *Candidates*: `["Farming Technology", "Market Prices", ...]`
    *   *Scores*: `Tech: 0.85, Markets: 0.10, ...`
    *   *Final Attribute*: `category: "Farming Technology"`

**C. Keyword Extraction**
*   **Goal**: Identify specific crops or entities.
*   **Algorithm**: Deterministic lookup.
*   **Process**: The text is scanned against a predefined `ALL_KEYWORDS` list (e.g., "Rice", "Wheat", "Drought") found in `utils/agri_keywords.py`. Matches are stored in the `detected_keywords` array.
*   **Transformation Example**:
    *   *Input*: "Soy powder plant..."
    *   *Dictionary Lookups*: "Soy" (Found), "Beans" (Found)
    *   *Result*: `detected_keywords: ["Soy", "Beans"]`
    *   *(Note: In the final example below, it falls back to Category if no keywords found)*

#### Example: Enriched Social Data Object
Below is a real-world example of a raw Reddit post after passing through the `enrich_data` pipeline. Note the injected `analysis` object containing AI-derived metadata.

```json
{
  "_id": "ObjectId('69342fca31d8c40e50b2f077')",
  "reddit_id": "reddit_1pf0l1t",
  "analysis": {
    "is_relevant": true,
    "category": "Farming Technology",
    "sentiment_class": "Positive",
    "sentiment_score": 0.5624,
    "confidence": 0.9761,
    "detected_keywords": ["Farming Technology"]
  },
  "author": "MennoniteDan",
  "content": "Soy powder plant will process more Ontario beans at home",
  "metrics": {
    "upvotes": 5,
    "comments": 0
  },
  "source": "reddit",
  "timestamp": "2025-12-06T17:50:45.000+00:00",
  "url": "https://www.reddit.com/r/farming/comments/1pf0l1t/soy_powder_plant_wil..."
}
```

### Phase 3: Insight Generation & Forecasting
**File:** `scripts/agri_pipeline.py` (Function: `forecast_trends`)

This phase turns structured data into predictive insights.
-   **Aggregation**: Sentiment scores are averaged daily.
-   **Modeling**: A **Linear Regression Model** (Scikit-Learn) fits a trend line to the daily sentiment averages.
-   **Prediction**: The model extrapolates sentiment outcomes for the next **7 days**.

#### Example: Aggregation & Prediction
How the single "Soy powder" post contributes to the trend:

1.  **Input**: Post `reddit_1pf0l1t` (Sentiment: `0.5624`).
2.  **Daily Aggregation (2025-12-06)**:
    *   Post A: `0.5624`
    *   Post B: `-0.1200`
    *   Post C: `0.3300`
    *   **Day Average**: `(0.5624 - 0.12 + 0.33) / 3 = 0.257`
3.  **Model Fitting**:
    *   `X = [Day 1, Day 2, Day 3]` // `Y = [0.10, 0.15, 0.257]`
    *   *Slope* is positive -> Trend is **UP**.
4.  **Forecast Output**:
    ```json
    { "date": "2025-12-13", "predicted_sentiment": 0.35, "confidence": "High" }
    ```

---

## 3. Machine Learning & AI Usage (Deep Dive)

The project employs a **Hybrid AI Strategy** combining local lightweight models with powerful cloud-based inference.

### A. The AI Client (`scripts/utils/ai_client.py`)
This is the brain of the operation. It manages model loading, inference, and fallback logic.

#### 1. Zero-Shot Classification (Cloud API)
*   **Model**: `facebook/bart-large-mnli` (via Hugging Face Inference API).
*   **Technique**: Zero-Shot Learning.
*   **Usage**: 
    -   **Relevance**: The model is asked "Is this text about agriculture?". It outputs a probability score.
    -   **Topic Modeling**: The model classifies text into candidate labels: `["Market Prices", "Weather", "Pests & Disease", "Farming Technology", "Government Policy"]` without needing specific training on these categories.

#### 2. Sentiment Analysis (Hybrid Local/Cloud)
*   **Primary Model (Local)**: A distilled BERT model (e.g., `distilbert-base-multilingual-cased-sentiments-student`) stored in `models/sentiment-model`.
*   **Fallback**: If the local model is missing, it dynamically downloads from Hugging Face.
*   **Logic**:
    -   Input: Text chunk (< 512 tokens).
    -   Output: Label (Positive/Negative/Neutral) and Confidence Score.
    -   **Thresholding**: A custom threshold (`0.2`) acts as a noise gate. Weak sentiments are forced to "Neutral" to prevent false signals.

#### 3. Keyword Extraction (Rule-Based)
*   **Technique**: Pattern matching against a domain-specific dictionary (`scripts/utils/agri_keywords.py`).
*   **Logic**: Scans text for high-value terms (e.g., "Drought", "Harvest", "Subsidy") and Hashtags.

---

## 4. File-by-File Technical Guide

### Backend (`scripts/`)
| File | Responsibility | Key Functions |
| :--- | :--- | :--- |
| `agri_pipeline.py` | **Orchestrator**. The main entry point. Fetches data, runs enrichment loops, and triggers forecasting. | `fetch_all()`, `enrich_data()`, `forecast_trends()` |
| `utils/ai_client.py` | **Intelligence**. Wraps all ML operations. Handles API calls to Hugging Face and local model inference. | `analyze(text)`, `_query()` |
| `utils/world_bank.py` | **Data Connector**. Interface for the World Bank Open Data API. | `fetch_all_stats()`, `get_indicator()` |
| `utils/agri_keywords.py` | **Knowledge Base**. Static lists of agricultural terms and hashtags used for search and extraction. | `ALL_KEYWORDS`, `HASHTAGS` |
| `utils/logger.py` | **Observability**. Standardized logging for pipeline tracking. | `start_run()`, `log_step()` |

### Frontend (`src/`)
| File | Responsibility |
| :--- | :--- |
| `src/app/page.tsx` | **Dashboard Controller**. Aggregates data from APIs and renders the main view. |
| `src/app/api/` | **Data Access Layer**. Exposes MongoDB data to the frontend via secure REST endpoints. |

---

## 5. Functional Features

### 1. Global Market Monitor
Visualize agricultural health across India, Japan, and the Philippines with real-time currency conversion and localized commodity price estimation.

### 2. Early Warning System
By tracking the **Derivative of Sentiment** (rate of change in sentiment), the system can flag potential crises (e.g., a sudden spike in "Weather" negativity indicating crop failure) before official reports isssue.

### 3. Predictive Trend Analysis
The linear regression visualizer shows not just where the market *is*, but where public perception is *heading*, allowing for proactive decision-making.
