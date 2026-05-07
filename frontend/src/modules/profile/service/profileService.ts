import type { UserProfile, ProfileUpdate } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const profileService = {
    async getProfile(): Promise<UserProfile> {
        const response = await fetch(`${API_BASE}/api/v1/profile/`);
        if (!response.ok) throw new Error("Failed to fetch profile");
        return response.json();
    },

    async updateProfile(user_id: string, data: ProfileUpdate): Promise<void> {
        const response = await fetch(`${API_BASE}/api/v1/profile/${user_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update profile");
    },

    async uploadAvatar(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_BASE}/api/v1/profile/upload-avatar`, {
            method: "POST",
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
            headers: { "Content-Type": "application/json" },
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
            await fetch(`${API_BASE}/api/v1/recipes/upload-image/${recipeId}`, { method: "POST", body: imgData });
        }

        // 3. Upload Document
        if (docFile) {
            const docData = new FormData();
            docData.append("file", docFile);
            await fetch(`${API_BASE}/api/v1/recipes/upload-document/${recipeId}`, { method: "POST", body: docData });
        }

        return recipeId;
    }
};
