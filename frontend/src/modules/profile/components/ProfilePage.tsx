import React, { useState, useRef } from "react";
import { useProfile } from "../hooks/useProfile";
import { profileService } from "../service/profileService";

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

const ProfilePage: React.FC = () => {
    const { profile, loading, error, updateProfile, uploadAvatar } = useProfile();
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const [uploading, setUploading] = useState(false);

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

    if (loading && !profile) return <div>Loading...</div>;
    if (!profile) return <div>Error loading profile.</div>;

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
                    </div>
                </div>
            </div>

            <div style={styles.statsContainer}>
                <div style={styles.statsBar}>
                    <StatItem value={profile.recipes_saved} label="Recipes Saved" />
                    <div style={styles.statDivider} />
                    <StatItem value={profile.recipes_cooked} label="Times Cooked" />
                    <div style={styles.statDivider} />
                    <StatItem value={profile.cooking_skill} label="Skill Level" />
                </div>
            </div>

            <div style={styles.body}>
                {/* Profile Card */}
                <div style={styles.fullWidthCard}>
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div style={styles.cardTitle}>User Identity & Prefs</div>
                            <div style={{ display: "flex", gap: "12px" }}>
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
                                <button style={editMode ? styles.saveBtn : styles.editBtn} onClick={editMode ? handleSaveProfile : () => setEditMode(true)}>
                                    {editMode ? (saving ? "Saving..." : "Save") : "Edit"}
                                </button>
                            </div>
                        </div>
                        {saveMsg && <div style={styles.saveMsg}>{saveMsg}</div>}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                            <div>
                                <div style={styles.formGroup}>
                                    <div style={styles.prefRow}><div style={styles.prefLabel}>Spice Tolerance</div><div>{profile.spice_level}%</div></div>
                                    <input type="range" min={0} max={100} value={profile.spice_level} disabled={!editMode}
                                        onChange={(e) => updateProfile({ ...profile, spice_level: Number(e.target.value) })} style={styles.slider} />
                                </div>
                                <div style={styles.formGroup}>
                                    <div style={styles.prefRow}><div style={styles.prefLabel}>Dietary Preference</div>
                                        {editMode ? <select style={styles.select} value={profile.diet_type} onChange={e => updateProfile({ ...profile, diet_type: e.target.value as any })}><option>Veg</option><option>Non-Veg</option><option>Vegan</option></select> :
                                            <span style={{ ...styles.badge, background: diet.bg, color: diet.color }}>{profile.diet_type}</span>}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div style={styles.formGroup}>
                                    <div style={styles.prefLabel}>Bio</div>
                                    {editMode ? <textarea style={styles.textarea} rows={3} value={profile.bio} onChange={e => updateProfile({ ...profile, bio: e.target.value })} /> :
                                        <p style={styles.bioText}>{profile.bio}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Feature */}
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
            </div>
        </main>
    );
};

function StatItem({ value, label }: { value: number | string; label: string }) {
    return (
        <div style={styles.statItem}>
            <div style={styles.statValue}>{typeof value === "number" ? value.toLocaleString() : value}</div>
            <div style={styles.statLabel}>{label}</div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    main: { marginLeft: 280, backgroundColor: COLORS.bg, minHeight: "100vh", fontFamily: '"Inter", sans-serif', flex: 1, overflowY: "auto" },
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
