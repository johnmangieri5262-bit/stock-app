from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Portfolio
from crud import update_portfolio_values

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

portfolios = db.query(Portfolio).all()
print(f"Found {len(portfolios)} portfolios. Force updating all...")

for p in portfolios:
    print(f"Updating portfolio {p.id} ({p.name})...")
    updated_p = update_portfolio_values(db, p.id)
    if updated_p:
        for item in updated_p.items:
            print(f"  - {item.symbol}: ${item.current_price}")

db.close()
print("Force update complete.")
