import sqlite3

# Connect to the SQLite database
try:
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()

    print("Attempting to add verification columns...")
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0")
        print("Column 'is_verified' added.")
    except sqlite3.OperationalError:
        print("Column 'is_verified' likely exists.")

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN verification_token VARCHAR")
        print("Column 'verification_token' added.")
    except sqlite3.OperationalError:
        print("Column 'verification_token' likely exists.")
    
    conn.commit()
    conn.close()
    print("Migration complete.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
