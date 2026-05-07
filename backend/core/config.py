import os
from pathlib import Path

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://chef_user:chef_pass@localhost:5432/chefai"
)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

UPLOAD_DIR = Path("uploads")
DOCS_DIR = UPLOAD_DIR / "documents"
AVATARS_DIR = UPLOAD_DIR / "avatars"
RECIPES_DIR = UPLOAD_DIR / "recipes"

# Ensure directories exist
DOCS_DIR.mkdir(parents=True, exist_ok=True)
AVATARS_DIR.mkdir(parents=True, exist_ok=True)
RECIPES_DIR.mkdir(parents=True, exist_ok=True)
