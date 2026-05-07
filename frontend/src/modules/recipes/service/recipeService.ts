import type { Recipe } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const recipeService = {
    async getRecipes(diet?: string, spice?: string, search?: string): Promise<Recipe[]> {
        const url = new URL(`${API_BASE}/api/v1/recipes`);
        if (diet) url.searchParams.append("diet", diet);
        if (spice) url.searchParams.append("spice", spice);
        if (search) url.searchParams.append("search", search);

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error("Failed to fetch recipes");
        const data = await response.json();
        return data.map((r: any, idx: number) => ({
            id: idx + 1,
            title: r.title,
            time: `${r.time_mins} min`,
            cuisine: r.cuisine,
            spice: r.spice_level,
            diet: r.diet_type,
            img: r.image_display_url || "https://via.placeholder.com/300",
            db_id: r.id,
            ingredients: r.ingredients || "",
            steps: r.steps || "",
            description: r.description || "",
        }));
    },

    async createRecipe(data: Partial<Recipe>): Promise<{ id: string }> {
        const response = await fetch(`${API_BASE}/api/v1/recipes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: data.title,
                image_url: data.img,
                cuisine: data.cuisine,
                // # ...other fields if needed, but the backend schema has defaults
            }),
        });
        if (!response.ok) throw new Error("Failed to create recipe");
        return response.json();
    },

    async getRecipe(db_id: string): Promise<Recipe> {
        const response = await fetch(`${API_BASE}/api/v1/recipes/${db_id}`);
        if (!response.ok) throw new Error("Failed to fetch recipe");
        const r = await response.json();
        return {
            id: 0,
            title: r.title,
            time: `${r.time_mins} min`,
            cuisine: r.cuisine || "",
            spice: r.spice_level || "None",
            diet: r.diet_type || "Veg",
            img: r.image_display_url || "https://via.placeholder.com/300",
            db_id: r.id,
            ingredients: r.ingredients || "",
            steps: r.steps || "",
            description: r.description || "",
        };
    },

    async deleteRecipe(db_id: string): Promise<void> {
        const response = await fetch(`${API_BASE}/api/v1/recipes/${db_id}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete recipe");
    }
};
