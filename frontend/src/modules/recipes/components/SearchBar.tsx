// components/SearchBar.tsx
import React, { useState, useEffect, useRef } from "react";
import type { Recipe } from "../types";
import { recipeService } from "../service/recipeService";

interface SearchBarProps {
    onSelectRecipe: (recipe: Recipe) => void;
    diet?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectRecipe, diet }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Recipe[]>([]);
    const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        recipeService.getRecipes(diet).then(setAllRecipes).catch(console.error);
    }, [diet]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }
        const q = query.toLowerCase();
        const filtered = allRecipes.filter(
            (r) =>
                r.title.toLowerCase().includes(q) ||
                r.cuisine.toLowerCase().includes(q) ||
                r.diet.toLowerCase().includes(q)
        );
        setResults(filtered);
        setIsOpen(true);
    }, [query, allRecipes]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (recipe: Recipe) => {
        setQuery("");
        setIsOpen(false);
        onSelectRecipe(recipe);
    };

    return (
        <div ref={ref} style={styles.wrapper}>
            <div style={styles.inputWrapper}>
                <span style={styles.icon}>🔍</span>
                <input
                    style={styles.input}
                    type="text"
                    placeholder="Search recipes, cuisines, diets..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query && setIsOpen(true)}
                />
                {query && (
                    <button style={styles.clear} onClick={() => setQuery("")}>✕</button>
                )}
            </div>

            {isOpen && (
                <div style={styles.dropdown}>
                    {results.length === 0 ? (
                        <div style={styles.noResults}>No recipes found</div>
                    ) : (
                        results.map((recipe) => (
                            <div
                                key={recipe.db_id}
                                style={styles.item}
                                onMouseDown={() => handleSelect(recipe)}
                            >
                                <img
                                    src={recipe.img}
                                    alt={recipe.title}
                                    style={styles.thumb}
                                    onError={(e) =>
                                    ((e.target as HTMLImageElement).src =
                                        "https://via.placeholder.com/40")
                                    }
                                />
                                <div style={styles.itemInfo}>
                                    <div style={styles.itemTitle}>{recipe.title}</div>
                                    <div style={styles.itemMeta}>
                                        {recipe.cuisine} · {recipe.diet} · {recipe.time}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        position: "relative",
        width: "100%",
        maxWidth: 480,
    },
    inputWrapper: {
        display: "flex",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        padding: "8px 14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        gap: 8,
    },
    icon: {
        fontSize: 16,
        color: "#888",
    },
    input: {
        flex: 1,
        border: "none",
        outline: "none",
        fontSize: 14,
        color: "#1a1a1a",
        background: "transparent",
    },
    clear: {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        color: "#aaa",
        padding: 0,
    },
    dropdown: {
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        right: 0,
        backgroundColor: "white",
        borderRadius: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        zIndex: 100,
        maxHeight: 320,
        overflowY: "auto",
    },
    noResults: {
        padding: "16px",
        textAlign: "center",
        color: "#888",
        fontSize: 14,
    },
    item: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        cursor: "pointer",
        borderBottom: "1px solid #f0e8e0",
        transition: "background 0.15s",
    },
    thumb: {
        width: 40,
        height: 40,
        borderRadius: 8,
        objectFit: "cover",
        flexShrink: 0,
    },
    itemInfo: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: "#1a1a1a",
    },
    itemMeta: {
        fontSize: 12,
        color: "#888",
    },
};

export default SearchBar;