from database import SessionLocal, engine
from sqlalchemy import text
import models

def wipe_users():
    db = SessionLocal()
    try:
        # Check if tables exist first
        # We'll just execute raw SQL for simplicity to avoid import issues or circular deps if any
        # though using models is better? No, raw sql is fine for cleanup.
        
        # Order matters due to Foreign Keys
        print("Deleting Portfolio Items...")
        db.execute(text("DELETE FROM portfolio_items"))
        
        print("Deleting Portfolios...")
        db.execute(text("DELETE FROM portfolios"))
        
        print("Deleting Users...")
        db.execute(text("DELETE FROM users"))
        
        db.commit()
        print("Successfully wiped all users and portfolios.")
        print("Competitions were preserved.")
    except Exception as e:
        print(f"Error wiping data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    wipe_users()
