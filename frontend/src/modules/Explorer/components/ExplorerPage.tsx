import React, { useState, useMemo, useEffect } from "react";
import { useRecipes } from "../../recipes/hooks/useRecipes";
import RecipeCard from "../../recipes/components/RecipeCard";
import RecipeDetailView from "../../RecipeDetails/components/RecipeDetailView";
import type { Recipe } from "../../recipes/types";
import { recipeService } from "../../recipes/service/recipeService";
import CatLoader from "../../loading/components/Loading";
import Header from "../../../header/components/header";
import ConfirmDialog from "../../../components/ConfirmDialog";


interface ExplorerPageProps {
    onStartCooking: (recipe: Recipe) => void;
}

const ExplorerPage: React.FC<ExplorerPageProps> = ({ onStartCooking }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { recipes, loading, deleteRecipe, refresh } = useRecipes(undefined, undefined, debouncedQuery);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);


    const groupedRecipes = useMemo(() => {
        const groups: Record<string, Recipe[]> = {};
        recipes.forEach((r) => {
            const cat = r.cuisine || "Other";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(r);
        });
        return groups;
    }, [recipes]);

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
            <div style={styles.hero}>
                <h1 style={styles.heroTitle}>Explore Flavors</h1>
                <p style={styles.heroSub}>Discover new tastes from around the world</p>

                <div style={styles.searchWrapper}>
                    <span style={styles.searchIcon}>🔍</span>
                    <input
                        style={styles.searchInput}
                        type="text"
                        placeholder="Search recipes, cuisines, or ingredients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div style={styles.content}>
                {loading && recipes.length === 0 ? (
                    <CatLoader />
                ) : recipes.length === 0 ? (
                    <div style={styles.empty}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
                        <h3>No recipes found</h3>
                        <p>Try searching for something else or browse categories.</p>
                    </div>
                ) : (
                    Object.entries(groupedRecipes).map(([cuisine, items]) => (
                        <div key={cuisine} style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <h2 style={styles.sectionTitle}>{cuisine}</h2>
                                <span style={styles.count}>{items.length} recipes</span>
                            </div>
                            <div style={styles.grid}>
                                {items.map((recipe) => (
                                    <div
                                        key={recipe.id}
                                        onClick={() => setSelectedRecipe(recipe)}
                                        style={styles.cardWrapper}
                                    >
                                        <RecipeCard recipe={recipe} />
                                    </div>
                                ))}
                            </div>
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
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#fdf8f5",
        overflowY: "auto",
        minHeight: "100vh",
    },
    hero: {
        padding: "60px 40px",
        background: "linear-gradient(135deg, #dbc466ff 0%, #f1a671ff 50%, #fb923c 100%)", // ← FIXED: warm orange
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 12,
    },
    heroTitle: {
        fontSize: 42,
        fontWeight: 800,
        margin: 0,
        letterSpacing: "-0.02em",
        textShadow: "0 2px 8px rgba(0,0,0,0.15)",
    },
    heroSub: {
        fontSize: 18,
        opacity: 0.9,
        margin: "0 0 24px 0",
    },
    searchWrapper: {
        position: "relative",
        width: "100%",
        maxWidth: 600,
        display: "flex",
        alignItems: "center",
    },
    searchIcon: {
        position: "absolute",
        left: 20,
        fontSize: 20,
        color: "#888",
        zIndex: 1,
    },
    searchInput: {
        width: "100%",
        padding: "18px 24px 18px 56px",
        borderRadius: "16px",
        border: "none",
        fontSize: 16,
        color: "#1a1a1a",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        outline: "none",
        transition: "transform 0.2s, box-shadow 0.2s",
    },
    content: {
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        gap: "48px",
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        borderBottom: "2px solid #eee",
        paddingBottom: "12px",
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 700,
        color: "#1a1a1a",
        margin: 0,
    },
    count: {
        fontSize: 14,
        color: "#888",
        fontWeight: 500,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "24px",
    },
    cardWrapper: {
        cursor: "pointer",
        transition: "transform 0.2s ease",
    },
    loading: {
        textAlign: "center",
        padding: "80px",
        fontSize: 18,
        color: "#888",
    },
    empty: {
        textAlign: "center",
        padding: "80px",
        color: "#666",
    },
};

export default ExplorerPage;
