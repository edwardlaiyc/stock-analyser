from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import sqlite3
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect('stocks.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS stocks (symbol TEXT, name TEXT)''')
    
    c.execute('SELECT count(*) FROM stocks')
    count = c.fetchone()[0]
    
    if count == 0:
        print("Database empty. Loading from stocks.json...")
        
        if os.path.exists("stocks.json"):
            with open("stocks.json", "r") as f:
                stock_list = json.load(f)
                
            c.executemany('INSERT INTO stocks VALUES (?,?)', stock_list)
            conn.commit()
            print(f"Successfully added {len(stock_list)} stocks!")
        else:
            print("Error: stocks.json file not found!")
            
    else:
        print(f"Database ready. Contains {count} stocks.")
        
    conn.close()

init_db()

@app.get("/search")
def search_stocks(q: str):
    if not q:
        return []
    conn = sqlite3.connect('stocks.db')
    c = conn.cursor()
    
    query = q.upper()
    c.execute("SELECT symbol, name FROM stocks WHERE symbol LIKE ? || '%' LIMIT 10", (query,))
    results = [{"value": row[0], "label": f"{row[0]} - {row[1]}"} for row in c.fetchall()]
    conn.close()
    return results

@app.get("/quote")
def get_quote(symbol: str):
    try:
        stock = yf.Ticker(symbol)
        price = stock.fast_info['last_price']
        return {"symbol": symbol.upper(), "price": round(price, 2)}
    except Exception as e:
        print("Error fetching data:", e)
        return {"error": "Stock not found"}

@app.get("/history")
def get_history(symbol: str, period: str = "1mo"):
    try:
        stock = yf.Ticker(symbol)
        
        hist = stock.history(period=period)
        
        data = []
        for date, row in hist.iterrows():
            data.append({
                "date": date.strftime('%Y-%m-%d'),
                "price": round(row['Close'], 2)
            })
            
        return data
    except Exception as e:
        print("Error fetching history:", e)
        return []