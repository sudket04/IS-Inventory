"""Server-side password hashing for dbo.app_users.

index.html currently hashes passwords with SHA-256 in the browser before
they're ever sent anywhere — fine as a "don't keep plaintext lying around in
this client-only prototype" gesture, but not a real password hash (no salt,
fast to brute-force). Once the backend owns the users table, hashing moves
here: bcrypt, salted, done server-side, and the plaintext password never
needs to touch storage at all.
"""
import bcrypt


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False  # hashed isn't a valid bcrypt hash (e.g. still the old client-side sha256 value)
