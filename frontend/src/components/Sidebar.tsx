import React, { useState } from "react";
import { authService } from "../modules/Auth/service/authService";
import { profileService } from "../modules/profile/service/profileService";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string, params?: any) => void;
  isOpen: boolean;
  onToggle: () => void;
}

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

const ORANGE = "#f07030";

export default function Sidebar({ activePage, onNavigate, isOpen, onToggle }: SidebarProps) {
  const role = authService.getUserRole();

  const filteredItems = navItems.filter(item => {
    if (item.path === 'monitor') return role === 'admin';
    return true;
  });


  return (
    <>
      {/* Hamburger Toggle */}
      {!isOpen && (
        <button style={styles.hamburgerFixed} onClick={onToggle}>
          <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={24} height={24}>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <aside style={{ ...styles.sidebar, left: isOpen ? 0 : -280 }}>
        {/* Brand & Close */}
        <div style={styles.brandRow}>
          <div style={styles.brand}>
            <img src="/logo.png" alt="VibeCook Logo" style={styles.brandLogo} />
          </div>
          <button style={styles.closeBtn} onClick={onToggle}>
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
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

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Premium card */}
        <div style={styles.premiumCard}>
          <div style={styles.premiumTitle}>Premium Features</div>
          <div style={styles.premiumSub}>Unlock personalized meal plans</div>
          <button style={styles.upgradeBtn}>Upgrade Now</button>
        </div>
      </aside>
    </>
  );
}

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
    bottom: 0,
    zIndex: 1000,
    overflowY: "auto",
    transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "4px 0 20px rgba(0,0,0,0.05)",
  },
  hamburgerFixed: {
    position: "fixed",
    top: 20,
    left: 20,
    zIndex: 900,
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: "50%",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    color: ORANGE,
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
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
    mixBlendMode: "multiply",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#888",
    padding: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    position: "relative",
    margin: "0 12px 16px",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    background: "#f8f9fa",
    borderRadius: 12,
    border: "1px solid #eee",
  },
  searchInput: {
    border: "none",
    background: "none",
    outline: "none",
    fontSize: 14,
    width: "100%",
    color: "#333",
  },
  searchResults: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    border: "1px solid #eee",
    zIndex: 1100,
    overflow: "hidden",
  },
  searchResultItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px",
    cursor: "pointer",
    transition: "background 0.2s",
    borderBottom: "1px solid #f8f9fa",
  },
  searchResultAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
  },
  searchResultUser: {
    fontSize: 12,
    color: "#888",
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