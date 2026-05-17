from fastapi import APIRouter, HTTPException, Request, File, UploadFile, Depends
from schemas.profile_schema import UserProfile, ProfileUpdate
from services.profile_service import ProfileService
from services.customized_recipe_service import CustomizedRecipeService
from api.deps import get_current_user, oauth2_scheme
from typing import List

router = APIRouter()

@router.get("/me", response_model=UserProfile)
async def get_my_profile(request: Request, user_id: str = Depends(get_current_user)):
    pool = request.app.state.pool
    profile = await ProfileService.get_profile(pool, user_id, viewer_id=user_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile

@router.get("/search", response_model=List[dict])
async def search_users(request: Request, username: str, user_id: str = Depends(get_current_user)):
    pool = request.app.state.pool
    return await ProfileService.search_users(pool, username)

@router.get("/{user_id_or_username}", response_model=UserProfile)
async def get_profile(request: Request, user_id_or_username: str, token: str = Depends(oauth2_scheme)):
    # Try to get current user if token is valid, but don't fail if not
    viewer_id = None
    try:
        from jose import jwt
        from core.config import SECRET_KEY, ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        viewer_id = payload.get("sub")
    except:
        pass

    pool = request.app.state.pool
    profile = await ProfileService.get_profile(pool, user_id_or_username, viewer_id=viewer_id)
    if not profile:
        raise HTTPException(404, "User not found")
    return profile

@router.get("/{user_id_or_username}/followers", response_model=List[dict])
async def get_followers(request: Request, user_id_or_username: str):
    pool = request.app.state.pool
    return await ProfileService.get_followers(pool, user_id_or_username)

@router.get("/{user_id_or_username}/following", response_model=List[dict])
async def get_following(request: Request, user_id_or_username: str):
    pool = request.app.state.pool
    return await ProfileService.get_following(pool, user_id_or_username)

@router.post("/{user_id}/follow")
async def follow_user(request: Request, user_id: str, current_user_id: str = Depends(get_current_user)):
    pool = request.app.state.pool
    if user_id == current_user_id:
        raise HTTPException(400, "You cannot follow yourself")
    await ProfileService.follow_user(pool, current_user_id, user_id)
    return {"message": "Followed successfully"}

@router.post("/{user_id}/unfollow")
async def unfollow_user(request: Request, user_id: str, current_user_id: str = Depends(get_current_user)):
    pool = request.app.state.pool
    await ProfileService.unfollow_user(pool, current_user_id, user_id)
    return {"message": "Unfollowed successfully"}

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

@router.get("/{user_id_or_username}/customized")
async def get_customized_recipes(request: Request, user_id_or_username: str):
    pool = request.app.state.pool
    return await CustomizedRecipeService.get_all_customized_for_user(pool, user_id_or_username)
