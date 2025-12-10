# Agri-Trend Dashboard Documentation

## 1. Project Overview
**Agri-Trend Dashboard** is a comprehensive full-stack application designed to monitor, analyze, and forecast agricultural trends. It combines real-time data fetching, AI-powered sentiment analysis, and interactive visualizations to provide actionable insights into global agricultural markets.

## 2. System Architecture
The project follows a hybrid architecture integrating a modern web frontend with a powerful data processing backend.

### High-Level Architecture
- **Frontend**: Next.js (React) App Router for the user interface.
- **Backend/Data Pipeline**: Python scripts for data ingestion, processing, and AI analysis.
- **Database**: MongoDB for storing posts, country stats, and forecasts.
- **AI/ML**: 
    - **Sentiment Analysis**: Custom AI client (likely LLM-based) and `sentiment` library.
    - **Forecasting**: Scikit-Learn (Linear Regression) for trend prediction.

## 3. Project Structure
```
Trend/
├── .env.local              # Environment variables
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── api/            # API endpoints (bridging DB to Frontend)
│   │   ├── page.tsx        # Main Dashboard Landing Page
│   ├── components/         # Reusable React components (Charts, Maps, Cards)
│   ├── models/             # Mongoose/TypeScript Data Models
│   └── lib/                # Shared utilities
├── scripts/                # Python Data Pipeline
│   ├── agri_pipeline.py    # Main orchestration script
│   ├── mass_ingester.py    # Bulk data ingestion
│   ├── utils/              # Python helpers (AI client, Logger)
│   └── ...                 # Various utility scripts
├── models/                 # Database schema definitions (Git-ignored)
├── public/                 # Static assets
└── package.json            # Node.js dependencies
```

## 4. Key Workflows & Processes

### A. Data Pipeline (`scripts/agri_pipeline.py`)
The Python backend handles the heavy lifting of data operations. It operates in stages:

1.  **Data Fetching (`fetch_all`)**
    *   **Exchange Rates**: Real-time currency conversion (USD to INR, JPY, PHP).
    *   **World Bank Stats**: Fetches GDP, employment, and arable land data.
    *   **Local Prices**: Simulates local market prices based on global commodity trends (from Yahoo Finance) + local volatility.
    *   **Social Data**: Scrapes Reddit queries related to agricultural keywords.

2.  **Data Enrichment (`enrich_data`)**
    *   Processes raw Reddit posts.
    *   Uses `AgriAIClient` to perform sentiment analysis and relevance scoring.
    *   Filters out irrelevant content.

3.  **Forecasting (`forecast_trends`)**
    *   Aggregates sentiment scores by date.
    *   Uses Linear Regression (`sklearn`) to predict future sentiment trends for the next 7 days.
    *   Stores results in the `forecasts` collection.

### B. Frontend Integration
The Next.js frontend visualizes the processed data.
*   **Data Fetching**: `src/app/page.tsx` calls internal API routes:
    *   `/api/trends`: returns aggregations and forecasts.
    *   `/api/market-prices`: returns standardized commodity prices.
*   **Visualizations**:
    *   **Global Map**: `react-simple-maps` to show country-specific data.
    *   **Charts**: `recharts` for sentiment trends and distributions.
    *   **Word Cloud**: Visualizes high-frequency terms in discussions.

## 5. Data Models (MongoDB)

Based on the pipeline logic, the database consists of three primary collections:

1.  **`posts`**
    *   `reddit_id`: Unique ID.
    *   `content`: Post text.
    *   `timestamp`: Creation time.
    *   `analysis`: Object containing `sentiment_score` and `is_relevant`.

2.  **`country_stats`**
    *   `country`: Country Name (e.g., India, Japan).
    *   `overview`: GDP, Employment, Food Security.
    *   `market`: Inflation, CPI, and Local Prices list.

3.  **`forecasts`**
    *   `date`: Future date.
    *   `sentiment`: Predicted score.
    *   `model`: Model used (e.g., "Linear Regression").

## 6. Setup & Installation

### Prerequisites
*   **Node.js** (v18+)
*   **Python** (v3.9+)
*   **MongoDB** (Local or Atlas)

### Installation Steps

1.  **Clone the Repository**
    ```bash
    git clone <repo-url>
    cd Trend
    ```

2.  **Install Frontend Dependencies**
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies**
    ```bash
    pip install -r requirements.txt (or manually install pandas, pymongo, requests, yfinance, sklearn, python-dotenv)
    ```

4.  **Environment Configuration**
    Create `.env.local` with:
    ```env
    MONGODB_URI=mongodb://localhost:27017/agri_trend_dashboard
    # Add other API keys if needed
    ```

5.  **Run the Data Pipeline**
    Populate the database before starting the UI:
    ```bash
    python scripts/agri_pipeline.py fetch
    python scripts/agri_pipeline.py process
    ```

6.  **Start the Application**
    ```bash
    npm run dev
    ```
    Access the dashboard at `http://localhost:3000`.

## 7. Operational Commands
*   **Fetch Data**: `python scripts/agri_pipeline.py fetch`
*   **Process AI & Forecast**: `python scripts/agri_pipeline.py process`
*   **Check DB Info**: `python scripts/agri_pipeline.py info`
