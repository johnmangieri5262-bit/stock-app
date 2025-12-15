from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True) # Start nullable for migration
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)

    portfolios = relationship("Portfolio", back_populates="owner")

class Competition(Base):
    __tablename__ = "competitions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    slug = Column(String, unique=True, index=True) # e.g. 'q1-2026', '2026-full'
    entry_deadline = Column(DateTime, nullable=True) # Lock-in date

    portfolios = relationship("Portfolio", back_populates="competition")

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    competition_id = Column(Integer, ForeignKey("competitions.id"), nullable=True) # Nullable for migration/legacy
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Total value snapshot (can be updated periodically)
    total_value = Column(Float, default=0.0)
    total_return_percent = Column(Float, default=0.0)

    owner = relationship("User", back_populates="portfolios")
    competition = relationship("Competition", back_populates="portfolios")
    items = relationship("PortfolioItem", back_populates="portfolio")

class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    symbol = Column(String, index=True) # e.g. AAPL, BTC-USD
    asset_type = Column(String) # STOCK, CRYPTO, ETF
    initial_price = Column(Float)
    current_price = Column(Float, default=0.0)
    quantity = Column(Float, default=1.0) # For simplicity, maybe we just track price movement of 1 unit, or allocate $1000 per asset.
    
    # Let's assume equal weight for simplicity in this competition? 
    # Or maybe the user picks 10 stocks and we track the % change of the basket.
    # Let's store initial price to calculate return.

    portfolio = relationship("Portfolio", back_populates="items")
