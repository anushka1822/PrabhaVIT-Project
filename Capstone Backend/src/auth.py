# src/auth.py
import os
from jose import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
ALGORITHM = os.getenv("ALGORITHM", "HS256")
# Use a strong secret key in production
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_jwt_token(data: dict) -> str:
    """Create a JWT token."""
    return jwt.encode(data, JWT_SECRET, algorithm=ALGORITHM)


def decode_jwt_token(token: str) -> dict:
    """Decode a JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.JWTError:
        return None
