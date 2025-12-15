from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import users, portfolios, stocks, competitions

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed Competitions
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from datetime import datetime

db: Session = SessionLocal()
if not db.query(models.Competition).first():
    print("Seeding competitions...")
    # Deadline: Jan 1st, 2026
    deadline = datetime(2026, 1, 1)
    db.add(models.Competition(name="Q1 2026 Competition", slug="q1-2026", entry_deadline=deadline))
    db.add(models.Competition(name="2026 Full Year Competition", slug="2026-full", entry_deadline=deadline))
    db.commit()
db.close()

app = FastAPI(title="Stock Picking Competition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(portfolios.router)
app.include_router(stocks.router)
app.include_router(competitions.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Stock Picking Competition API"}
