import pandas as pd
import json
import requests
import io

def ingest_wiki():
    print("Scraping Wikipedia for S&P 500 list...")
    
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() 

        file_like_object = io.StringIO(response.text)
        tables = pd.read_html(file_like_object)
        sp500_table = tables[0]
        
        raw_data = sp500_table[['Symbol', 'Security']].values.tolist()
        
        formatted_data = []
        for row in raw_data:
            symbol = row[0]
            name = row[1]
            
            symbol = symbol.replace('.', '-')
            
            formatted_data.append([symbol, name])
            
        with open("stocks.json", "w") as f:
            json.dump(formatted_data, f)
            
        print(f"Success! Scraped {len(formatted_data)} companies from Wikipedia.")
        print("Sample:", formatted_data[:3])
        
    except Exception as e:
        print(f"Error scraping Wikipedia: {e}")

if __name__ == "__main__":
    ingest_wiki()