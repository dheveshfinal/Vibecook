"""
Quick reference for ChefAI API endpoints and usage examples.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# ────── HEALTH CHECK ──────────────────────────────────
def health_check():
    """Check if API is running."""
    response = requests.get(f"{BASE_URL}/api/health")
    print("Health:", response.json())

def status_check():
    """Check RAG system status."""
    response = requests.get(f"{BASE_URL}/api/status")
    print("Status:", json.dumps(response.json(), indent=2))

# ────── RECIPES ───────────────────────────────────────
def list_recipes():
    """Get all recipes."""
    response = requests.get(f"{BASE_URL}/api/recipes")
    return response.json()

def get_recipe(recipe_id):
    """Get recipe details."""
    response = requests.get(f"{BASE_URL}/api/recipes/{recipe_id}")
    return response.json()

def create_recipe(title, cuisine, time_mins, spice_level, diet_type, image_url=""):
    """Create a new recipe."""
    payload = {
        "title": title,
        "cuisine": cuisine,
        "time_mins": time_mins,
        "spice_level": spice_level,
        "diet_type": diet_type,
        "image_url": image_url,
    }
    response = requests.post(f"{BASE_URL}/api/recipes", json=payload)
    return response.json()

def update_recipe(recipe_id, **kwargs):
    """Update recipe details."""
    response = requests.put(f"{BASE_URL}/api/recipes/{recipe_id}", json=kwargs)
    return response.json()

def delete_recipe(recipe_id):
    """Delete a recipe."""
    response = requests.delete(f"{BASE_URL}/api/recipes/{recipe_id}")
    return response.json()

# ────── FILE UPLOADS ──────────────────────────────────
def upload_recipe_image(recipe_id, file_path):
    """Upload image for recipe."""
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(
            f"{BASE_URL}/api/upload/recipe-image/{recipe_id}",
            files=files
        )
    return response.json()

def upload_recipe_document(recipe_id, file_path):
    """Upload document (PDF, DOCX, TXT) for recipe."""
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(
            f"{BASE_URL}/api/upload/recipe-document/{recipe_id}",
            files=files
        )
    return response.json()

def upload_avatar(file_path):
    """Upload user avatar."""
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(
            f"{BASE_URL}/api/upload/avatar",
            files=files
        )
    return response.json()

# ────── CHAT & RAG ────────────────────────────────────
def chat(message, user_id=None):
    """Send message to AI assistant with RAG."""
    payload = {
        "message": message,
        "user_id": user_id,
    }
    response = requests.post(f"{BASE_URL}/api/chat", json=payload)
    return response.json()

def get_chat_history(user_id, limit=20):
    """Get chat history for user."""
    response = requests.get(
        f"{BASE_URL}/api/chat-history/{user_id}",
        params={"limit": limit}
    )
    return response.json()

# ────── PROFILE ───────────────────────────────────────
def get_profile():
    """Get current user profile."""
    response = requests.get(f"{BASE_URL}/api/profile")
    return response.json()

def get_user_profile(user_id):
    """Get specific user profile."""
    response = requests.get(f"{BASE_URL}/api/profile/{user_id}")
    return response.json()

def update_profile(user_id, **kwargs):
    """Update user profile."""
    response = requests.put(f"{BASE_URL}/api/profile/{user_id}", json=kwargs)
    return response.json()

def get_saved_recipes(user_id):
    """Get user's saved recipes."""
    response = requests.get(f"{BASE_URL}/api/users/{user_id}/saved-recipes")
    return response.json()

def save_recipe(user_id, recipe_id):
    """Save recipe for user."""
    response = requests.post(
        f"{BASE_URL}/api/users/{user_id}/saved-recipes/{recipe_id}"
    )
    return response.json()

def unsave_recipe(user_id, recipe_id):
    """Remove recipe from saved."""
    response = requests.delete(
        f"{BASE_URL}/api/users/{user_id}/saved-recipes/{recipe_id}"
    )
    return response.json()

# ────── USAGE EXAMPLES ────────────────────────────────
if __name__ == "__main__":
    print("ChefAI API Reference")
    print("=" * 50)
    print()
    
    # Health check
    print("1. Health Check")
    health_check()
    print()
    
    # Status
    print("2. RAG System Status")
    status_check()
    print()
    
    # List recipes
    print("3. List Recipes")
    recipes = list_recipes()
    print(f"Found {len(recipes)} recipes")
    print()
    
    # Chat example
    print("4. Chat with AI Assistant")
    response = chat("What are common ingredients in pasta dishes?")
    print("Question: What are common ingredients in pasta dishes?")
    print("Response:", response['response'][:200] + "...")
    print()
    
    # Create a recipe
    print("5. Create New Recipe")
    result = create_recipe(
        title="Simple Pasta",
        cuisine="Italian",
        time_mins=20,
        spice_level="None",
        diet_type="Veg"
    )
    print("Created:", result)
    print()
    
    print("For more examples, check README.md or API docs at http://localhost:8000/docs")
