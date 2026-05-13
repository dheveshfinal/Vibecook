from fastapi import APIRouter, HTTPException, Request, File, UploadFile, Depends
from schemas.profile_schema import UserProfile, ProfileUpdate
from services.profile_service import ProfileService
from api.deps import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserProfile)
async def get_my_profile(request: Request, user_id: str = Depends(get_current_user)):
    pool = request.app.state.pool
    profile = await ProfileService.get_profile(pool, user_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile

@router.get("/{user_id}", response_model=UserProfile)
async def get_profile(request: Request, user_id: str):
    # This endpoint can remain for public profile views, but we keep it safe
    pool = request.app.state.pool
    profile = await ProfileService.get_profile(pool, user_id)
    if not profile:
        raise HTTPException(404, "User not found")
    return profile

@router.put("/me")
async def update_my_profile(request: Request, body: ProfileUpdate, user_id: str = Depends(get_current_user)):
    pool = request.app.state.pool
    await ProfileService.update_profile(pool, user_id, body)
    return {"message": "Profile updated"}

@router.post("/upload-avatar")
async def upload_avatar(request: Request, file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    
    pool = request.app.state.pool
    content = await file.read()
    url = await ProfileService.upload_avatar(pool, content, file.filename, user_id)
    return {"url": url}
