from database import SessionLocal
import crud
import models

db = SessionLocal()
print("Database connected.")

# Get first competition
comp = db.query(models.Competition).first()
if not comp:
    print("No competition found.")
else:
    print(f"Testing leaderboard for competition {comp.id} ({comp.name})...")
    try:
        leaderboard = crud.get_competition_leaderboard(db, comp.id)
        print(f"Success! Found {len(leaderboard)} portfolios.")
        for p in leaderboard:
            print(f"- {p.name}: {p.total_return_percent}%")
    except Exception as e:
        print(f"Error occurred: {e}")
        import traceback
        traceback.print_exc()

db.close()
