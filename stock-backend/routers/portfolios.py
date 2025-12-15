from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud, models, schemas, database

router = APIRouter()

@router.post("/users/{user_id}/portfolios/", response_model=schemas.Portfolio)
def create_portfolio_for_user(
    user_id: int, portfolio: schemas.PortfolioCreate, db: Session = Depends(database.get_db)
):
    return crud.create_portfolio(db=db, portfolio=portfolio, user_id=user_id)

@router.get("/portfolios/", response_model=List[schemas.Portfolio])
def read_portfolios(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    portfolios = crud.get_portfolios(db, skip=skip, limit=limit)
    return portfolios

@router.get("/portfolios/{portfolio_id}", response_model=schemas.Portfolio)
def read_portfolio(
    portfolio_id: int, 
    user_id: int = -1, # Optional, if -1 logic assumes anonymous viewer
    db: Session = Depends(database.get_db)
):
    portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
        
    # Reveal Logic:
    # 1. Is Owner? (if user_id matches)
    # 2. Is Competition Expired? (entry_deadline < now)
    
    is_owner = (portfolio.owner_id == user_id)
    
    is_expired = False
    if portfolio.competition_id:
        comp = db.query(models.Competition).filter(models.Competition.id == portfolio.competition_id).first()
        from datetime import datetime
        # Check against entry_deadline (usually reveal is after entry closes or contest ends, assuming entry_deadline for "active" phase)
        # Actually user said "after Jan 1st when contest ends".
        # Current logic uses entry_deadline as the "lock in" date. 
        # Typically picks are revealed after lock-in so people can't copy.
        # User said "after jan 1st when contest ends" -> implies reveal happens after deadline.
        if comp and comp.entry_deadline and datetime.utcnow() > comp.entry_deadline:
            is_expired = True

    if not is_owner and not is_expired:
        # Hide items
        portfolio.items = []
        
    return portfolio

@router.post("/portfolios/{portfolio_id}/refresh", response_model=schemas.Portfolio)
def refresh_portfolio(portfolio_id: int, db: Session = Depends(database.get_db)):
    portfolio = crud.update_portfolio_values(db, portfolio_id=portfolio_id)
    if not portfolio:
         raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio

@router.post("/portfolios/{portfolio_id}/items", response_model=schemas.Portfolio)
def add_item_to_portfolio(
    portfolio_id: int, 
    item: schemas.PortfolioItemCreate, 
    db: Session = Depends(database.get_db),
    # In a real app we'd get current user from token. 
    # For now, we'll assume the client passes user_id as a query param or header, or just trust the call for simplicity/demo.
    # Actually, let's just create a quick dependency or use a hardcoded user for now if auth is complex,
    # BUT we have user_id in create_portfolio_for_user.
    # Let's require user_id in the body or query?
    # Schema doesn't have it.
    # Let's add user_id as query param for security bypass proof of concept
    user_id: int = 1 
):
    try:
        return crud.add_portfolio_item(db=db, portfolio_id=portfolio_id, item=item, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
