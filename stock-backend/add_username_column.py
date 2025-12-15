import sqlite3

# Connect to the SQLite database
# Adjust path if running from different location
try:
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()

    # Attempt to add the username column
    print("Attempting to add 'username' column to 'users' table...")
    cursor.execute("ALTER TABLE users ADD COLUMN username VARCHAR")
    print("Column 'username' added successfully.")
    
    conn.commit()
    conn.close()
except sqlite3.OperationalError as e:
    # Error thrown if column likely already exists
    print(f"Operation failed (column might already exist): {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
