import yfinance as yf

try:
    print("Fetching AAPL...")
    ticker = yf.Ticker("AAPL")
    
    print("Attempting fast_info.last_price...")
    price = ticker.fast_info.last_price
    print(f"fast_info.last_price: {price}")

    print("Attempting history(period='1d')...")
    hist = ticker.history(period="1d")
    if not hist.empty:
        print(f"History Close: {hist['Close'].iloc[-1]}")
    else:
        print("History is empty")

except Exception as e:
    print(f"Error: {e}")
