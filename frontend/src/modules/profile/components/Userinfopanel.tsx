import React from "react";
import { useProfile } from "../hooks/useProfile";

const COLORS = {
    primary: "hsl(20, 85%, 56%)",
    primaryDark: "hsl(20, 85%, 45%)",
    bg: "hsl(24, 40%, 95%)",
    text: "hsl(0, 0%, 15%)",
    textMuted: "hsl(0, 0%, 45%)",
    success: "#22a05b",
};


interface InfoRowProps {
    label: string;
    value: React.ReactNode;
    icon?: string;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
    return (
        <div style={styles.infoRow}>
            {icon && <div style={styles.iconBox}>{icon}</div>}
            <div style={styles.infoContent}>
                <div style={styles.infoLabel}>{label}</div>
                <div style={styles.infoValue}>{value}</div>
            </div>
        </div>
    );
}

interface UserInfoPanelProps {
    profile: any;
    isOwnProfile: boolean;
}

const UserInfoPanel: React.FC<UserInfoPanelProps> = ({ profile, isOwnProfile }) => {
    const { updateProfile } = useProfile();
    const [isEditing, setIsEditing] = React.useState(false);
    const [tempUsername, setTempUsername] = React.useState(profile?.username || "");

    React.useEffect(() => {
        if (profile?.username) setTempUsername(profile.username);
    }, [profile?.username]);

    if (!profile) return null;

    const initials = profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("");

    const handleSave = async () => {
        await updateProfile({ username: tempUsername });
        setIsEditing(false);
    };

    return (
        <div style={styles.card}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.avatar}>{initials}</div>
                    <div>
                        <div style={styles.name}>{profile.display_name}</div>
                        {isEditing ? (
                            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                <input
                                    style={styles.editInput}
                                    value={tempUsername}
                                    onChange={e => setTempUsername(e.target.value)}
                                    placeholder="Username"
                                />
                                <button style={styles.miniSaveBtn} onClick={handleSave}>✓</button>
                            </div>
                        ) : (
                            <div style={styles.username} onClick={() => isOwnProfile && setIsEditing(true)}>
                                @{profile.username || "username"} {isOwnProfile && "✎"}
                            </div>
                        )}
                    </div>
                </div>
                <span style={styles.badge}>{profile.cooking_skill}</span>
            </div>

            <div style={styles.divider} />

            <div style={styles.sectionLabel}>Account Details</div>
            <InfoRow icon="✉️" label="Email" value={profile.email} />
            <InfoRow icon="📅" label="Joined" value={new Date(profile.member_since).toLocaleDateString()} />
            <InfoRow
                icon="🕐"
                label="Last Active"
                value={
                    <span style={{ color: COLORS.success, fontWeight: 600 }}>
                        Today, 6:30 PM
                    </span>
                }
            />



            {isOwnProfile && (
                <button style={styles.editBtn} onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Cancel Edit" : "Edit Profile Info"}
                </button>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    card: {
        background: "#fff",
        borderRadius: 20,
        padding: "32px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
        border: "1px solid #ece8e3",
        width: "100%",
        maxWidth: 520,
        boxSizing: "border-box",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 18,
        fontWeight: 700,
        flexShrink: 0,
    },
    name: {
        fontSize: 17,
        fontWeight: 700,
        color: COLORS.text,
        letterSpacing: "-0.2px",
    },
    username: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    badge: {
        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
        color: "#fff",
        padding: "5px 14px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
    },
    divider: {
        height: 1,
        background: "#ece8e3",
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: 700,
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 14,
    },
    infoRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid #f5f3f0",
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        background: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        flexShrink: 0,
    },
    infoContent: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 2,
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: 600,
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    infoValue: {
        fontSize: 14,
        fontWeight: 500,
        color: COLORS.text,
    },
    editBtn: {
        marginTop: 24,
        width: "100%",
        padding: "12px",
        borderRadius: 12,
        border: "1px solid #ece8e3",
        background: COLORS.bg,
        color: COLORS.text,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
    },
    editInput: {
        padding: "4px 8px",
        borderRadius: "6px",
        border: "1px solid #ddd",
        fontSize: "13px",
        width: "120px",
    },
    miniSaveBtn: {
        padding: "4px 8px",
        borderRadius: "6px",
        border: "none",
        background: COLORS.success,
        color: "#fff",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 700,
    },
};

export default UserInfoPanel;