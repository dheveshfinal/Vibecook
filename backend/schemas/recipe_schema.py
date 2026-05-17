from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class RecipeBase(BaseModel):
    title: str
    image_url: Optional[str] = ""
    cuisine: Optional[str] = ""
    time_mins: Optional[int] = 30
    spice_level: Optional[str] = "None"
    diet_type: Optional[str] = "Veg"
    ingredients: Optional[str] = ""
    steps: Optional[str] = ""
    description: Optional[str] = ""

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    ingredients: Optional[str] = None
    steps: Optional[str] = None
    cuisine: Optional[str] = None
    time_mins: Optional[int] = None
    spice_level: Optional[str] = None
    diet_type: Optional[str] = None
    description: Optional[str] = None

class Recipe(RecipeBase):
    id: UUID
    image_path: Optional[str] = ""
    document_path: Optional[str] = ""
    created_at: datetime
    image_display_url: Optional[str] = ""

class CustomizedRecipeBase(BaseModel):
    title: Optional[str] = None
    ingredients: Optional[str] = None
    steps: Optional[str] = None
    note: Optional[str] = None

class CustomizedRecipeCreate(CustomizedRecipeBase):
    pass

class CustomizedRecipeUpdate(CustomizedRecipeBase):
    pass

class CustomizedRecipe(CustomizedRecipeBase):
    id: UUID
    user_id: UUID
    original_recipe_id: UUID
    created_at: datetime
