from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    diet_type: Optional[str] = None
    spice_level: Optional[int] = None
    allergies: Optional[List[str]] = None
    cuisine_prefs: Optional[List[str]] = None
    cooking_skill: Optional[str] = None

class UserProfile(BaseModel):
    id: UUID
    username: str
    email: str
    display_name: str
    bio: str
    avatar_path: str
    diet_type: str
    spice_level: int
    allergies: List[str]
    cuisine_prefs: List[str]
    cooking_skill: str
    recipes_cooked: int
    recipes_saved: int
    recipes_saved_ids: List[UUID]
    member_since: datetime
    avatar_url: Optional[str] = ""
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False
