from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Portfolio, PortfolioItem
import yfinance as yf

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

items = db.query(PortfolioItem).filter(PortfolioItem.initial_price == 100.0).all()
print(f"Found {len(items)} items with default initial price ($100). Fixing...")

for item in items:
    print(f"Fixing item {item.id} ({item.symbol})...")
    
    # Try to get a real price
    real_price = None
    try:
        ticker = yf.Ticker(item.symbol)
        real_price = ticker.fast_info.last_price
        if real_price is None:
             hist = ticker.history(period="1d")
             if not hist.empty:
                 real_price = hist['Close'].iloc[-1]
    except Exception as e:
        print(f"  Error fetching price: {e}")

    if real_price and real_price != 100.0:
        print(f"  Updating initial_price from $100.0 to ${real_price}")
        item.initial_price = real_price
        # Also update current price if it's still 100
        if item.current_price == 100.0:
            item.current_price = real_price
    else:
        print("  Could not verify real price, skipping.")

db.commit()

# Now recalculate portfolio totals
portfolios = db.query(Portfolio).all()
for p in portfolios:
    initial_total = 0.0
    current_total = 0.0
    for i in p.items:
        initial_total += i.initial_price * i.quantity
        current_total += i.current_price * i.quantity
    
    if initial_total > 0:
        p.total_return_percent = ((current_total - initial_total) / initial_total) * 100
    else:
        p.total_return_percent = 0.0
        
    print(f"Portfolio {p.id} updated: Return = {p.total_return_percent:.2f}%")

db.commit()
print("Fix complete.")
db.close()
