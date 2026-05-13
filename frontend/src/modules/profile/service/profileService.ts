import type { UserProfile, ProfileUpdate } from "../types";
import { authService } from "../../Auth/service/authService";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getHeaders = () => {
    const token = authService.getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
};

const getAuthOnlyHeader = () => {
    const token = authService.getToken();
    return token ? { "Authorization": `Bearer ${token}` } : {};
};

export const profileService = {
    async getProfile(): Promise<UserProfile> {
        const response = await fetch(`${API_BASE}/api/v1/profile/me`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch profile");
        return response.json();
    },

    async updateProfile(_: string, data: ProfileUpdate): Promise<void> {
        const response = await fetch(`${API_BASE}/api/v1/profile/me`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update profile");
    },

    async uploadAvatar(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_BASE}/api/v1/profile/upload-avatar`, {
            method: "POST",
            headers: getAuthOnlyHeader(),
            body: formData,
        });
        if (!response.ok) throw new Error("Failed to upload avatar");
        const data = await response.json();
        return data.url;
    },

    async uploadRecipe(title: string, imageUrl?: string, imageFile?: File, docFile?: File, dietType?: string): Promise<string> {
        // 1. Create Recipe
        const res = await fetch(`${API_BASE}/api/v1/recipes/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                title,
                image_url: imageUrl || "",
                diet_type: dietType || "Veg"
            }),
        });
        if (!res.ok) throw new Error("Failed to create recipe");
        const { id: recipeId } = await res.json();

        // 2. Upload Image if manual
        if (imageFile) {
            const imgData = new FormData();
            imgData.append("file", imageFile);
            await fetch(`${API_BASE}/api/v1/recipes/upload-image/${recipeId}`, {
                method: "POST",
                headers: getAuthOnlyHeader(),
                body: imgData
            });
        }

        // 3. Upload Document
        if (docFile) {
            const docData = new FormData();
            docData.append("file", docFile);
            await fetch(`${API_BASE}/api/v1/recipes/upload-document/${recipeId}`, {
                method: "POST",
                headers: getAuthOnlyHeader(),
                body: docData
            });
        }

        return recipeId;
    },

    async getSavedRecipes(_?: string): Promise<any[]> {
        const response = await fetch(`${API_BASE}/api/v1/recipes/me/saved`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch saved recipes");
        return response.json();
    },

    async saveRecipe(_: string, recipeId: string): Promise<void> {
        const response = await fetch(`${API_BASE}/api/v1/recipes/me/save/${recipeId}`, {
            method: "POST",
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Failed to save recipe");
    },

    async unsaveRecipe(_: string, recipeId: string): Promise<void> {
        const response = await fetch(`${API_BASE}/api/v1/recipes/me/unsave/${recipeId}`, {
            method: "DELETE",
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Failed to unsave recipe");
    }
};
