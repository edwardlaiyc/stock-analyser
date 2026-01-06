from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import sqlite3
from google import genai
import json
import os
import math
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
GENAI_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect('stocks.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS stocks (symbol TEXT, name TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS ai_cache (symbol TEXT PRIMARY KEY, data TEXT, timestamp DATETIME)''')
    conn.commit()
    conn.close()

init_db()

def get_cached_analysis(symbol):
    with sqlite3.connect('stocks.db') as conn:
        c = conn.cursor()
        c.execute("SELECT data, timestamp FROM ai_cache WHERE symbol = ?", (symbol,))
        row = c.fetchone()

    if row:
        cached_data, timestamp_str = row
        saved_time = datetime.fromisoformat(timestamp_str)
        if datetime.now() - saved_time < timedelta(days=7):
            print(f"Found in cache: Loading {symbol} from database.")
            return json.loads(cached_data)
    
    print(f"Not found in cache: {symbol} needs fresh AI analysis.")
    return None

def save_cached_analysis(symbol, data):
    with sqlite3.connect('stocks.db') as conn:
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO ai_cache (symbol, data, timestamp) VALUES (?, ?, ?)", 
                  (symbol, json.dumps(data), datetime.now().isoformat()))
        conn.commit()

def get_ai_analysis(symbol, info, news):
    cached_result = get_cached_analysis(symbol)
    if cached_result:
        return cached_result

    if not GENAI_KEY:
        return {
            "moat": "Error: API Key is missing in .env file",
            "catalysts": ["System Config Error"],
            "risks": ["System Config Error"]
        }

    news_text = ""
    if news:
        headlines = [f"- {n.get('title', 'Unknown Story')}" for n in news[:5]]
        news_text = "\n".join(headlines)
    
    prompt = f"""
    Act as a senior financial analyst. Analyze {symbol} based on this data:
    [FINANCIALS] Margins: {info.get('profitMargins', 0)*100:.1f}%, ROE: {info.get('returnOnEquity', 0)*100:.1f}%, PEG: {info.get('pegRatio', 'N/A')}, P/E: {info.get('trailingPE', 'N/A')}
    [NEWS] {news_text}
    [SUMMARY] {info.get('longBusinessSummary', '')[:800]}...
    
    TASK: Provide JSON with keys: "moat" (String, max 2 sentences), "catalysts" (List of strings), "risks" (List of strings).
    """
    
    try:
        client = genai.Client(api_key=GENAI_KEY)
        response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        analysis_json = json.loads(clean_text)

        save_cached_analysis(symbol, analysis_json)
        return analysis_json
    
    except Exception as e:
        print(f"CRITICAL AI ERROR: {e}")
        return {"moat": "Analysis Unavailable", "catalysts": [], "risks": []}

@app.get("/search")
def search_stocks(q: str):
    if not q: return []
    with sqlite3.connect('stocks.db') as conn:
        c = conn.cursor()
        query = f"%{q.upper()}%"
        c.execute("SELECT symbol, name FROM stocks WHERE symbol LIKE ? OR UPPER(name) LIKE ? LIMIT 10", (query, query))
        return [{"value": row[0], "label": f"{row[0]} - {row[1]}"} for row in c.fetchall()]

@app.get("/quote")
def get_quote(symbol: str):
    try:
        price = yf.Ticker(symbol).fast_info.last_price
        return {"symbol": symbol.upper(), "price": round(price, 2)}
    except:
        return {"symbol": symbol.upper(), "price": 0.00}

@app.get("/history")
def get_history(symbol: str, period: str = "1mo"):
    try:
        hist = yf.Ticker(symbol).history(period=period)
        return [{"date": date.strftime('%Y-%m-%d'), "price": round(row['Close'], 2)} 
                for date, row in hist.iterrows()]
    except:
        return []

@app.get("/fundamentals")
def get_fundamentals(symbol: str):
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        return {
            "symbol": symbol,
            "summary": info.get('longBusinessSummary', 'No summary available.'),
            "analysis": get_ai_analysis(symbol, info, stock.news if stock.news else []), 
            "metrics": {
                "pegRatio": info.get('pegRatio'),
                "trailingPE": info.get('trailingPE'),
                "profitMargins": info.get('profitMargins'),
                "returnOnEquity": info.get('returnOnEquity'),
            }
        }
    except Exception as e:
        print("Error:", e)
        return {"error": "Stock not found"}

@app.get("/financials")
def get_financials(symbol: str):
    try:
        stock = yf.Ticker(symbol)
        cf, income, balance = stock.cashflow, stock.income_stmt, stock.balance_sheet
        
        def extract_data(df, row_name):
            data = []
            if df is not None and not df.empty and row_name in df.index:
                row = df.loc[row_name]
                for date, value in row.items():
                    if value is not None and not math.isnan(value):
                        data.append({"year": date.strftime('%Y'), "value": float(value)})
                data.reverse()
            return data

        fcf_data = []
        if cf is not None and not cf.empty:
            if "Free Cash Flow" in cf.index:
                fcf_data = extract_data(cf, "Free Cash Flow")
            elif "Operating Cash Flow" in cf.index and "Capital Expenditure" in cf.index:
                try:
                    fcf_series = cf.loc["Operating Cash Flow"].fillna(0) + cf.loc["Capital Expenditure"].fillna(0)
                    for date, value in fcf_series.items():
                        if not math.isnan(value):
                            fcf_data.append({"year": date.strftime('%Y'), "value": float(value)})
                    fcf_data.reverse()
                except: pass

        shares_data = []
        for key in ["Basic Average Shares", "Share Issued", "Ordinary Shares Number"]:
            if income is not None and key in income.index:
                shares_data = extract_data(income, key); break
            if balance is not None and key in balance.index:
                shares_data = extract_data(balance, key); break

        return {
            "fcf": fcf_data, 
            "revenue": extract_data(income, "Total Revenue"), 
            "eps": extract_data(income, "Diluted EPS"), 
            "shares": shares_data
        }

    except Exception as e:
        print(f"Financials Error: {e}")
        return {"fcf": [], "revenue": [], "eps": [], "shares": []}