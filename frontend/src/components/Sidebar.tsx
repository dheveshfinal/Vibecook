interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

import { authService } from "../modules/Auth/service/authService";

const navItems: NavItem[] = [
  {
    label: "Home",
    path: "home",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Explore",
    path: "explore",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
        <circle cx={11} cy={11} r={8} />
        <line x1={21} y1={21} x2={16.65} y2={16.65} />
      </svg>
    ),
  },
  {
    label: "AI Assistant",
    path: "ai",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: "Profile",
    path: "profile",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx={12} cy={7} r={4} />
      </svg>
    ),
  },
  {
    label: "Monitor",
    path: "monitor",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const role = authService.getUserRole();
  const filteredItems = navItems.filter(item => {
    if (item.path === 'monitor') return role === 'admin';
    return true;
  });

  return (
    <aside style={styles.sidebar}>
      {/* Brand */}
      <div style={styles.brand}>
        <img src="/logo.png" alt="VibeCook Logo" style={styles.brandLogo} />
      </div>

      <div style={styles.divider} />

      {/* Nav items */}
      {filteredItems.map((item) => (
        <div
          key={item.label}
          style={{
            ...styles.navItem,
            ...(activePage === item.path ? styles.navItemActive : {}),
          }}
          onClick={() => onNavigate(item.path)}
        >
          {item.icon}
          {item.label}
        </div>
      ))}

      {/* Quick AI Help */}
      {/* <div style={styles.navQuick} onClick={() => onNavigate("ai")}>
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        Quick AI Help
      </div> */}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Premium card */}
      <div style={styles.premiumCard}>
        <div style={styles.premiumTitle}>Premium Features</div>
        <div style={styles.premiumSub}>Unlock personalized meal plans</div>
        <button style={styles.upgradeBtn}>Upgrade Now</button>
      </div>
    </aside>
  );
}

const ORANGE = "#f07030";

const styles: Record<string, React.CSSProperties> = {
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
  brandLogo: {
    width: "100%",
    maxWidth: 200,
    height: "auto",
    objectFit: "contain",
    mixBlendMode: "multiply", // removes white background
  },
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
};