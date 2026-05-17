import React, { useEffect, useState } from "react";

const COLORS = {
    primary: "hsl(20, 85%, 56%)",
    bg: "hsl(24, 40%, 95%)",
    text: "hsl(0, 0%, 15%)",
    textMuted: "hsl(0, 0%, 45%)",
};

interface FollowersModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "followers" | "following";
    username: string;
    onUserClick: (username: string) => void;
}

export default function FollowersModal({ isOpen, onClose, type, username, onUserClick }: FollowersModalProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setLoading(true);

        const fetchUsers = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/profile/${username}/${type}`
                );
                if (response.ok && isMounted) {
                    const data = await response.json();
                    setUsers(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchUsers();

        return () => {
            isMounted = false;
        };
    }, [isOpen, type, username]);

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>{type === "followers" ? "Followers" : "Following"}</h3>
                    <button style={styles.closeBtn} onClick={onClose}>
                        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                <div style={styles.content}>
                    {loading ? (
                        <div style={styles.loading}>Loading...</div>
                    ) : users.length === 0 ? (
                        <div style={styles.empty}>No {type} found.</div>
                    ) : (
                        <div style={styles.list}>
                            {users.map(u => (
                                <div key={u.id} style={styles.userItem} onClick={() => { onClose(); onUserClick(u.username); }}>
                                    <div style={styles.avatar}>
                                        {u.avatar_url ? <img src={u.avatar_url} style={styles.avatarImg} alt={u.username} /> : "👤"}
                                    </div>
                                    <div style={styles.userInfo}>
                                        <div style={styles.name}>{u.display_name}</div>
                                        <div style={styles.username}>@{u.username}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center"
    },
    modal: {
        backgroundColor: "#fff",
        borderRadius: "16px",
        width: "90%",
        maxWidth: "400px",
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        overflow: "hidden"
    },
    header: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: "1px solid #eee"
    },
    title: { margin: 0, fontSize: "18px", fontWeight: 700, color: COLORS.text, textTransform: "capitalize" },
    closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#666", padding: "4px" },
    content: { flex: 1, overflowY: "auto", padding: "16px 0" },
    loading: { padding: "32px", textAlign: "center", color: COLORS.textMuted },
    empty: { padding: "32px", textAlign: "center", color: COLORS.textMuted },
    list: { display: "flex", flexDirection: "column" },
    userItem: {
        display: "flex", alignItems: "center", gap: "16px",
        padding: "12px 24px", cursor: "pointer",
        transition: "background 0.2s"
    },
    avatar: {
        width: "40px", height: "40px", borderRadius: "50%",
        background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
    },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    userInfo: { flex: 1 },
    name: { fontSize: "15px", fontWeight: 600, color: COLORS.text },
    username: { fontSize: "13px", color: COLORS.textMuted }
};
