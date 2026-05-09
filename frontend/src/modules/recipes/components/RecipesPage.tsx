import React, { useState, useRef } from "react";
import { useRecipes } from "../hooks/useRecipes";
import RecipeCard from "./RecipeCard";
import RecipeDetailView from "./RecipeDetailView";
import type { Recipe } from "../types";
import { recipeService } from "../service/recipeService";
import SearchBar from "./SearchBar";

import { useProfile } from "../../profile/hooks/useProfile";
import { profileService } from "../../profile/service/profileService";
import CatLoader from "../../loading/components/Loading";
import Header from "../../../header/components/header";

interface RecipesPageProps {
    onStartCooking: (recipe: Recipe) => void;
    onNavigate?: (page: string) => void;
}

const RecipesPage: React.FC<RecipesPageProps> = ({ onStartCooking, onNavigate }) => {
    const { profile, loading: profileLoading } = useProfile();
    const { recipes, loading: recipesLoading, deleteRecipe, refresh } = useRecipes(profile?.diet_type, undefined, undefined, !profileLoading);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Use filename as title, empty image info, tag as KnowledgeBase
            await profileService.uploadRecipe(file.name, "", undefined, file, "KnowledgeBase");
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 10000); // Hide after 10s
            refresh();
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload document.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // If profile is loading, or we are waiting for the FIRST fetch of recipes WITH a diet filter
    const loading = profileLoading || (recipesLoading && recipes.length === 0);

    const handleRecipeClick = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
    };

    const handleDelete = async (db_id: string) => {
        if (!window.confirm("Are you sure you want to delete this recipe?")) return;
        await deleteRecipe(db_id);
        setSelectedRecipe(null);
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

                <div style={styles.headerActions}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                        accept=".pdf,.doc,.docx,.txt"
                    />
                    <button
                        style={{
                            ...styles.uploadButton,
                            opacity: isUploading ? 0.7 : 1,
                            cursor: isUploading ? "not-allowed" : "pointer"
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? "Uploading..." : "📎 Project Doc"}
                    </button>
                    {uploadSuccess && (
                        <div style={styles.successMessage}>
                            Processed!
                            <button
                                onClick={() => onNavigate?.("monitor")}
                                style={styles.monitorLink}
                            >
                                View Logs 📊
                            </button>
                        </div>
                    )}
                </div>
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
    headerActions: {
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
    },
    uploadButton: {
        background: "linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "12px",
        fontWeight: "600",
        fontSize: "14px",
        boxShadow: "0 4px 15px rgba(255, 107, 53, 0.2)",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
    },
    successMessage: {
        marginLeft: "12px",
        fontSize: "13px",
        color: "#2e7d32",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        animation: "slideIn 0.3s ease",
    },
    monitorLink: {
        background: "none",
        border: "none",
        color: "#1976d2",
        textDecoration: "underline",
        cursor: "pointer",
        padding: 0,
        fontSize: "13px",
        fontWeight: "70a0",
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
