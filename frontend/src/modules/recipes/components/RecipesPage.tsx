import React, { useState } from "react";
import { useRecipes } from "../hooks/useRecipes";
import RecipeCard from "./RecipeCard";
import RecipeDetailView from "./RecipeDetailView";
import type { Recipe } from "../types";
import { recipeService } from "../service/recipeService";
import SearchBar from "./SearchBar";

import { useProfile } from "../../profile/hooks/useProfile";
import CatLoader from "../../loading/components/Loading";
import Header from "../../../header/components/header";
import ConfirmDialog from "../../../components/ConfirmDialog";


interface RecipesPageProps {
    onStartCooking: (recipe: Recipe) => void;
}

const RecipesPage: React.FC<RecipesPageProps> = ({ onStartCooking }) => {
    const { profile, loading: profileLoading } = useProfile();
    const { recipes, loading: recipesLoading, deleteRecipe, refresh } = useRecipes(profile?.diet_type, undefined, undefined, !profileLoading);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);



    // If profile is loading, or we are waiting for the FIRST fetch of recipes WITH a diet filter
    const loading = profileLoading || (recipesLoading && recipes.length === 0);

    const handleRecipeClick = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
    };

    const handleDelete = async (db_id: string) => {
        setSelectedRecipe(null);
        setRecipeToDelete(db_id);
    };

    const confirmDelete = async () => {
        if (recipeToDelete) {
            await deleteRecipe(recipeToDelete);
            setRecipeToDelete(null);
            setSelectedRecipe(null);
        }
    };

    const handleRefresh = async () => {
        await refresh();
        if (selectedRecipe?.db_id) {
            try {
                const fresh = await recipeService.getRecipe(selectedRecipe.db_id);
                setSelectedRecipe(fresh);
            } catch (e) {
                console.error("Failed to refresh recipe:", e);
            }
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <CatLoader />
            </div>
        );
    }

    if (selectedRecipe) {
        return (
            <RecipeDetailView
                recipe={selectedRecipe}
                onBack={() => setSelectedRecipe(null)}
                onDelete={handleDelete}
                onRefresh={handleRefresh}
                onStartCooking={() => onStartCooking(selectedRecipe)}
            />
        );
    }

    return (
        <div style={styles.container}>
            <Header />
            <div style={styles.header}>

                <SearchBar
                    diet={profile?.diet_type}
                    onSelectRecipe={(recipe) => setSelectedRecipe(recipe)}
                />

            </div>


            <div style={styles.gridContainer}>
                {recipes.length === 0 ? (
                    <p style={styles.emptyMessage}>No recipes yet. Add one to get started!</p>
                ) : (
                    recipes.map((recipe) => (
                        <div key={recipe.id} onClick={() => handleRecipeClick(recipe)} style={styles.cardWrapper}>
                            <RecipeCard recipe={recipe} />
                        </div>
                    ))
                )}
            </div>

            <ConfirmDialog
                isOpen={!!recipeToDelete}
                onConfirm={confirmDelete}
                onCancel={() => setRecipeToDelete(null)}
            />
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        marginLeft: 280,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#f9f1eb",
        overflowY: "auto",
        padding: "24px",
        position: "relative",
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
        marginTop: "32px",
        marginBottom: "32px",
        padding: "0 10px",
        width: "100%",
    },
    title: {
        fontSize: 32,
        fontWeight: 800,
        color: "#1a1a1a",
        margin: 0,
        letterSpacing: "-0.02em",
    },
    formContainer: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    gridContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "20px",
    },
    cardWrapper: {
        cursor: "pointer",
        transition: "transform 0.2s",
    },
    emptyMessage: {
        textAlign: "center",
        color: "#888",
        fontSize: 16,
        padding: "40px 20px",
    },
};

export default RecipesPage;
