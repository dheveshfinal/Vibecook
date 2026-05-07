from fastapi import APIRouter, HTTPException, Request, File, UploadFile
from schemas.profile_schema import UserProfile, ProfileUpdate
from services.profile_service import ProfileService

router = APIRouter()

@router.get("/{user_id}", response_model=UserProfile)
async def get_profile(request: Request, user_id: str):
    pool = request.app.state.pool
    profile = await ProfileService.get_profile(pool, user_id)
    if not profile:
        raise HTTPException(404, "User not found")
    return profile

@router.get("/", response_model=UserProfile)
async def get_my_profile(request: Request):
    pool = request.app.state.pool
    profile = await ProfileService.get_first_profile(pool)
    if not profile:
        raise HTTPException(404, "No users found")
    return profile

@router.put("/{user_id}")
async def update_profile(request: Request, user_id: str, body: ProfileUpdate):
    pool = request.app.state.pool
    await ProfileService.update_profile(pool, user_id, body)
    return {"message": "Profile updated"}

@router.post("/upload-avatar")
async def upload_avatar(request: Request, file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    
    pool = request.app.state.pool
    content = await file.read()
    url = await ProfileService.upload_avatar(pool, content, file.filename)
    return {"url": url}
