import React from "react";
import type { Recipe } from "../types";

const spiceConfig: Record<string, { color: string; bg: string; emoji: string }> = {
    None: { color: "#555", bg: "rgba(255,255,255,0.92)", emoji: "◯" },
    Mild: { color: "#22a05b", bg: "rgba(240,255,248,0.95)", emoji: "🌶" },
    Medium: { color: "#e07020", bg: "rgba(255,245,235,0.95)", emoji: "🌶" },
    Hot: { color: "#c0392b", bg: "rgba(255,235,235,0.95)", emoji: "🌶🌶" },
};

const dietConfig: Record<string, { color: string; bg: string }> = {
    Veg: { color: "#22a05b", bg: "rgba(240,255,248,0.95)" },
    "Non-Veg": { color: "#c0392b", bg: "rgba(255,235,235,0.95)" },
    Vegan: { color: "#0e7490", bg: "rgba(224,247,250,0.95)" },
};

interface RecipeCardProps {
    recipe: Recipe;
    onClick?: (recipe: Recipe) => void;
}

function ClockIcon() {
    return (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={13} height={13}>
            <circle cx={12} cy={12} r={10} />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
    const spice = spiceConfig[recipe.spice] || spiceConfig.None;
    const diet = dietConfig[recipe.diet] || dietConfig.Veg;

    return (
        <div style={styles.card} onClick={() => onClick?.(recipe)}>
            <div style={styles.imgWrap}>
                <img src={recipe.img} alt={recipe.title} title={recipe.title} style={styles.img} />
                <div style={styles.imgOverlay} />
                <div style={styles.titleOverlay}>{recipe.title}</div>
                <div style={{ ...styles.badge, color: spice.color, background: spice.bg }}>
                    {spice.emoji} {recipe.spice}
                </div>
                <div style={{ ...styles.dietBadge, color: diet.color, background: diet.bg }}>
                    {recipe.diet}
                </div>
            </div>
            <div style={styles.body}>
                <div style={styles.meta}>
                    <ClockIcon />
                    <span style={{ marginLeft: 4 }}>{recipe.time}</span>
                    <span style={{ margin: "0 6px", color: "#ddd" }}>•</span>
                    <span style={styles.cuisine}>{recipe.cuisine}</span>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    card: {
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        cursor: "pointer",
        transition: "transform 0.18s, box-shadow 0.18s",
    },
    imgWrap: { position: "relative", width: "100%", height: 180, overflow: "hidden" },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    badge: {
        position: "absolute",
        top: 10,
        right: 10,
        borderRadius: 50,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
    },
    dietBadge: {
        position: "absolute",
        top: 10,
        left: 10,
        borderRadius: 50,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
    },
    imgOverlay: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)",
        pointerEvents: "none",
    },
    titleOverlay: {
        position: "absolute",
        bottom: 12,
        left: 14,
        right: 14,
        color: "#fff",
        fontSize: 15,
        fontWeight: 700,
        zIndex: 1,
        textShadow: "0 1px 4px rgba(0,0,0,0.3)",
    },
    body: { padding: "14px 16px 16px" },
    meta: { display: "flex", alignItems: "center", fontSize: 13, color: "#888" },
    cuisine: { color: "#f07030", fontWeight: 600 },
};

export default RecipeCard;
