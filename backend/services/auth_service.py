import asyncpg
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from schemas.auth_schema import UserSignup, UserLogin

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    @staticmethod
    def get_password_hash(password: str):
        # Truncate to 72 chars for bcrypt compatibility
        return pwd_context.hash(password[:72])

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str):
        # Truncate to 72 chars for bcrypt compatibility
        return pwd_context.verify(plain_password[:72], hashed_password)

    @staticmethod
    def create_access_token(data: dict):
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    async def signup(pool: asyncpg.Pool, data: UserSignup):
        hashed_password = AuthService.get_password_hash(data.password)
        
        async with pool.acquire() as conn:
            # Generate local username
            username = data.email.split('@')[0]
            
            # Check for existing email
            existing = await conn.fetchrow("SELECT id FROM users WHERE email = $1", data.email)
            if existing:
                raise Exception("Email already registered")

            await conn.execute(
                """
                INSERT INTO users (email, hashed_password, display_name, username, role)
                VALUES ($1, $2, $3, $4, $5)
                """,
                data.email, hashed_password, data.full_name, username, "user"
            )
        return True

    @staticmethod
    async def login(pool: asyncpg.Pool, data: UserLogin):
        async with pool.acquire() as conn:
            user = await conn.fetchrow(
                "SELECT id, email, hashed_password, role FROM users WHERE email = $1", 
                data.email
            )
            
            if not user or not AuthService.verify_password(data.password, user['hashed_password']):
                raise Exception("Invalid email or password")
                
            access_token = AuthService.create_access_token({
                "sub": str(user['id']),
                "email": user['email'],
                "role": user['role']
            })
            
            return {
                "access_token": access_token,
                "token_type": "bearer"
            }

    @staticmethod
    async def verify_token(pool: asyncpg.Pool, token: str):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id is None:
                return None
                
            async with pool.acquire() as conn:
                user = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
                return user
        except Exception:
            return None

    @staticmethod
    async def create_default_admin(pool: asyncpg.Pool):
        """Ensures a default admin user exists."""
        email = "admin@vibecook.com"
        password = "admin123"
        hashed_password = AuthService.get_password_hash(password)
        
        async with pool.acquire() as conn:
            user = await conn.fetchrow("SELECT id FROM users WHERE email = $1", email)
            if not user:
                print(f"Creating default admin: {email}")
                await conn.execute(
                    """
                    INSERT INTO users (email, hashed_password, display_name, username, role)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    email, hashed_password, "System Admin", "admin", "admin"
                )
            else:
                print(f"Default admin {email} already exists.")

    @staticmethod
    async def sync_profile(pool: asyncpg.Pool, user_id: str):
        # Local auth doesn't need syncing from external providers
        return user_id
