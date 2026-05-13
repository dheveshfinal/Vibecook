import requests
import json

BASE_URL = "http://localhost:8000"

def test_profile():
    try:
        resp = requests.get(f"{BASE_URL}/api/v1/profile/")
        print(f"Profile Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Profile Data:")
            print(json.dumps(resp.json(), indent=2))
        else:
            print(f"Error: {resp.text}")
    except Exception as e:
        print(f"Request failed: {e}")

def test_save_recipe(user_id, recipe_id):
    try:
        resp = requests.post(f"{BASE_URL}/api/v1/recipes/user/{user_id}/save/{recipe_id}")
        print(f"Save Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Save Request failed: {e}")

if __name__ == "__main__":
    # Get profile first to get user_id
    resp = requests.get(f"{BASE_URL}/api/v1/profile/")
    if resp.status_code == 200:
        data = resp.json()
        u_id = data["id"]
        print(f"User ID: {u_id}")
        
        # Get all recipes to pick one to save
        r_resp = requests.get(f"{BASE_URL}/api/v1/recipes/")
        if r_resp.status_code == 200:
            recipes = r_resp.json()
            if recipes:
                first_recipe_id = recipes[0]["id"]
                print(f"Saving Recipe ID: {first_recipe_id}")
                test_save_recipe(u_id, first_recipe_id)
                
                # Check profile again
                test_profile()
            else:
                print("No recipes found to save.")
        else:
            print("Failed to fetch recipes.")
    else:
        print("Failed to fetch profile.")
