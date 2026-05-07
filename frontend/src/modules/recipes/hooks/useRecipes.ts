import { useState, useEffect, useCallback } from "react";
import type { Recipe } from "../types";
import { recipeService } from "../service/recipeService";

export function useRecipes(diet?: string, spice?: string, search?: string, enabled: boolean = true) {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRecipes = useCallback(async () => {
        if (!enabled) return;
        try {
            setLoading(true);
            const data = await recipeService.getRecipes(diet, spice, search);
            setRecipes(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch recipes");
        } finally {
            setLoading(false);
        }
    }, [diet, spice, search, enabled]);

    useEffect(() => {
        if (!enabled) {
            setLoading(true);
            return;
        }
        setRecipes([]);
        fetchRecipes();
    }, [fetchRecipes, enabled]);

    const deleteRecipe = async (db_id: string) => {
        await recipeService.deleteRecipe(db_id);
        await fetchRecipes();
    };

    return { recipes, loading, error, refresh: fetchRecipes, deleteRecipe };
}
