import React, { useState } from "react";
import { useProfile } from "../hooks/useProfile";
import { profileService } from "../service/profileService";
import ConfirmDialog from "../../../components/ConfirmDialog";

const COLORS = {
    primary: "hsl(20, 85%, 56%)",
    primaryDark: "hsl(20, 85%, 45%)",
    text: "hsl(0, 0%, 15%)",
    textMuted: "hsl(0, 0%, 45%)",
    success: "#22a05b",
    danger: "#c62828",
};

// ... dietColors ...

type Filter = "all" | "saved" | "customized";

interface SavedRecipesPanelProps {
    viewedUserId?: string;
    onRecipeClick?: (recipe: any) => void;
}

const SavedRecipesPanel: React.FC<SavedRecipesPanelProps> = ({ viewedUserId, onRecipeClick }) => {
    const { profile: myProfile, toggleSaveRecipe, deleteCustomization, refresh } = useProfile();
    const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<Filter>("all");

    // Deletion state
    const [deletingRecipe, setDeletingRecipe] = useState<any>(null);

    const isOwnProfile = !viewedUserId;
    const targetUserIdOrUsername = viewedUserId || myProfile?.id;

    const fetchRecipes = React.useCallback(() => {
        if (targetUserIdOrUsername) {
            setLoading(true);
            Promise.all([
                profileService.getSavedRecipes(targetUserIdOrUsername.toString()),
                profileService.getCustomizedRecipes(targetUserIdOrUsername.toString())
            ]).then(([saved, customized]) => {
                const combined = [
                    ...saved.map(r => ({ ...r, is_custom: false })),
                    ...customized.map(r => ({ ...r, is_custom: true, note: r.note || "Customized version" }))
                ];
                setSavedRecipes(combined);
            }).catch(err => {
                console.error("Failed to fetch recipes:", err);
            }).finally(() => setLoading(false));
        }
    }, [targetUserIdOrUsername]);

    React.useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    const handleConfirmDelete = async () => {
        if (!deletingRecipe) return;
        try {
            if (deletingRecipe.is_custom) {
                const recipeDbId = deletingRecipe.original_recipe_id || deletingRecipe.id;
                await deleteCustomization(recipeDbId);
            } else {
                await toggleSaveRecipe(deletingRecipe.id, true);
            }
            fetchRecipes();
            refresh(); // Update the main profile stats
        } catch (err) {
            console.error("Failed to delete recipe:", err);
        } finally {
            setDeletingRecipe(null);
        }
    };

    const displayRecipes = filter === "all" ? savedRecipes : savedRecipes.filter((r) => {
        const isCustom = r.is_custom;
        return filter === "saved" ? !isCustom : isCustom;
    });

    if (loading && savedRecipes.length === 0) return <div>Loading recipes...</div>;

    return (
        <div style={styles.card}>
            {/* Header */}
            <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>🍲 Saved & Customized Recipes</div>
                <div style={styles.filterRow}>
                    {(["all", "saved", "customized"] as Filter[]).map((f) => (
                        <button
                            key={f}
                            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
                            onClick={() => setFilter(f)}
                        >
                            {f === "all" ? "All" : f === "saved" ? "⭐ Saved" : "✏️ Customized"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Recipe list */}
            <div style={styles.list}>
                {displayRecipes.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: COLORS.textMuted }}>
                        No recipes found.
                    </div>
                ) : displayRecipes.map((recipe) => {
                    const diet = dietColors[recipe.diet_type] || dietColors.Veg;
                    const isCustom = recipe.is_custom;
                    return (
                        <div
                            key={recipe.id + (isCustom ? "-custom" : "-saved")}
                            style={{ ...styles.recipeRow, cursor: onRecipeClick ? "pointer" : "default" }}
                            onClick={() => {
                                if (onRecipeClick) {
                                    const recipeDbId = recipe.original_recipe_id || recipe.id;
                                    onRecipeClick({
                                        ...recipe,
                                        db_id: recipeDbId,
                                        is_customized_view: isCustom,
                                        owner_id: isCustom ? recipe.user_id : undefined
                                    });
                                }
                            }}
                        >
                            {/* Small image */}
                            <img
                                src={recipe.image_display_url || recipe.image_url}
                                alt={recipe.title}
                                style={styles.thumb}
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x60?text=🍽️"; }}
                            />

                            {/* Info */}
                            <div style={styles.recipeInfo}>
                                <div style={styles.recipeTopRow}>
                                    <span style={styles.recipeTitle}>{recipe.title}</span>
                                    <span style={{ ...styles.dietBadge, background: diet.bg, color: diet.color }}>{recipe.diet_type}</span>
                                </div>
                                <div style={styles.recipeMeta}>
                                    <span style={styles.metaChip}>🌍 {recipe.cuisine}</span>
                                    <span style={styles.metaChip}>⏱ {recipe.time_mins} min</span>
                                    <span style={styles.metaChip}>🔥 {recipe.spice_level}</span>
                                </div>
                                {recipe.note && (
                                    <div style={styles.customNote}>✏️ {recipe.note}</div>
                                )}
                            </div>

                            {/* Type badge */}
                            <div style={{
                                ...styles.typeBadge,
                                background: !isCustom ? "#fff8e1" : "#f3e5f5",
                                color: !isCustom ? "#e65100" : "#6a1b9a",
                            }}>
                                {!isCustom ? "⭐ Saved" : "✏️ Custom"}
                            </div>

                            {/* Delete button (Only for own profile) */}
                            {isOwnProfile && (
                                <button
                                    style={styles.deleteBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingRecipe(recipe);
                                    }}
                                    title={isCustom ? "Delete customized version" : "Unsave recipe"}
                                >
                                    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
                                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <ConfirmDialog
                isOpen={!!deletingRecipe}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeletingRecipe(null)}
                title={deletingRecipe?.is_custom ? "Delete Customization?" : "Unsave Recipe?"}
                message={deletingRecipe?.is_custom
                    ? `Are you sure you want to delete your customized version of "${deletingRecipe?.title}"? This cannot be undone.`
                    : `Remove "${deletingRecipe?.title}" from your saved recipes?`}
            />
        </div>
    );
};

const dietColors: Record<string, { bg: string; color: string }> = {
    Veg: { bg: "#e8f5e9", color: "#2e7d32" },
    "Non-Veg": { bg: "#fce4ec", color: "#c62828" },
    Vegan: { bg: "#e0f7fa", color: "#00695c" },
};

const styles: Record<string, React.CSSProperties> = {
    card: { background: "#fff", borderRadius: 24, padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid #f0f0f0", width: "100%", boxSizing: "border-box" },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 },
    cardTitle: { fontSize: 18, fontWeight: 700, color: "hsl(0,0%,15%)" },
    filterRow: { display: "flex", gap: 8 },
    filterBtn: { padding: "6px 14px", borderRadius: 20, border: "1.5px solid #eee", background: "#fafafa", fontSize: 12, fontWeight: 600, cursor: "pointer", color: COLORS.textMuted },
    filterBtnActive: { background: COLORS.primary, color: "#fff", border: `1.5px solid ${COLORS.primary}` },
    list: { display: "flex", flexDirection: "column", gap: 12 },
    recipeRow: { display: "flex", alignItems: "center", gap: 16, padding: "12px", borderRadius: 16, border: "1px solid #f5f5f5", background: "#fafafa", transition: "all 0.2s", position: "relative" },
    thumb: { width: 80, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid #eee" },
    recipeInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
    recipeTopRow: { display: "flex", alignItems: "center", gap: 8 },
    recipeTitle: { fontSize: 15, fontWeight: 700, color: "hsl(0,0%,15%)" },
    dietBadge: { padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 },
    recipeMeta: { display: "flex", flexWrap: "wrap", gap: 6 },
    metaChip: { fontSize: 11, color: COLORS.textMuted, background: "#fff", border: "1px solid #eee", borderRadius: 6, padding: "2px 8px", fontWeight: 500 },
    customNote: { fontSize: 12, color: "#6a1b9a", background: "#f3e5f5", borderRadius: 6, padding: "3px 8px", fontStyle: "italic", width: "fit-content" },
    typeBadge: { fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, flexShrink: 0, whiteSpace: "nowrap" as const },
    deleteBtn: { background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
};

export default SavedRecipesPanel;
