from fastapi import APIRouter, HTTPException, Query, Request, File, UploadFile, Depends
from typing import List, Optional
from services.recipe_service import RecipeService
from services.customized_recipe_service import CustomizedRecipeService
from services.monitor_service import MonitorService
import uuid
import shutil
from pathlib import Path
from tasks.document_tasks import process_recipe_document
from api.deps import get_current_user, oauth2_scheme
from schemas.recipe_schema import (
    Recipe, RecipeCreate, RecipeUpdate,
    CustomizedRecipe, CustomizedRecipeCreate
)

router = APIRouter()

from core.config import UPLOAD_DIR, RECIPES_DIR, DOCS_DIR

@router.get("/", response_model=List[Recipe])
async def list_recipes(request: Request, diet: Optional[str] = None, spice: Optional[str] = None, search: Optional[str] = None):
    pool = request.app.state.pool
    return await RecipeService.list_recipes(pool, diet, spice, search)

@router.post("/", status_code=201)
async def create_recipe(request: Request, body: RecipeCreate):
    pool = request.app.state.pool
    recipe_id = await RecipeService.create_recipe(pool, body)
    return {"id": recipe_id, "message": "Recipe created"}

@router.get("/users/{user_id_or_username}/saved", response_model=List[Recipe])
async def get_public_saved_recipes(request: Request, user_id_or_username: str):
    pool = request.app.state.pool
    return await RecipeService.get_saved_recipes(pool, user_id_or_username)

@router.get("/{recipe_id}", response_model=Recipe)
async def get_recipe(request: Request, recipe_id: str, owner_id: Optional[str] = Query(None), token: str = Depends(oauth2_scheme)):
    pool = request.app.state.pool
    
    # Identify who we should look for customization for
    target_user_id = owner_id
    if not target_user_id:
        # If no owner specified, try to see if current user has a customization
        try:
            from jose import jwt
            from core.config import SECRET_KEY, ALGORITHM
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            target_user_id = payload.get("sub")
        except:
            pass

    if target_user_id:
        custom = await CustomizedRecipeService.get_customization(pool, target_user_id, recipe_id)
        if custom:
            # Shadow original values with customization
            original = await RecipeService.get_recipe(pool, recipe_id)
            if original:
                # Merge original fields that aren't in customization (like image_path)
                result = {**original, **custom}
                # Title, ingredients, steps are shadowed if present in custom
                if custom.get("title"): result["title"] = custom["title"]
                if custom.get("ingredients"): result["ingredients"] = custom["ingredients"]
                if custom.get("steps"): result["steps"] = custom["steps"]
                return result

    recipe = await RecipeService.get_recipe(pool, recipe_id)
    if not recipe:
        raise HTTPException(404, "Recipe not found")
    return recipe

@router.post("/me/customize/{recipe_id}")
async def save_customization(request: Request, recipe_id: str, body: CustomizedRecipeCreate, user_id: str = Depends(get_current_user)):
    pool = request.app.state.pool
    await CustomizedRecipeService.save_customization(pool, user_id, recipe_id, body)
    return {"message": "Recipe customized and saved"}

@router.delete("/me/customize/{recipe_id}")
async def delete_customization(request: Request, recipe_id: str, user_id: str = Depends(get_current_user)):
    pool = request.app.state.pool
    await CustomizedRecipeService.delete_customization(pool, user_id, recipe_id)
    return {"message": "Customization deleted"}

@router.put("/{recipe_id}")
async def update_recipe(request: Request, recipe_id: str, body: RecipeUpdate):
    pool = request.app.state.pool
    success = await RecipeService.update_recipe(pool, recipe_id, body)
    if not success:
        raise HTTPException(404, "Recipe not found or no updates provided")
    return {"message": "Recipe updated"}

@router.delete("/{recipe_id}")
async def delete_recipe(request: Request, recipe_id: str):
    pool = request.app.state.pool
    await RecipeService.delete_recipe(pool, recipe_id)
    return {"message": "Recipe deleted"}

@router.post("/upload-image/{recipe_id}")
async def upload_recipe_image(request: Request, recipe_id: str, file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    ext = Path(file.filename).suffix or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    dest = RECIPES_DIR / filename

    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    rel_path = f"recipes/{filename}"
    
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE recipes SET image_path=$1 WHERE id=$2::uuid",
            rel_path, recipe_id
        )

    return {"path": rel_path}

@router.get("/me/saved", response_model=List[Recipe])
async def get_my_saved_recipes(request: Request, user_id: str = Depends(get_current_user)):
    pool = request.app.state.pool
    return await RecipeService.get_saved_recipes(pool, user_id)

@router.post("/me/save/{recipe_id}")
async def save_recipe(request: Request, recipe_id: str, user_id: str = Depends(get_current_user)):
    pool = request.app.state.pool
    await RecipeService.save_recipe(pool, user_id, recipe_id)
    return {"message": "Recipe saved"}

@router.delete("/me/unsave/{recipe_id}")
async def unsave_recipe(request: Request, recipe_id: str, user_id: str = Depends(get_current_user)):
    pool = request.app.state.pool
    await RecipeService.unsave_recipe(pool, user_id, recipe_id)
    return {"message": "Recipe removed from saved"}

@router.post("/upload-document/{recipe_id}")
async def upload_recipe_document(recipe_id: str, file: UploadFile = File(...)):
    """Upload document for a recipe and trigger background RAG processing."""
    try:
        filename = f"{uuid.uuid4()}_{file.filename}"
        dest = DOCS_DIR / filename
        
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Clear old logs for this recipe
        await MonitorService.clear_logs(recipe_id)
        
        # Trigger background task
        process_recipe_document.delay(recipe_id, str(dest), file.filename)
        
        return {
            "message": "Upload successful. Processing has started.",
            "filename": filename
        }
    except Exception as e:
        raise HTTPException(400, f"Error uploading document: {str(e)}")
