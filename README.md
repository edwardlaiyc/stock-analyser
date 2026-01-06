# Stock Analysis Dashboard

A full-stack stock analysis platform that combines real-time stock data with Generative AI to provide instant investment insights.

## Live Demo
**[Click here to view the Live Dashboard](https://edward-stock-analyser.vercel.app)** *(Note: The backend is hosted on Render's free tier. It may take 30-50 seconds to wake up on the first load.)*

## Tech Stack
* **Frontend:** React, Vite, Mantine UI, Recharts
* **Backend:** Python, FastAPI, SQLite
* **AI Engine:** Google Gemini 2.5 Flash
* **Data Sources:** yfinance, Wikipedia (scraping of stock tickers)
* **Deployment:** Vercel (Frontend) + Render (Backend)

## Key Features
* **AI Analyst:** Automatically generates qualitative analysis (Moat, Risks, Catalysts) using LLMs.
* **Smart Caching:** SQLite database caches AI responses to minimize API costs and latency.
* **Self-Healing Data:** Automatically scrapes Wikipedia for S&P 500 tickers if the database is empty.
* **Financial Visuals:** Interactive charts for Revenue, Free Cash Flow, and EPS history.

## 📄 License
MIT License