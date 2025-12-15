from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, PortfolioItem, Portfolio

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

items = db.query(PortfolioItem).all()
print(f"Found {len(items)} items:")
for item in items:
    print(f"ID: {item.id}, Symbol: '{item.symbol}', Initial: {item.initial_price}, Current: {item.current_price}")

db.close()
