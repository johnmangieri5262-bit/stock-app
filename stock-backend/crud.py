from sqlalchemy.orm import Session
import models, schemas
from datetime import datetime
from utils import get_password_hash

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

import secrets

def create_user(db: Session, user: schemas.UserCreate):
    fake_hashed_password = get_password_hash(user.password)
    # Generate simple token
    token = secrets.token_urlsafe(32)
    db_user = models.User(
        email=user.email, 
        username=user.username, 
        hashed_password=fake_hashed_password,
        verification_token=token,
        is_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_email(db: Session, token: str):
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        return False
    user.is_verified = True
    user.verification_token = None # consume token
    db.commit()
    return True

def create_competition(db: Session, competition: schemas.Competition):
    db_comp = models.Competition(name=competition.name, slug=competition.slug, entry_deadline=competition.entry_deadline)
    db.add(db_comp)
    db.commit()
    db.refresh(db_comp)
    return db_comp

def get_competitions(db: Session):
    return db.query(models.Competition).all()

def create_portfolio(db: Session, portfolio: schemas.PortfolioCreate, user_id: int):
    # Check entry deadline
    if portfolio.competition_id:
        comp = db.query(models.Competition).filter(models.Competition.id == portfolio.competition_id).first()
        if comp and comp.entry_deadline:
            if datetime.utcnow() > comp.entry_deadline:
                 raise ValueError("Competition entry deadline has passed.")

    db_portfolio = models.Portfolio(name=portfolio.name, owner_id=user_id, competition_id=portfolio.competition_id)
    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)
    
    initial_total_value = 0.0

    for item in portfolio.items:
        # Auto-correct common typos
        symbol = item.symbol.upper()
        if symbol == "APPL":
            symbol = "AAPL"

        # Fetch price with robust fallback
        import yfinance as yf
        current_price = 100.0 # Default fallback
        try:
             ticker = yf.Ticker(symbol)
             # Try fast_info first
             price = ticker.fast_info.last_price
             if price is not None:
                 current_price = price
             else:
                 # Try 1d history as fallback (slower but more detailed)
                 hist = ticker.history(period="1d")
                 if not hist.empty:
                     current_price = hist['Close'].iloc[-1]
        except Exception as e:
             print(f"Failed to fetch price for {item.symbol}: {e}")
             # Keep default 100.0

        db_item = models.PortfolioItem(
            portfolio_id=db_portfolio.id,
            symbol=symbol,
            asset_type=item.asset_type,
            quantity=item.quantity,
            initial_price=current_price,
            current_price=current_price
        )
        db.add(db_item)
        initial_total_value += current_price * item.quantity 
    
    db_portfolio.total_value = initial_total_value 
    # initial return is 0
    
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio

def get_portfolios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Portfolio).offset(skip).limit(limit).all()

def get_portfolio(db: Session, portfolio_id: int):
    return db.query(models.Portfolio).filter(models.Portfolio.id == portfolio_id).first()

def update_portfolio_values(db: Session, portfolio_id: int):
    import yfinance as yf
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == portfolio_id).first()
    if not portfolio:
        return None
    
    current_total_value = 0.0
    initial_total_value = 0.0
    
    for item in portfolio.items:
        # Fetch price with robust fallback
        try:
            ticker = yf.Ticker(item.symbol)
            # Try fast_info first
            current_price = ticker.fast_info.last_price
            
            if current_price is None:
                 # Try 1d history as fallback
                 hist = ticker.history(period="1d")
                 if not hist.empty:
                     current_price = hist['Close'].iloc[-1]
            
            if current_price is None:
                 raise ValueError("Price is still None after fallbacks")

        except Exception as e:
            print(f"Error updating {item.symbol}: {e}")
            # Fallback to initial price
            current_price = item.initial_price if item.initial_price is not None else 100.0
        
        # Super safe fallback
        if current_price is None:
            current_price = 100.0

        # Calculate item value
        item_value = current_price * item.quantity
        current_total_value += item_value
        initial_total_value += item.initial_price * item.quantity # Assuming quantity is 1 or fixed at purchase
        
        # Update current price in DB
        item.current_price = current_price
    
    portfolio.total_value = current_total_value
    
    if initial_total_value > 0:
        portfolio.total_return_percent = ((current_total_value - initial_total_value) / initial_total_value) * 100
    else:
        portfolio.total_return_percent = 0.0

    db.commit()
    db.refresh(portfolio)
    return portfolio

def get_competition_leaderboard(db: Session, competition_id: int, limit: int = 100):
    return db.query(models.Portfolio).filter(models.Portfolio.competition_id == competition_id)\
             .order_by(models.Portfolio.total_return_percent.desc())\
             .limit(limit).all()

def add_portfolio_item(db: Session, portfolio_id: int, item: schemas.PortfolioItemCreate, user_id: int):
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise ValueError("Portfolio not found")
    
    if portfolio.owner_id != user_id:
        raise ValueError("Not authorized to edit this portfolio")

    # Limit check
    if len(portfolio.items) >= 10:
        raise ValueError("Portfolio limit reached (max 10 items).")

    # Deadline check
    if portfolio.competition_id:
        comp = db.query(models.Competition).filter(models.Competition.id == portfolio.competition_id).first()
        if comp and comp.entry_deadline:
            if datetime.utcnow() > comp.entry_deadline:
                 raise ValueError("Competition entry deadline has passed.")

    # Auto-correct common typos
    symbol = item.symbol.upper()
    if symbol == "APPL":
        symbol = "AAPL"
        
    # Check if item already exists
    existing_item = db.query(models.PortfolioItem).filter(
        models.PortfolioItem.portfolio_id == portfolio_id,
        models.PortfolioItem.symbol == symbol
    ).first()
    
    if existing_item:
        raise ValueError(f"Asset {symbol} already exists in portfolio.")

    # Fetch price with robust fallback
    import yfinance as yf
    current_price = 100.0 # Default fallback
    try:
         ticker = yf.Ticker(symbol)
         # Try fast_info first
         price = ticker.fast_info.last_price
         if price is not None:
             current_price = price
         else:
             # Try 1d history as fallback
             hist = ticker.history(period="1d")
             if not hist.empty:
                 current_price = hist['Close'].iloc[-1]
    except Exception as e:
         print(f"Failed to fetch price for {symbol}: {e}")
         # Keep default 100.0

    db_item = models.PortfolioItem(
        portfolio_id=portfolio.id,
        symbol=symbol,
        asset_type=item.asset_type,
        quantity=item.quantity,
        initial_price=current_price,
        current_price=current_price
    )
    db.add(db_item)
    
    # Update total value immediately so it looks correct vs item sums
    portfolio.total_value += current_price * item.quantity
    
    # Note: total_return_percent will be wrong until refresh because initial_total_value (basis) 
    # isn't explicitly stored/updated here, but next refresh will calculate it from all items.
    
    db.commit()
    db.refresh(portfolio)
    return portfolio
