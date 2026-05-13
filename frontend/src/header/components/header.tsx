import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./header.css";

const slides = [
    {
        id: 1,
        sub: "Discover Your Next",
        title: "Favourite Dish",
        location: "AI-Powered Recipe Suggestions",
        img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2070&q=80",
    },
    {
        id: 2,
        sub: "Cook Like a",
        title: "Chef",
        location: "Step-by-Step Guided Recipes",
        img: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=2070&q=80",
    },
    {
        id: 3,
        sub: "Explore World",
        title: "Cuisines",
        location: "From Italian to Thai & Beyond",
        img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2070&q=80",
    },
    {
        id: 4,
        sub: "Healthy & ",
        title: "Delicious",
        location: "Nutritious Meals Tailored for You",
        img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=2070&q=80",
    },
    {
        id: 5,
        sub: "Turn Ingredients",
        title: "Into Magic",
        location: "Just Type What You Have",
        img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=2070&q=80",
    },
];

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const overlayRef = useRef<any>(null);
    const tlRef = useRef<any>(null);

    useEffect(() => {
        const overlay = overlayRef.current;
        if (overlay) overlay.style.display = "none";

        // Set initial clip-paths
        gsap.set(["#hero-1 h2, #hero-1 h1, #hero-1 h3"], {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        });
        const others = slides
            .slice(1)
            .map(
                (s) =>
                    `#hero-${s.id} h2, #hero-${s.id} h1, #hero-${s.id} h3`
            )
            .join(", ");
        gsap.set([others], {
            clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
        });

        const tl = gsap.timeline({ repeat: -1, yoyo: true, ease: "expo.out" });
        tlRef.current = tl;

        for (let i = 1; i < slides.length; i++) {
            tl.to(`#hero-${i} h2`, {
                duration: 0.9,
                clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
                delay: 3,
            })
                .to(`#hero-${i} h1`, { duration: 0.9, clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" }, "-=0.3")
                .to(`#hero-${i} h3`, { duration: 0.9, clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" }, "-=0.3")
                .to(`#hero-${i} .hero-image`, { duration: 0.7, clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" }, "-=1")
                .to(`#hero-${i + 1} h2`, { duration: 0.9, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" })
                .to(`#hero-${i + 1} h1`, { duration: 0.9, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }, "-=0.3")
                .to(`#hero-${i + 1} h3`, { duration: 0.9, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }, "-=0.3");
        }

        return () => { tl.kill(); };
    }, []);

    const toggleMenu = () => {
        const overlay = overlayRef.current;
        if (!overlay) return;

        if (!menuOpen) {
            overlay.style.display = "block";
            gsap.to(overlay, {
                duration: 1,
                clipPath: "polygon(0% 0%, 100% 0, 100% 100%, 0% 100%)",
                ease: "expo.in",
            });
        } else {
            gsap.to(overlay, {
                duration: 1,
                clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
                ease: "expo.out",
                onComplete: () => { if (overlay) overlay.style.display = "none"; },
            });
        }
        setMenuOpen(!menuOpen);
    };

    return (
        <div className="page-wrap">
            <header className="page-header">
                {/* <nav>

                    <ul>
                        <li className="nav-link">About Us</li>
                        <li className="nav-link">Contact Us</li>
                        <li
                            id="burger"
                            className={menuOpen ? "active" : ""}
                            onClick={toggleMenu}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </li>
                    </ul>
                </nav> */}

                <main className="header-slider">
                    {slides.map((slide) => (
                        <article
                            className="header-slide"
                            key={slide.id}
                            id={`hero-${slide.id}`}
                            style={{ "--i": 6 - slide.id } as React.CSSProperties}
                        >
                            <div className="hero-info">
                                <h2>{slide.sub}</h2>
                                <h1>{slide.title}</h1>
                                <h3>{slide.location}</h3>
                            </div>
                            <div
                                className="hero-image"
                                style={{ backgroundImage: `url('${slide.img}')` }}
                            ></div>
                        </article>
                    ))}
                </main>
            </header>

            <section className="header-overlay" ref={overlayRef} style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" }}>
                <ul className="level-1">
                    <li>
                        <h3>Recipes</h3>
                        <ul className="level-2">
                            <li>
                                <p>By Cuisine</p>
                                <ul className="level-3">
                                    {["Italian", "Mexican", "Indian", "Chinese", "Japanese", "Thai", "French", "Mediterranean", "American", "Greek", "Spanish", "Korean", "Middle Eastern"].map(c => <li key={c}>{c}</li>)}
                                </ul>
                            </li>
                            <li>
                                <p>By Diet</p>
                                <ul className="level-3">
                                    {["Vegan", "Vegetarian", "Keto", "Paleo", "Gluten-Free", "Dairy-Free", "Low-Carb", "High-Protein"].map(c => <li key={c}>{c}</li>)}
                                </ul>
                            </li>
                            <li>
                                <p>By Meal</p>
                                <ul className="level-3">
                                    {["Breakfast", "Lunch", "Dinner", "Snacks", "Desserts", "Drinks", "Soups", "Salads"].map(c => <li key={c}>{c}</li>)}
                                </ul>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <h3>AI Tools</h3>
                        <ul>
                            <li>Generate Recipe from Ingredients</li>
                            <li>Meal Plan Generator</li>
                            <li>Nutrition Analyser</li>
                            <li>Substitute Finder</li>
                            <li>Cooking Timer Assistant</li>
                        </ul>
                        <p><small>More tools...</small></p>
                    </li>
                    <li>
                        <h3>Resources</h3>
                        <ul>
                            <li>Cooking Guides</li>
                            <li>Kitchen Essentials</li>
                            <li>Blog & Tips</li>
                        </ul>
                        <p><small>More resources...</small></p>
                    </li>
                    <li>
                        <h3>About</h3>
                        <ul>
                            <li>Our Story</li>
                            <li>Work With Us</li>
                            <li>Instagram</li>
                            <li>YouTube</li>
                        </ul>
                    </li>
                </ul>
            </section>
        </div>
    );
}