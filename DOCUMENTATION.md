# Agri-Trend Analytics Platform: A Context-Aware Agricultural Market Intelligence System

## Table of Contents
1. [Abstract](#abstract)
2. [Background](#background)
3. [Research Context](#research-context)
4. [Problem Statement](#problem-statement)
5. [Proposed Solution](#proposed-solution)
6. [Project Structure](#project-structure)
7. [System Architecture & Workflow](#system-architecture--workflow)
8. [Detailed Implementation Guide](#detailed-implementation-guide)
9. [Functional Features](#functional-features)
10. [Future Scope](#future-scope)

---

## Abstract
The agricultural sector is inherently volatile, subject to rapid fluctuations driven by weather anomalies, geopolitical shifts, and policy changes. Traditional market analysis often relies on lagging quantitative indicators, failing to capture the real-time "pulse" of the farming community. This project, the **Agri-Trend Analytics Platform**, presents a novel approach to market intelligence by fusing quantitative financial data (Global Futures, Exchange Rates) with qualitative social signals (Social Media, News, Video Content). Utilizing advanced Natural Language Processing (NLP) techniques—specifically Zero-Shot Classification and Sentiment Analysis—the system decodes unstructured discourse to predict market sentiment trends. The result is a unified dashboard that empowers stakeholders with real-time holistic insights, bridging the gap between global market prices and ground-level reality.

---

## Background
Agriculture remains the backbone of many developing economies, contributing significantly to GDP (e.g., ~16% in India) and employment. However, the sector is plagued by **information asymmetry**. While institutional traders have access to Bloomberg terminals and satellite data, local farmers and policymakers often rely on delayed reports or anecdotal evidence.

In recent years, the "financialization" of agriculture has meant that a drought in Brazil can spike Soybean prices in Southeast Asia within hours. Simultaneously, social media has become a town square where early warnings of pest attacks, fertilizer shortages, or unrest are first broadcast. Ignoring these digital signals results in an incomplete picture of market health.

---

## Research Context
Existing literature in *Computational Social Science* and *Agri-Economics* highlights two distinct silos:
1.  **Econometric Models**: Use historical price/volume data to forecast futures (ARIMA, LSTM). These fail during "Black Swan" events like policy bans or sudden weather shocks.
2.  **Sentiment Analysis**: Used primarily in stock trading (e.g., predicting Tesla stock from Tweets). Its application in agriculture is nascent but promising, as proven by studies linking query volumes (Google Trends) to commodity prices.

This project sits at the intersection of these fields, treating "Farmer Sentiment" as a leading indicator for "Market Health".

---

## Problem Statement
**"The Disconnect between Market Prices and Ground Reality."**

Stakeholders currently face three critical challenges:
1.  **Latency**: Official agricultural reports are often weeks old by the time they are published.
2.  **Noise**: The internet is flooded with unstructured data; distinguishing a relevant post about "Wheat Rust" from a video game discussion is difficult.
3.  **Fragmentation**: Price data sits in financial portals (Yahoo Finance), while sentiment data sits in social silos (Reddit, YouTube), making correlation impossible.

There is no unified system that answers: *"Prices are up, but are farmers actually happy, or is this a panic spike?"*

---

## Proposed Solution
We propose an **Integrated Market Intelligence System** that automates the ETL (Extract, Transform, Load) process for agricultural data.

**Key Innovations:**
*   **Hybrid Data Ingestion**: Simultaneously polls Live Futures (Quantitative) and Social Feeds (Qualitative).
*   **AI-Driven Context Awareness**: dynamic filtering of noise using Zero-Shot Classification ensuring only relevant agricultural discourse is analyzed.
*   **Real-Time Localization**: Auto-converts global benchmarks (e.g., Chicago Board of Trade Wheat Prices) into local currency and units (e.g., INR/Quintal) for actionable local context.
*   **Predictive Dashboard**: A Next.js-based visualization layer that maps sentiment trends against price movements.

---

## Project Structure
The repository is organized into a clear separation of concerns: Frontend (Visualization) and Backend (Data Pipeline).

```text
Trend/
├── .env.local                  # Environment variables (API Keys)
├── DOCUMENTATION.md            # This System Design Document
├── package.json                # Frontend Dependencies (Next.js, Tailwind, Recharts)
├── scripts/                    # [BACKEND] Python ETL & AI Pipeline
│   ├── agri_pipeline.py        # Main Orchestrator (Data Fetch -> AI -> DB)
│   ├── download_model.py       # Helper to setup local AI models
│   └── utils/
│       ├── ai_client.py        # Wrapper for Hugging Face & Scikit-Learn
│       ├── world_bank.py       # Connector for Economic Data
│       ├── agri_keywords.py    # Domain Dictionary
│       └── logger.py           # Pipeline Observability
└── src/                        # [FRONTEND] React Application
    ├── app/                    # Next.js App Router (Pages & API Routes)
    │   ├── api/                # Internal REST endpoints
    │   └── page.tsx            # Main Dashboard Controller
    ├── components/             # Reusable UI Widgets
    │   ├── GlobalMap.tsx       # D3.js Geo-Visualization
    │   ├── StatCard.tsx        # KPI Display
    │   └── ...
    └── lib/                    # Shared Utilities (MongoDB Connection)
```

---

## System Architecture & Workflow

The system follows a linear **ETLA (Extract - Transform - Load - Analyze)** pipeline.

### Step 1: Extraction (Data Ingestion)
The `fetch_all()` function in `agri_pipeline.py` triggers concurrent collectors:
*   **Financials**: Queries `yfinance` for realtime tickers:
    *   *Commodities*: Rough Rice (`ZR=F`), Wheat (`ZW=F`), Corn (`ZC=F`), Soybean (`ZS=F`).
    *   *Forex*: `INR=X`, `JPY=X`, `PHP=X`.
*   **Social Web**:
    *   *Reddit*: Scrapes `r/farming`, `r/agriculture` using JSON endpoints.
    *   *YouTube*: Scrapes search results for query "harvest forecast".
    *   *News*: Parses Google News RSS feeds.
*   **Macro-Economics**: Pulls GDP and Arable Land stats from the World Bank API.

### Step 2: Transformation (Normalization)
Raw data is cleaned to ensure consistency:
*   **Text Cleaning**: Regex removal of URLs and non-ASCII characters.
*   **Unit Conversion**: 
    *   *Input*: Wheat (USD/Bushel).
    *   *Process*: `(Price / 27.21kg) * ExchangeRate * LocalPremium`.
    *   *Output*: Wheat (INR/Quintal) or (JPY/Ton).

### Step 3: Intelligence (AI Enrichment)
Handled by `utils/ai_client.py`, passing content through two models:
1.  **Relevance Filter (Zero-Shot)**:
    *   *Model*: `facebook/bart-large-mnli`
    *   *Task*: Classify text as "Agriculture" or "Noise".
    *   *Decision*: If Score < 0.5, discard.
2.  **Sentiment & Topic Analysis**:
    *   *Model*: `distilbert-base-multilingual-cased-sentiments-student`
    *   *Task*: Assign Sentiment (-1 to +1) and Topic (e.g., "Policy", "Weather").

### Step 4: Loading (Storage)
Enriched data is upserted into **MongoDB** collections:
*   `posts`: Individual pieces of content with sentiment scores.
*   `country_stats`: Aggregated economic and price snapshots.
*   `forecasts`: Predicted trend vectors.

### Step 5: Visualization (Frontend)
The Next.js application polls the MongoDB database via internal APIs (`src/app/api/`) to render:
*   **Global Map**: Color-coded by country sentiment.
*   **News Ticker**: Scrolling feed of latest high-relevance posts.
*   **Word Cloud**: Most frequent entities (e.g., "Drought", "MSP").

---

## Detailed Implementation Guide

### A. The Python Pipeline (`scripts/`)
This is the core engine. It is designed to be run as a CRON job or scheduled task.
1.  **`fetch_all`**: The entry point. It orchestrates the gathering of data. It ensures that even if one source (e.g., Reddit) fails, others (Prices, Weather) continue to update.
2.  **`enrich_data`**: A distinct phase that can be run on a separate GPU worker. It iterates over "raw" posts in the DB and stamps them with AI metadata.
3.  **`forecast_trends`**: Uses **Linear Regression**. It groups sentiment by date, calculates the slope of the trend line, and projects 7 days into the future.

### B. The User Interface (`src/`)
Built with **Next.js 15 (App Router)** and **Tailwind CSS**.
*   **`GlobalMap.tsx`**: Uses `react-simple-maps` and `d3-scale`. It visually represents the "mood" of a nation—Green for positive sentiment, Red for negative.
*   **`LiveHeader.tsx`**: Displays real-time context (Time, Weather) to ground the user in the "now".
*   **`InfluencerTable.tsx`**: Identifies key opinion leaders by aggregating engagement metrics (upvotes, comments) per author.

---

## Functional Features

### 1. Real-Time Price Engine
Unlike static dashboards, this system calculates prices on the fly. It knows that 1 Bushel of Wheat = 27.2 kg and applies dynamic logic:
> `Local Price = Global Futures Price × USD Conversion × Local Market Premium`

### 2. Sentiment "Noise Gate"
The AI doesn't just accept every prediction. A thresholding logic (`confidence > 0.2`) forces weak predictions to "Neutral". This prevents the dashboard from being jumpy or reactive to ambiguous text.

### 3. Topic Modeling
The system automatically categorizes chaos into order. A thousand tweets are distilled into buckets: "40% talking about Weather", "30% talking about Prices", "20% talking about Government Policy".

---

## Future Scope

1.  **Multimodal Analysis**: Integrating Satellite Imagery (NDVI) to correlate "Brown pixels" (vegetation stress) with "Negative Tweets".
2.  **LLM Integration**: Replacing the Zero-Shot classifier with a fine-tuned LLaMA model for "Chat with Data" capabilities (e.g., "Ask the dashboard: Why is rice expensive today?").
3.  **WhatsApp Integration**: Sending low-bandwidth SMS/WhatsApp alerts to farmers in remote areas based on the dashboard's findings.

---
