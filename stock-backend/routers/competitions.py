from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import crud, models, schemas, database

router = APIRouter()

@router.get("/competitions/", response_model=List[schemas.Competition])
def read_competitions(db: Session = Depends(database.get_db)):
    return crud.get_competitions(db)

@router.get("/competitions/{competition_id}/leaderboard", response_model=List[schemas.Portfolio])
def get_leaderboard(competition_id: int, db: Session = Depends(database.get_db)):
    return crud.get_competition_leaderboard(db, competition_id)
