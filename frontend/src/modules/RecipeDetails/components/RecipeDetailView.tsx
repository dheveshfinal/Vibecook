import React, { useState } from "react";
import type { Recipe } from "../../recipes/types";
import { RecipeChat } from "../../chat/components/recipeChat";
import { useProfile } from "../../profile/hooks/useProfile";
import CustomizationModal from "../../Customization/components/CustomizationModal";


interface RecipeDetailViewProps {
    recipe: Recipe;
    onBack: () => void;
    onDelete: (db_id: string) => void;
    onRefresh: () => Promise<void>;
    onStartCooking: () => void;
}

const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, onBack, onDelete, onRefresh, onStartCooking }) => {
    const { profile, toggleSaveRecipe, customizeRecipe } = useProfile();
    const [imgPos, setImgPos] = useState({ x: 50, y: 50 });
    const [isHoveringImg, setIsHoveringImg] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);

    const handleSaveCustomization = async (data: any) => {
        if (!recipe.db_id) return;
        await customizeRecipe(recipe.db_id, data);
        setShowCustomize(false);
        if (onRefresh) await onRefresh();
        alert("Recipe customized! Your version is now saved in your profile.");
    };


    const ingredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : (recipe.ingredients || "").split("\n").filter(i => i.trim());

    const steps = Array.isArray(recipe.steps)
        ? recipe.steps
        : (recipe.steps || "").split("\n").filter(s => s.trim());

    const cleanStep = (s: string) => s.replace(/^\d+[\.\)]\s*[\.\)]?\s*/, "").trim();

    const parseIngredient = (raw: string): { name: string; amount: string } => {
        const noIndex = raw.replace(/^\d+\.\s*/, "").trim();
        const match = noIndex.match(
            /^([\d½¼¾⅓⅔\s\/\.\-]+(cup|cups|tsp|tbsp|oz|lb|lbs|g|kg|ml|l|clove|cloves|medium|large|small|bunch|pinch|inch|piece|pieces|whole|slice|slices|tbs|sprig|sprigs|pod|pods)?s?\b\.?)\s+(.+)/i
        );
        if (match) return { amount: match[1].trim(), name: match[3].trim() };
        return { amount: "", name: noIndex };
    };

    const displayTitle = (recipe.title?.includes("www.") || recipe.title?.includes("Doolittle"))
        ? "Recipe"
        : (recipe.title || "Recipe");

    const handleImgMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setImgPos({ x, y });
    };

    return (
        // ✅ Fix: outer wrapper takes full height, inner page scrolls
        <div style={styles.shell}>
            <div style={styles.page}>

                {/* ── Hero Image with pan-on-hover ── */}
                <div
                    style={styles.heroWrap}
                    onMouseMove={handleImgMouseMove}
                    onMouseEnter={() => setIsHoveringImg(true)}
                    onMouseLeave={() => {
                        setIsHoveringImg(false);
                        setImgPos({ x: 50, y: 50 });
                    }}
                >
                    {recipe.img ? (
                        <img
                            src={recipe.img}
                            alt={displayTitle}
                            title={displayTitle}
                            style={{
                                ...styles.heroImg,
                                transform: isHoveringImg ? "scale(1.12)" : "scale(1)",
                                transformOrigin: `${imgPos.x}% ${imgPos.y}%`,
                                cursor: isHoveringImg ? "crosshair" : "default",
                            }}
                        />
                    ) : (
                        <div style={styles.heroFallback}>🍽️</div>
                    )}

                    {/* Gradient overlay */}
                    <div style={styles.heroOverlay} />

                    {/* Title Overlay */}


                    {/* Zoom hint */}
                    {isHoveringImg && (
                        <div style={styles.zoomHint}>🔍 Move cursor to explore</div>
                    )}

                    <button style={styles.backBtn} onClick={onBack}>←</button>
                    <div style={styles.topRight}>
                        <button
                            style={{
                                ...styles.iconBtn,
                                color: (profile?.recipes_saved_ids?.includes(recipe.db_id!) || false) ? "#FFD700" : "#999",
                                fontSize: "20px"
                            }}
                            title={(profile?.recipes_saved_ids?.includes(recipe.db_id!) || false) ? "Unsave" : "Save"}
                            onClick={() => toggleSaveRecipe(recipe.db_id!, (profile?.recipes_saved_ids?.includes(recipe.db_id!) || false))}
                        >
                            {(profile?.recipes_saved_ids?.includes(recipe.db_id!) || false) ? "★" : "☆"}
                        </button>
                        <button style={styles.iconBtn} title="Refresh" onClick={onRefresh}>↻</button>
                        <button
                            style={{ ...styles.iconBtn, ...styles.deleteIconBtn }}
                            title="Delete"
                            onClick={() => onDelete(recipe.db_id!)}
                        >🗑</button>

                    </div>
                </div>

                {/* ── Title Card ── */}
                <div style={styles.titleCard}>
                    <h1 style={styles.title}>{displayTitle}</h1>

                    <div style={styles.badgeRow}>
                        {recipe.cuisine && <span style={styles.badge}>{recipe.cuisine}</span>}
                        {recipe.spice && recipe.spice !== "None" && (
                            <span style={{ ...styles.badge, ...styles.badgeSpice }}>🔥 {recipe.spice}</span>
                        )}
                        {recipe.diet && (
                            <span style={{
                                ...styles.badge,
                                ...(recipe.diet === "Veg" ? styles.badgeVeg
                                    : recipe.diet === "Vegan" ? styles.badgeVegan
                                        : styles.badgeNonVeg)
                            }}>
                                {recipe.diet}
                            </span>
                        )}
                        {recipe.time && <span style={styles.badge}>⏱ {recipe.time}</span>}
                    </div>

                    <div style={styles.actionRow}>
                        <button style={styles.primaryBtn} onClick={onStartCooking}>▷  Start Cooking</button>
                        <button style={styles.secondaryBtn} onClick={() => setShowCustomize(true)}>🍴  Customize Recipe</button>
                    </div>
                </div>

                {/* ── Ingredients + Steps ── */}
                <div style={styles.twoCol}>

                    {/* Ingredients */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>Ingredients</h2>
                        {ingredients.map((raw, idx) => {
                            const { name, amount } = parseIngredient(raw);
                            const isHeader = !amount && name.endsWith(":");
                            return isHeader ? (
                                <div key={idx} style={styles.ingredientHeader}>{name}</div>
                            ) : (
                                <div key={idx} style={styles.ingredientRow}>
                                    <span style={styles.ingredientName}>{name}</span>
                                    {amount && <span style={styles.ingredientAmount}>{amount}</span>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Instructions */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>Instructions</h2>
                        <div style={styles.stepList}>
                            {steps.map((step, idx) => {
                                const text = cleanStep(step);
                                if (!text) return null;
                                const isHeader = text.endsWith(":");
                                return isHeader ? (
                                    <div key={idx} style={styles.stepHeader}>{text}</div>
                                ) : (
                                    <div key={idx} style={styles.stepRow}>
                                        <div style={styles.stepNumber}>{idx + 1}</div>
                                        <p style={styles.stepText}>{text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

            {/* AI Chat Assistant */}
            <RecipeChat
                recipeId={recipe.db_id || recipe.title || "unknown"}
                recipeTitle={recipe.title || "Recipe"}
            />

            {showCustomize && (
                <CustomizationModal
                    recipe={{
                        ...recipe,
                        id: recipe.db_id,
                        title: displayTitle,
                        ingredients: ingredients,
                        steps: steps
                    }}
                    onClose={() => setShowCustomize(false)}
                    onSave={handleSaveCustomization}
                />
            )}
        </div>

    );
};

const styles: Record<string, React.CSSProperties> = {

    /* ── Layout shells ── */
    shell: {
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "#f7f2ed",
        display: "flex",
        flexDirection: "column",
    },
    page: {
        flex: 1,
        overflowY: "auto",         // ✅ THIS is the scroll container
        background: "#f7f2ed",
        paddingBottom: "60px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },

    /* ── Hero ── */
    heroWrap: {
        position: "relative",
        width: "100%",
        height: "300px",
        overflow: "hidden",
        background: "#1a1a1a",
        flexShrink: 0,
    },
    heroImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        display: "block",
        transition: "transform 0.15s ease, transform-origin 0s",  // smooth zoom, instant origin
        willChange: "transform",
    },
    heroFallback: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "80px",
        background: "linear-gradient(135deg, #FF7A3D22, #FF7A3D55)",
    },
    heroOverlay: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)",
        pointerEvents: "none",
    },
    heroTitleOverlay: {
        position: "absolute",
        bottom: "24px",
        left: "28px",
        right: "28px",
        color: "white",
        fontSize: "28px",
        fontWeight: 900,
        zIndex: 3,
        textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        letterSpacing: "-0.5px",
        pointerEvents: "none",
    },
    zoomHint: {
        position: "absolute",
        bottom: "14px",
        right: "16px",
        background: "rgba(0,0,0,0.55)",
        color: "white",
        fontSize: "12px",
        fontWeight: 600,
        padding: "5px 12px",
        borderRadius: "20px",
        pointerEvents: "none",
        backdropFilter: "blur(4px)",
    },
    backBtn: {
        position: "absolute",
        top: "16px",
        left: "20px",
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        border: "none",
        background: "rgba(255,255,255,0.92)",
        fontSize: "18px",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    topRight: {
        position: "absolute",
        top: "16px",
        right: "20px",
        display: "flex",
        gap: "10px",
    },
    iconBtn: {
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        border: "none",
        background: "rgba(255,255,255,0.92)",
        fontSize: "16px",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    },
    deleteIconBtn: {
        background: "rgba(255,77,77,0.88)",
        color: "white",
    },

    /* ── Title Card ── */
    titleCard: {
        background: "white",
        margin: "0 20px",
        marginTop: "-28px",
        borderRadius: "20px",
        padding: "24px 28px 22px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        position: "relative",
        zIndex: 2,
    },
    title: {
        fontSize: "24px",
        fontWeight: 800,
        color: "#1a1a1a",
        margin: "0 0 14px 0",
        lineHeight: 1.3,
        letterSpacing: "-0.3px",
    },
    badgeRow: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "20px",
    },
    badge: {
        padding: "5px 13px",
        backgroundColor: "#f2f2f2",
        color: "#555",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: 600,
    },
    badgeSpice: { backgroundColor: "#fff3e8", color: "#e07020" },
    badgeVeg: { backgroundColor: "#edfaf3", color: "#22a05b" },
    badgeVegan: { backgroundColor: "#e0f7fa", color: "#0e7490" },
    badgeNonVeg: { backgroundColor: "#ffeaea", color: "#c0392b" },

    actionRow: {
        display: "flex",
        gap: "12px",
    },
    primaryBtn: {
        flex: 1,
        padding: "13px 0",
        backgroundColor: "#FF7A3D",
        color: "white",
        border: "none",
        borderRadius: "12px",
        fontSize: "15px",
        fontWeight: 700,
        cursor: "pointer",
    },
    secondaryBtn: {
        flex: 1,
        padding: "13px 0",
        backgroundColor: "#fff3e8",
        color: "#FF7A3D",
        border: "none",
        borderRadius: "12px",
        fontSize: "15px",
        fontWeight: 700,
        cursor: "pointer",
    },

    /* ── Two Column ── */
    twoCol: {
        display: "grid",
        gridTemplateColumns: "1fr 1.6fr",
        gap: "16px",
        margin: "16px 20px 0",
        alignItems: "start",      // ✅ cards don't stretch to equal height
    },
    card: {
        background: "white",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
    },
    cardTitle: {
        fontSize: "17px",
        fontWeight: 800,
        color: "#1a1a1a",
        margin: "0 0 16px 0",
        letterSpacing: "-0.2px",
    },

    /* Ingredients */
    ingredientHeader: {
        fontSize: "11px",
        fontWeight: 700,
        color: "#FF7A3D",
        textTransform: "uppercase" as const,
        letterSpacing: "0.8px",
        padding: "12px 0 4px",
    },
    ingredientRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #f3f3f3",
        gap: "12px",
    },
    ingredientName: {
        fontSize: "14px",
        color: "#000",
        fontWeight: 500,
        lineHeight: 1.4,
        flex: 1,
    },
    ingredientAmount: {
        fontSize: "13px",
        color: "#999",
        fontWeight: 400,
        whiteSpace: "nowrap" as const,
        flexShrink: 0,
    },

    /* Steps */
    stepList: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "16px",
    },
    stepHeader: {
        fontSize: "11px",
        fontWeight: 700,
        color: "#FF7A3D",
        textTransform: "uppercase" as const,
        letterSpacing: "0.8px",
        paddingTop: "8px",
    },
    stepRow: {
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
    },
    stepNumber: {
        minWidth: "30px",
        height: "30px",
        borderRadius: "50%",
        backgroundColor: "#FF7A3D",
        color: "white",
        fontSize: "13px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: "1px",
    },
    stepText: {
        fontSize: "14px",
        color: "#000",
        lineHeight: 1.65,
        margin: 0,
        paddingTop: "4px",
    },
};

export default RecipeDetailView;
