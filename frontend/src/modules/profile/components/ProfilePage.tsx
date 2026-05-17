import React, { useState, useRef } from "react";
import { useProfile } from "../hooks/useProfile";
import { profileService } from "../service/profileService";
import CatLoader from "../../loading/components/Loading";
import UserInfoPanel from "../components/Userinfopanel";
import SavedRecipesPanel from "../components/Savedrecipespanel";
import FollowersModal from "../components/FollowersModal";
import { authService } from "../../Auth/service/authService";

const COLORS = {
    primary: "hsl(20, 85%, 56%)",
    primaryDark: "hsl(20, 85%, 45%)",
    bg: "hsl(24, 40%, 95%)",
    card: "hsla(0, 0%, 100%, 0.8)",
    text: "hsl(0, 0%, 15%)",
    textMuted: "hsl(0, 0%, 45%)",
    glass: "rgba(255, 255, 255, 0.7)",
    success: "#22a05b",
    danger: "#c62828",
    warning: "#f57c00",
};

const dietColors: Record<string, { bg: string; color: string }> = {
    Veg: { bg: "#e8f5e9", color: "#2e7d32" },
    "Non-Veg": { bg: "#fce4ec", color: "#c62828" },
    Vegan: { bg: "#e0f7fa", color: "#00695c" },
};

interface ProfilePageProps {
    username?: string;
    onBack?: (page: string, params?: any) => void;
    onRecipeClick?: (recipe: any) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ username, onBack, onRecipeClick }) => {
    const { profile: myProfile, loading: myLoading, updateProfile, uploadAvatar } = useProfile();
    const [viewedProfile, setViewedProfile] = useState<any>(null);
    const [viewLoading, setViewLoading] = useState(false);

    const isOwnProfile = !username || username === myProfile?.username;
    const profile = isOwnProfile ? myProfile : viewedProfile;
    const loading = isOwnProfile ? myLoading : viewLoading;
    const role = authService.getUserRole();
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const [uploading, setUploading] = useState(false);

    // Follow Stats Mode
    const [statsModal, setStatsModal] = useState<"followers" | "following" | null>(null);

    // Admin State
    const [recipeTitle, setRecipeTitle] = useState("");
    const [recipeImgSource, setRecipeImgSource] = useState<"upload" | "url">("url");
    const [recipeUrl, setRecipeUrl] = useState("");
    const [recipeFile, setRecipeFile] = useState<File | null>(null);
    const [docFile, setDocFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const recipeImgRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (q.length > 2) {
            setIsSearching(true);
            try {
                const results = await profileService.searchUsers(q);
                setSearchResults(results);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleUserNavigate = (targetUsername: string) => {
        if (onBack) onBack("profile"); // Clear params
        // Since we are already on ProfilePage, we need to trigger a re-navigation or update props.
        // App.tsx handles navigation via handleNavigate("profile", { username }).
        // We'll call onBack and then re-navigate if onBack is passed as handleNavigate from App.
        // Better: update URL/state in App.tsx. 
        // For now, if we are in App.tsx, handleNavigate updates state.

        // Actually, the simplest way is to just let the props update. 
        // We'll call onBack("profile", { username: targetUsername }) if onBack supports it.
        // Wait, onBack in App.tsx is handleNavigate("profile").
        // I should probably pass a real navigate function.

        // Let's assume onBack is the navigation handler from App.tsx.
        if (onBack) onBack("profile", { username: targetUsername });
        setSearchQuery("");
        setSearchResults([]);
    };

    React.useEffect(() => {
        if (username && username !== myProfile?.username) {
            setViewLoading(true);
            profileService.getProfile(username)
                .then(setViewedProfile)
                .catch(err => console.error("Error loading viewed profile:", err))
                .finally(() => setViewLoading(false));
        } else {
            setViewedProfile(null);
        }
    }, [username, myProfile?.username]);

    if (loading && !profile) return <CatLoader />;
    if (!profile) return <div style={{ padding: 48, textAlign: "center" }}>
        <h3>User not found</h3>
        <button style={styles.editBtn} onClick={() => onBack?.("profile")}>Go Back</button>
    </div>;

    const handleFollow = async () => {
        if (!profile) return;
        try {
            if (profile.is_following) {
                await profileService.unfollowUser(profile.id);
                setViewedProfile({ ...profile, is_following: false, followers_count: profile.followers_count - 1 });
            } else {
                await profileService.followUser(profile.id);
                setViewedProfile({ ...profile, is_following: true, followers_count: profile.followers_count + 1 });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            await uploadAvatar(file);
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await updateProfile(profile);
            setSaveMsg("Profile saved!");
        } catch {
            setSaveMsg("Error saving profile");
        } finally {
            setSaving(false);
            setEditMode(false);
            setTimeout(() => setSaveMsg(""), 2500);
        }
    };

    const validate = () => {
        if (!recipeTitle.trim()) return "Recipe title is missing!";
        if (recipeImgSource === "url" && !recipeUrl.trim()) return "Recipe image URL is missing!";
        if (recipeImgSource === "upload" && !recipeFile) return "Recipe image file is missing!";
        if (!docFile) return "Support document is missing!";
        return null;
    };

    const handleSubmitRecipe = async () => {
        setErrorMsg("");
        const error = validate();
        if (error) {
            setErrorMsg(error);
            return;
        }

        setSubmitting(true);
        try {
            await profileService.uploadRecipe(
                recipeTitle,
                recipeImgSource === "url" ? recipeUrl : undefined,
                recipeImgSource === "upload" ? (recipeFile || undefined) : undefined,
                docFile || undefined
            );

            alert("Success! Recipe and shared document have been stored.");
            setRecipeTitle("");
            setRecipeUrl("");
            setRecipeFile(null);
            setDocFile(null);
        } catch (err) {
            setErrorMsg("An error occurred during submission.");
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const avatarSrc = avatarPreview || profile.avatar_url;
    const diet = dietColors[profile.diet_type] || dietColors.Veg;

    return (
        <main style={styles.main}>
            {/* ── Header ── */}
            {/* Moving Search to Profile Header */}
            <div style={styles.profileHeader}>
                <div style={styles.searchWrap}>
                    <div style={styles.searchInner}>
                        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18} style={{ color: "#aaa" }}>
                            <circle cx={11} cy={11} r={8} />
                            <line x1={21} y1={21} x2={16.65} y2={16.65} />
                        </svg>
                        <input
                            style={styles.profileSearchInput}
                            placeholder="Find other foodies..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        {isSearching && <div style={styles.loaderSmall} />}
                    </div>
                    {searchResults.length > 0 && (
                        <div style={styles.searchDropdown}>
                            {searchResults.map(user => (
                                <div key={user.id} style={styles.searchItem} onClick={() => handleUserNavigate(user.username)}>
                                    <div style={styles.searchAvatar}>
                                        {user.avatar_url ? <img src={user.avatar_url} style={styles.avatarMini} /> : "👤"}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={styles.searchName}>{user.display_name}</div>
                                        <div style={styles.searchUsername}>@{user.username}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!isOwnProfile && (
                    <button style={styles.searchBackBtn} onClick={() => onBack?.("profile")}>
                        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={16} height={16}>
                            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to My Profile
                    </button>
                )}
            </div>

            <div style={styles.heroBanner}>
                <div style={styles.heroOverlay} />
                <div style={styles.heroContent}>
                    <div style={styles.avatarGlass} onClick={() => fileInputRef.current?.click()}>
                        <div style={styles.avatarInner}>
                            {avatarSrc ? <img src={avatarSrc} alt="avatar" style={styles.avatarImg} /> :
                                <div style={styles.avatarPlaceholder}>🍳</div>}
                        </div>
                        <div style={styles.cameraBtn}>{uploading ? "⏳" : "📷"}</div>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                    </div>
                    <div style={styles.heroInfo}>
                        <div style={styles.heroName}>{profile.display_name}</div>
                        <div style={styles.heroSub}>Cooking enthusiast since {new Date(profile.member_since).getFullYear()}</div>
                        {!isOwnProfile && (
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button style={profile.is_following ? styles.unfollowBtn : styles.followBtn} onClick={handleFollow}>
                                    {profile.is_following ? "Unfollow" : "Follow"}
                                </button>
                                <button style={styles.backBtn} onClick={() => onBack?.("profile")}>
                                    My Profile
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={styles.statsContainer}>
                <div style={styles.statsBar}>
                    <StatItem value={profile.recipes_saved} label="Recipes Saved" />
                    <div style={styles.statDivider} />
                    <StatItem value={profile.followers_count || 0} label="Followers" onClick={() => setStatsModal("followers")} />
                    <div style={styles.statDivider} />
                    <StatItem value={profile.following_count || 0} label="Following" onClick={() => setStatsModal("following")} />
                    <div style={styles.statDivider} />
                    <StatItem value={profile.cooking_skill} label="Skill Level" />
                </div>
            </div>

            <div style={styles.body}>
                <div style={{ display: "flex", gap: "24px", alignItems: "stretch" }}>
                    {/* ── NEW: User Information Panel (Left) ── */}
                    <div style={{ flex: 1 }}>
                        <UserInfoPanel profile={profile} isOwnProfile={isOwnProfile} />
                    </div>

                    {/* ── Existing: Profile Card (Right) ── */}
                    <div style={{ flex: 1.2 }}>
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div style={styles.cardTitle}>User Identity & Prefs</div>
                                <div style={{ display: "flex", gap: "12px" }}>
                                    {role === 'admin' && (
                                        <>
                                            <input
                                                type="file"
                                                ref={docInputRef}
                                                style={{ display: "none" }}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setSubmitting(true);
                                                    try {
                                                        await profileService.uploadRecipe(file.name, "", undefined, file, "KnowledgeBase");
                                                        alert("Project document uploaded! Processing has started in the background.");
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert("Upload failed.");
                                                    } finally {
                                                        setSubmitting(false);
                                                        if (docInputRef.current) docInputRef.current.value = "";
                                                    }
                                                }}
                                            />
                                            <button
                                                style={{ ...styles.docBtn, background: "#f0f7ff", borderColor: "#cce3ff" }}
                                                onClick={() => docInputRef.current?.click()}
                                                disabled={submitting}
                                            >
                                                {submitting ? "Uploading..." : "📎 Project Doc"}
                                            </button>
                                        </>
                                    )}
                                    {isOwnProfile && (
                                        <button style={editMode ? styles.saveBtn : styles.editBtn} onClick={editMode ? handleSaveProfile : () => setEditMode(true)}>
                                            {editMode ? (saving ? "Saving..." : "Save") : "Edit"}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {saveMsg && <div style={styles.saveMsg}>{saveMsg}</div>}

                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                <div style={styles.formGroup}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                        <div style={styles.prefLabel}>Bio</div>
                                        {editMode ? (
                                            <textarea
                                                style={{ ...styles.textarea, flex: 1, margin: 0 }}
                                                rows={1}
                                                value={profile.bio}
                                                onChange={e => updateProfile({ ...profile, bio: e.target.value })}
                                            />
                                        ) : (
                                            <p style={{ ...styles.bioText, margin: 0 }}>{profile.bio}</p>
                                        )}
                                    </div>
                                </div>

                                <div style={styles.formGroup}>
                                    <div style={styles.prefRow}>
                                        <div style={styles.prefLabel}>Dietary Preference</div>
                                        {editMode ? (
                                            <select
                                                style={styles.select}
                                                value={profile.diet_type}
                                                onChange={e => updateProfile({ ...profile, diet_type: e.target.value as any })}
                                            >
                                                <option>Veg</option>
                                                <option>Non-Veg</option>
                                                <option>Vegan</option>
                                            </select>
                                        ) : (
                                            <span style={{ ...styles.badge, background: diet.bg, color: diet.color }}>{profile.diet_type}</span>
                                        )}
                                    </div>
                                </div>

                                <div style={styles.formGroup}>
                                    <div style={styles.prefRow}>
                                        <div style={styles.prefLabel}>Cuisine Preference</div>
                                        {editMode ? (
                                            <input
                                                style={{ ...styles.adminInput, flex: 1, marginLeft: "12px", padding: "8px 12px" }}
                                                value={profile.cuisine_prefs.join(", ")}
                                                onChange={e => updateProfile({ ...profile, cuisine_prefs: e.target.value.split(",").map(c => c.trim()).filter(c => c !== "") })}
                                                placeholder="e.g. Italian, Indian, Japanese"
                                            />
                                        ) : (
                                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end", flex: 1 }}>
                                                {profile.cuisine_prefs.length > 0 ? profile.cuisine_prefs.map((c, i) => (
                                                    <span key={i} style={{ ...styles.badge, background: "#f0f4f8", color: "#2d3748", border: "1px solid #e2e8f0" }}>{c}</span>
                                                )) : <span style={{ color: "#999", fontSize: "14px" }}>None specified</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── NEW: Saved & Customized Recipes Panel ── */}
                <div style={styles.fullWidthCard}>
                    <SavedRecipesPanel viewedUserId={isOwnProfile ? undefined : profile.username} onRecipeClick={onRecipeClick} />
                </div>

                {/* ── Existing: Admin Feature (Only for own profile) ── */}
                {role === 'admin' && isOwnProfile && (
                    <div style={styles.fullWidthCard}>
                        <div style={{ ...styles.card, border: `1.5px solid ${COLORS.primaryDark}`, background: "#fffcf9" }}>
                            <div style={styles.cardTitle}>👨‍🍳 Admin: Combined Recipe & Document Entry</div>
                            <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>Create a complete recipe record with mandatory image and context document.</p>

                            {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={styles.inputLabel}>Recipe Information</div>
                                    <input style={styles.adminInput} placeholder="Enter recipe title..." value={recipeTitle} onChange={e => setRecipeTitle(e.target.value)} />

                                    <div style={styles.inputLabel}>Recipe Visual (Required)</div>
                                    <div style={styles.imageToggleRow}>
                                        <div style={{ ...styles.toggleBtn, ...(recipeImgSource === "url" ? styles.toggleBtnActive : {}) }} onClick={() => setRecipeImgSource("url")}>Link URL</div>
                                        <div style={{ ...styles.toggleBtn, ...(recipeImgSource === "upload" ? styles.toggleBtnActive : {}) }} onClick={() => setRecipeImgSource("upload")}>Manual File</div>
                                    </div>

                                    {recipeImgSource === "url" ? (
                                        <input style={styles.adminInput} placeholder="https://example.com/food.jpg" value={recipeUrl} onChange={e => setRecipeUrl(e.target.value)} />
                                    ) : (
                                        <div style={styles.fileBox}>
                                            <input type="file" ref={recipeImgRef} style={{ display: "none" }} onChange={e => setRecipeFile(e.target.files?.[0] || null)} />
                                            <button style={styles.docBtn} onClick={() => recipeImgRef.current?.click()}>
                                                {recipeFile ? recipeFile.name : "+ Select Image"}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={styles.inputLabel}>Context Document (Required)</div>
                                    <div style={styles.aiBox}>
                                        <p style={{ fontSize: 13, color: "#777", marginBottom: 12 }}>Upload nutrition facts or cooking manuals for AI processing.</p>
                                        <div style={styles.fileBox}>
                                            <input type="file" ref={docInputRef} style={{ display: "none" }} onChange={e => setDocFile(e.target.files?.[0] || null)} />
                                            <button style={styles.docBtn} onClick={() => docInputRef.current?.click()}>
                                                {docFile ? docFile.name : "+ Choose Document"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button style={{ ...styles.saveBtn, width: "100%", marginTop: 32, padding: "16px" }} onClick={handleSubmitRecipe} disabled={submitting}>
                                {submitting ? "Processing Submission..." : "Create Recipe & Link Document"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <FollowersModal
                isOpen={statsModal !== null}
                onClose={() => setStatsModal(null)}
                type={statsModal || "followers"}
                username={profile.username}
                onUserClick={handleUserNavigate}
            />
        </main>
    );
};

function StatItem({ value, label, onClick }: { value: number | string; label: string; onClick?: () => void }) {
    return (
        <div style={{ ...styles.statItem, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
            <div style={styles.statValue}>{typeof value === "number" ? value.toLocaleString() : value}</div>
            <div style={styles.statLabel}>{label}</div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    main: { backgroundColor: COLORS.bg, minHeight: "100vh", fontFamily: '"Inter", sans-serif', flex: 1, overflowY: "auto", position: "relative" },
    profileHeader: { padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 100 },
    searchWrap: { position: "relative", width: "100%", maxWidth: "400px" },
    searchInner: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 16px", background: "#f5f5f5", borderRadius: "10px", border: "1px solid #eee" },
    profileSearchInput: { background: "transparent", border: "none", outline: "none", width: "100%", fontSize: "14px", color: COLORS.text },
    searchDropdown: { position: "absolute", top: "100%", left: 0, right: 0, background: "white", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", marginTop: "8px", overflow: "hidden", zIndex: 1000 },
    searchItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", cursor: "pointer", transition: "background 0.2s" },
    searchAvatar: { width: "32px", height: "32px", borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
    avatarMini: { width: "100%", height: "100%", objectFit: "cover" },
    searchName: { fontSize: "14px", fontWeight: 600, color: COLORS.text },
    searchUsername: { fontSize: "12px", color: COLORS.textMuted },
    loaderSmall: { width: "16px", height: "16px", border: "2px solid #ddd", borderTop: "2px solid #FF7A3D", borderRadius: "50%", animation: "spin 1s linear infinite" },
    searchBackBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#f5f5f5", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500, color: "#666", transition: "all 0.2s" },
    heroBanner: { padding: "60px 48px 120px", background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, position: "relative" },
    heroOverlay: { position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 60%)" },
    heroContent: { position: "relative", display: "flex", alignItems: "center", gap: 32, zIndex: 1 },
    avatarGlass: { position: "relative", padding: 6, background: "rgba(255,255,255,0.2)", borderRadius: "50%", backdropFilter: "blur(10px)", cursor: "pointer" },
    avatarInner: { width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    avatarPlaceholder: { fontSize: 40 },
    cameraBtn: { position: "absolute", bottom: 4, right: 4, background: "#fff", borderRadius: "50%", padding: 6, fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
    heroInfo: { color: "#fff" },
    heroName: { fontSize: 32, fontWeight: 800 },
    heroSub: { fontSize: 16, opacity: 0.8 },
    statsContainer: { margin: "0 48px", marginTop: -44, position: "relative", zIndex: 10 },
    statsBar: { background: "#fff", borderRadius: 24, padding: "28px", display: "flex", justifyContent: "space-around", boxShadow: "0 10px 40px rgba(0,0,0,0.05)" },
    statItem: { textAlign: "center" },
    statValue: { fontSize: 28, fontWeight: 800 },
    statLabel: { fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase" },
    statDivider: { width: 1, height: 40, background: "#eee" },
    body: { display: "flex", flexDirection: "column", gap: 32, padding: "48px" },
    fullWidthCard: { width: "100%" },
    card: { background: "#fff", borderRadius: 24, padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", border: "1px solid #f0f0f0" },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    cardTitle: { fontSize: 18, fontWeight: 700 },
    editBtn: { padding: "8px 16px", borderRadius: 10, background: "#f5f5f5", border: "none", fontWeight: 600, cursor: "pointer" },
    saveBtn: { padding: "8px 24px", borderRadius: 10, background: COLORS.primary, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" },
    formGroup: { marginBottom: 20 },
    prefRow: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
    prefLabel: { fontWeight: 600, color: COLORS.textMuted },
    slider: { width: "100%", accentColor: COLORS.primary },
    select: { padding: "8px", borderRadius: 8, border: "1px solid #ddd" },
    badge: { padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
    bioText: { fontSize: 14, lineHeight: 1.6 },
    textarea: { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", fontFamily: "inherit" },
    saveMsg: { padding: "10px", background: "#e8f5e9", color: COLORS.success, borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 },
    followBtn: { padding: "8px 24px", borderRadius: 10, background: "#fff", color: COLORS.primary, border: `2px solid #fff`, fontWeight: 700, cursor: "pointer", fontSize: 14 },
    unfollowBtn: { padding: "8px 24px", borderRadius: 10, background: "rgba(255,255,255,0.2)", color: "#fff", border: "2px solid rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer", fontSize: 14 },
    backBtn: { padding: "8px 24px", borderRadius: 10, background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer", fontSize: 14 },
    errorBanner: { padding: "12px", background: "#ffebee", color: COLORS.danger, borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 700, border: "1px solid #ffcdd2" },
    inputLabel: { fontSize: 13, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" },
    adminInput: { width: "100%", padding: "12px", borderRadius: 12, border: "1.5px solid #eee", background: "#fafafa", outline: "none" },
    imageToggleRow: { display: "flex", gap: 10 },
    toggleBtn: { flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #eee", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, textAlign: "center" },
    toggleBtnActive: { background: COLORS.primary, color: "#fff", border: `1px solid ${COLORS.primary}` },
    fileBox: { padding: "12px", border: "1.5px dashed #ddd", borderRadius: 12, textAlign: "center", background: "#fafafa" },
    docBtn: { background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
    aiBox: { background: "#fafafa", padding: "20px", borderRadius: 16, border: "1px solid #eee" },
};

export default ProfilePage;