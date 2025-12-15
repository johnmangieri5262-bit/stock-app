from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class PortfolioItemBase(BaseModel):
    symbol: str
    asset_type: str = "STOCK"
    quantity: float = 1.0

class PortfolioItemCreate(PortfolioItemBase):
    pass

class PortfolioItem(PortfolioItemBase):
    id: int
    portfolio_id: int
    initial_price: float
    current_price: float = 0.0

    class Config:
        orm_mode = True

class PortfolioBase(BaseModel):
    name: str

class PortfolioCreate(PortfolioBase):
    items: List[PortfolioItemCreate]
    competition_id: int

class Competition(BaseModel):
    id: int
    name: str
    slug: str
    entry_deadline: Optional[datetime]

    class Config:
        orm_mode = True

class UserPublic(BaseModel):
    id: int
    username: Optional[str] = None
    
    class Config:
        orm_mode = True

class Portfolio(PortfolioBase):
    id: int
    owner_id: int
    competition_id: Optional[int]
    created_at: datetime
    total_value: float
    total_return_percent: float
    items: List[PortfolioItem]
    competition: Optional[Competition]
    owner: Optional[UserPublic]

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    username: str
    password: str

class UserLogin(UserBase):
    password: str

class User(UserBase):
    id: int
    username: Optional[str] = None
    is_active: bool
    portfolios: List[Portfolio] = []

    class Config:
        orm_mode = True
