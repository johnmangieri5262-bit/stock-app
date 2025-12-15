from fastapi import APIRouter, HTTPException
import yfinance as yf

router = APIRouter()

@router.get("/stocks/search")
def search_stocks(query: str):
    # yfinance doesn't have a good search API efficiently exposed without extra libraries or scraping.
    # For a simple competition, we might want to restrict to a top list or just let users try tickers.
    # However, we can use `yf.Ticker(query).info` to check validity.
    # A better approach for "search" might be to just validate a ticker.
    
    # Let's assume the user knows the ticker or we give them a common list.
    # We can provide a basic validation endpoint.
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    try:
        ticker = yf.Ticker(query)
        # Getting info triggers a fetch
        info = ticker.info
        if 'symbol' in info:
           return {"symbol": info['symbol'], "name": info.get('longName', info.get('shortName', 'Unknown')), "price": info.get('currentPrice', info.get('regularMarketPreviousClose', 0.0))}
        else:
           raise HTTPException(status_code=404, detail="Ticker not found")
    except Exception as e:
        # yfinance can be verbose on errors
        print(f"Error fetching ticker {query}: {e}")
        raise HTTPException(status_code=404, detail="Ticker not found or invalid")

@router.get("/stocks/price/{symbol}")
def get_stock_price(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        # fast_info is faster for just price
        price = ticker.fast_info.last_price
        previous_close = ticker.fast_info.previous_close
        
        change_percent = 0.0
        if previous_close:
            change_percent = ((price - previous_close) / previous_close) * 100
            
        return {
            "symbol": symbol, 
            "price": price, 
            "change_percent": change_percent
        }
    except Exception as e:
         print(f"Error fetching price for {symbol}: {e}")
         raise HTTPException(status_code=404, detail="Price not found")
