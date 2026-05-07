import { useState } from "react";

const recipes = {
  recommended: [
    {
      id: 1,
      title: "Creamy Chocolate Mousse",
      time: "30 min",
      cuisine: "French",
      spice: "None",
      spiceColor: "#555",
      spiceBg: "rgba(255,255,255,0.92)",
      img: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&q=80",
    },
    {
      id: 2,
      title: "Herbed Corn Bowl",
      time: "20 min",
      cuisine: "American",
      spice: "Mild",
      spiceColor: "#22a05b",
      spiceBg: "rgba(240,255,248,0.95)",
      img: "https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=400&q=80",
    },
    {
      id: 3,
      title: "Stuffed Grape Leaves",
      time: "45 min",
      cuisine: "Mediterranean",
      spice: "Medium",
      spiceColor: "#e07020",
      spiceBg: "rgba(255,245,235,0.95)",
      img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
    },
  ],
  popular: [
    {
      id: 4,
      title: "Seared Duck Breast",
      time: "40 min",
      cuisine: "French",
      spice: "Mild",
      spiceColor: "#22a05b",
      spiceBg: "rgba(240,255,248,0.95)",
      img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
    },
    {
      id: 5,
      title: "Caramel Date Pudding",
      time: "35 min",
      cuisine: "British",
      spice: "None",
      spiceColor: "#555",
      spiceBg: "rgba(255,255,255,0.92)",
      img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80",
    },
    {
      id: 6,
      title: "Roasted Tomato Bisque",
      time: "25 min",
      cuisine: "Italian",
      spice: "Mild",
      spiceColor: "#22a05b",
      spiceBg: "rgba(240,255,248,0.95)",
      img: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&q=80",
    },
  ],
};

const filters = ["Veg", "Non-Veg", "Spicy", "Mild", "Quick meals", "Healthy"];

const navItems = [
  {
    label: "Home",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Explore",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
        <circle cx={11} cy={11} r={8} />
        <line x1={21} y1={21} x2={16.65} y2={16.65} />
      </svg>
    ),
  },
  {
    label: "AI Assistant",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: "Profile",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx={12} cy={7} r={4} />
      </svg>
    ),
  },
];

interface Recipe {
  id: number;
  title: string;
  time: string;
  cuisine: string;
  spice: string;
  spiceColor: string;
  spiceBg: string;
  img: string;
}

function ClockIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={14} height={14}>
      <circle cx={12} cy={12} r={10} />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardImgWrap}>
        <img src={recipe.img} alt={recipe.title} style={styles.cardImg} />
        <div
          style={{
            ...styles.spiceBadge,
            color: recipe.spiceColor,
            background: recipe.spiceBg,
          }}
        >
          🔥 {recipe.spice}
        </div>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardTitle}>{recipe.title}</div>
        <div style={styles.cardMeta}>
          <ClockIcon />
          <span style={{ marginLeft: 4 }}>{recipe.time}</span>
          <span style={{ margin: "0 4px" }}>&nbsp;</span>
          <span style={styles.cuisineTag}>{recipe.cuisine}</span>
        </div>
      </div>
    </div>
  );
}

export default function ChefAI() {
  const [activeNav, setActiveNav] = useState("Home");
  const [activeFilter, setActiveFilter] = useState("Veg");
  const [searchVal, setSearchVal] = useState("");

  return (
    <div style={styles.root}>
      {/* ── SIDEBAR ── */}
      <aside style={styles.sidebar}>
        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.brandIcon}>🍳</div>
          <div>
            <div style={styles.brandName}>ChefAI</div>
            <div style={styles.brandSub}>Cooking Assistant</div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Nav */}
        {navItems.map((item) => (
          <div
            key={item.label}
            style={{
              ...styles.navItem,
              ...(activeNav === item.label ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveNav(item.label)}
          >
            {item.icon}
            {item.label}
          </div>
        ))}

        {/* Quick AI Help */}
        <div style={styles.navQuick}>
          <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Quick AI Help
        </div>

        {/* Premium card pinned to bottom */}
        <div style={{ flex: 1 }} />
        <div style={styles.premiumCard}>
          <div style={styles.premiumTitle}>Premium Features</div>
          <div style={styles.premiumSub}>Unlock personalized meal plans</div>
          <button style={styles.upgradeBtn}>Upgrade Now</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={styles.main}>
        <h1 style={styles.heroTitle}>Discover Delicious Recipes</h1>
        <p style={styles.heroSub}>Explore thousands of recipes tailored to your taste</p>

        {/* Search */}
        <div style={styles.searchBar}>
          <svg fill="none" stroke="#aaa" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
            <circle cx={11} cy={11} r={8} />
            <line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>
          <input
            style={styles.searchInput}
            placeholder="What do you want to cook today?"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
          <button style={styles.micBtn}>
            <svg fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1={12} y1={19} x2={12} y2={23} />
              <line x1={8} y1={23} x2={16} y2={23} />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          {filters.map((f) => (
            <div
              key={f}
              style={{
                ...styles.filterChip,
                ...(activeFilter === f ? styles.filterChipActive : {}),
              }}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </div>
          ))}
        </div>

        {/* Recommended */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>Recommended for you</div>
            <div style={styles.seeAll}>See all →</div>
          </div>
          <div style={styles.cardsRow}>
            {recipes.recommended.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </div>

        {/* Popular near you */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>Popular recipes near you</div>
            <div style={styles.seeAll}>See all →</div>
          </div>
          <div style={styles.cardsRow}>
            {recipes.popular.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── STYLES ── */
const ORANGE = "#f07030";

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    // Escape the global #root width/margin constraints entirely
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    background: "#f9f1eb",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    overflow: "hidden",
    zIndex: 0,
  },

  /* Sidebar */
  sidebar: {
    width: 280,
    minWidth: 280,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    gap: 4,
    borderRight: "1px solid #f0e8e0",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    overflowY: "auto",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 12px",
    marginBottom: 16,
  },
  brandIcon: {
    width: 48,
    height: 48,
    background: ORANGE,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    flexShrink: 0,
  },
  brandName: { fontSize: 18, fontWeight: 700, color: "#1a1a1a" },
  brandSub: { fontSize: 13, color: "#888" },
  divider: { height: 1, background: "#f0e8e0", margin: "8px 0" },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 500,
    color: "#555",
    transition: "background 0.15s",
  },
  navItemActive: {
    background: ORANGE,
    color: "#fff",
  },
  navQuick: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    background: ORANGE,
    color: "#fff",
    marginTop: 8,
  },
  premiumCard: {
    background: "#fff8f4",
    borderRadius: 16,
    padding: 16,
    border: "1px solid #f0e0d0",
    marginTop: 8,
  },
  premiumTitle: { fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 },
  premiumSub: { fontSize: 12, color: "#888", marginBottom: 12 },
  upgradeBtn: {
    width: "100%",
    background: ORANGE,
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 0",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },

  /* Main */
  main: {
    marginLeft: 280,
    flex: 1,
    overflowY: "auto",
    padding: "40px 48px",
  },
  heroTitle: { fontSize: 32, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 },
  heroSub: { fontSize: 15, color: "#888", marginBottom: 28 },

  /* Search */
  searchBar: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    borderRadius: 50,
    padding: "14px 20px",
    gap: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: 28,
    maxWidth: 760,
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 15,
    color: "#555",
    fontFamily: "inherit",
    background: "transparent",
  },
  micBtn: {
    width: 40,
    height: 40,
    background: ORANGE,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "none",
    flexShrink: 0,
  },

  /* Filters */
  filters: { display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap" },
  filterChip: {
    padding: "9px 20px",
    borderRadius: 50,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    border: "1.5px solid #e8ddd5",
    background: "#fff",
    color: "#444",
    transition: "all 0.15s",
  },
  filterChipActive: {
    background: ORANGE,
    color: "#fff",
    border: `1.5px solid ${ORANGE}`,
  },

  /* Sections */
  section: { marginBottom: 40 },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sectionTitle: { fontSize: 20, fontWeight: 700, color: "#1a1a1a" },
  seeAll: { fontSize: 14, color: ORANGE, fontWeight: 600, cursor: "pointer" },

  /* Cards */
  cardsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    cursor: "pointer",
    transition: "transform 0.18s, box-shadow 0.18s",
  },
  cardImgWrap: { position: "relative", width: "100%", height: 180, overflow: "hidden" },
  cardImg: { width: "100%", height: "100%", objectFit: "cover" },
  spiceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 50,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  cardBody: { padding: "14px 16px 16px" },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    color: "#888",
  },
  cuisineTag: { color: ORANGE, fontWeight: 600 },
};