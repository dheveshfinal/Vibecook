from fastapi import APIRouter, HTTPException, Request
from schemas.auth_schema import UserSignup, UserLogin, TokenResponse, ForgotPassword
from services.auth_service import AuthService

router = APIRouter()

@router.get("/")
async def get_auth_status():
    """Endpoint for checking the auth API status."""
    return {
        "status": "online",
        "api_name": "ChefAI Auth API",
        "methods": ["POST /login", "POST /signup", "POST /forgot-password"],
        "message": "Auth API is working. Please use the POST methods for authentication."
    }

@router.post("/signup")
async def signup(request: Request, data: UserSignup):
    pool = request.app.state.pool
    try:
        await AuthService.signup(pool, data)
        return {"message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, data: UserLogin):
    pool = request.app.state.pool
    try:
        tokens = await AuthService.login(pool, data)
        return {
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token"),
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword):
    # Mocking forgot password logic
    return {"message": "If this email exists, a reset link has been sent."}

@router.post("/sync-profile")
async def sync_profile(request: Request):
    pool = request.app.state.pool
    # Extract user from token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = auth_header.split(" ")[1]
    current_user = await AuthService.verify_token(pool, token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # sync_profile is a no-op for local auth but keeps frontend happy
    await AuthService.sync_profile(pool, current_user['id'])
    return {"status": "success", "user_id": str(current_user['id'])}
