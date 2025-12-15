from utils import get_password_hash, verify_password
import sys

try:
    print("Hashing...")
    h = get_password_hash("password123")
    print(f"Hash: {h}")
    print("Verifying...")
    v = verify_password("password123", h)
    print(f"Verify: {v}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
