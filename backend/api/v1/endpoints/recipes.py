from fastapi import APIRouter, HTTPException, Query, Request, File, UploadFile
from typing import List, Optional
from schemas.recipe_schema import Recipe, RecipeCreate, RecipeUpdate
from services.recipe_service import RecipeService
from services.monitor_service import MonitorService
import uuid
import shutil
from pathlib import Path
from tasks.document_tasks import process_recipe_document

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

@router.get("/{recipe_id}", response_model=Recipe)
async def get_recipe(request: Request, recipe_id: str):
    pool = request.app.state.pool
    recipe = await RecipeService.get_recipe(pool, recipe_id)
    if not recipe:
        raise HTTPException(404, "Recipe not found")
    # Compatibility with schema (ingredients vs ingredients_list)
    return recipe

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

@router.get("/user/{user_id}/saved", response_model=List[Recipe])
async def get_saved_recipes(request: Request, user_id: str):
    pool = request.app.state.pool
    return await RecipeService.get_saved_recipes(pool, user_id)

@router.post("/user/{user_id}/save/{recipe_id}")
async def save_recipe(request: Request, user_id: str, recipe_id: str):
    pool = request.app.state.pool
    await RecipeService.save_recipe(pool, user_id, recipe_id)
    return {"message": "Recipe saved"}

@router.delete("/user/{user_id}/unsave/{recipe_id}")
async def unsave_recipe(request: Request, user_id: str, recipe_id: str):
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
