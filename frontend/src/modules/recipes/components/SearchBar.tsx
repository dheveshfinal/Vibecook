// components/SearchBar.tsx
import React, { useState, useEffect, useRef } from "react";
import type { Recipe } from "../types";
import { recipeService } from "../service/recipeService";
import "./SearchBar.css";

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
        <div ref={ref} className="sb-wrapper">
            <div className="sb-container">
                <svg
                    className="sb-svg"
                    viewBox="0 0 420 60"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Pill bar — explicit x/y/width/height so stroke is visible */}
                    <rect className="bar" x="5" y="5" width="410" height="50" />

                    <g className="magnifier">
                        <circle className="glass" />
                        <line className="handle" x1="32" y1="32" x2="44" y2="44" />
                    </g>

                    <g className="sparks">
                        <circle className="spark" />
                        <circle className="spark" />
                        <circle className="spark" />
                    </g>

                    <g className="burst">
                        <circle className="particle circle" />
                        <path className="particle triangle" />
                        <circle className="particle circle" />
                        <path className="particle plus" />
                        <rect className="particle rect" />
                        <path className="particle triangle" />
                    </g>
                    <g className="burst">
                        <path className="particle plus" />
                        <circle className="particle circle" />
                        <path className="particle triangle" />
                        <rect className="particle rect" />
                        <circle className="particle circle" />
                        <path className="particle plus" />
                    </g>
                    <g className="burst">
                        <circle className="particle circle" />
                        <rect className="particle rect" />
                        <path className="particle plus" />
                        <path className="particle triangle" />
                        <rect className="particle rect" />
                        <path className="particle plus" />
                    </g>
                </svg>

                <input
                    className="sb-input"
                    type="search"
                    name="q"
                    placeholder="Search recipes, cuisines, diets..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query && setIsOpen(true)}
                    aria-label="Search recipes"
                />

                {query && (
                    <button className="sb-clear" onClick={() => setQuery("")}>✕</button>
                )}
            </div>

            {isOpen && (
                <div className="sb-dropdown">
                    {results.length === 0 ? (
                        <div className="sb-no-results">No recipes found</div>
                    ) : (
                        results.map((recipe) => (
                            <div
                                key={recipe.db_id}
                                className="sb-item"
                                onMouseDown={() => handleSelect(recipe)}
                            >
                                <img
                                    src={recipe.img}
                                    alt={recipe.title}
                                    className="sb-thumb"
                                    onError={(e) =>
                                    ((e.target as HTMLImageElement).src =
                                        "https://via.placeholder.com/40")
                                    }
                                />
                                <div className="sb-item-info">
                                    <div className="sb-item-title">{recipe.title}</div>
                                    <div className="sb-item-meta">
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

export default SearchBar;