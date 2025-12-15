from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, PortfolioItem

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

items = db.query(PortfolioItem).filter(PortfolioItem.symbol == "APPL").all()
print(f"Found {len(items)} items with symbol 'APPL'. Fixing...")

for item in items:
    print(f"Fixing item {item.id}...")
    item.symbol = "AAPL"
    # We can also reset the price to force a fresh fetch if we want, 
    # but the next refresh will handle it if the symbol is correct.
    # Let's reset to 0 to be sure it looks 'unfetched' or just leave it.
    # Leaving it is fine, update_portfolio_values uses the symbol.

db.commit()
print("Fix complete.")
db.close()
