import React, { useState } from "react";

interface CustomizationModalProps {
    recipe: any;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

const CustomizationModal: React.FC<CustomizationModalProps> = ({ recipe, onClose, onSave }) => {
    const [title, setTitle] = useState(recipe.title || "");
    const [ingredients, setIngredients] = useState(
        Array.isArray(recipe.ingredients) ? recipe.ingredients.join("\n") : (recipe.ingredients || "")
    );
    const [steps, setSteps] = useState(
        Array.isArray(recipe.steps) ? recipe.steps.join("\n") : (recipe.steps || "")
    );
    const [note, setNote] = useState(recipe.note || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({ title, ingredients, steps, note });
            onClose();
        } catch (err) {
            console.error("Failed to save customization:", err);
            alert("Failed to save customization");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3 style={styles.headerTitle}>Customize Recipe</h3>
                    <button style={styles.closeBtn} onClick={onClose}>✕</button>
                </div>
                <div style={styles.body}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Recipe Title</label>
                        <input
                            style={styles.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Ingredients (one per line)</label>
                        <textarea
                            style={styles.textarea}
                            rows={6}
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Instructions (one per line)</label>
                        <textarea
                            style={styles.textarea}
                            rows={8}
                            value={steps}
                            onChange={(e) => setSteps(e.target.value)}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Personal Note (optional)</label>
                        <input
                            style={styles.input}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Added more garlic, reduced salt"
                        />
                    </div>
                </div>
                <div style={styles.footer}>
                    <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Customization"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 5000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
    },
    modal: {
        width: "90%",
        maxWidth: "600px",
        maxHeight: "90vh",
        background: "white",
        borderRadius: "24px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    },
    header: {
        padding: "20px 32px",
        borderBottom: "1px solid #eee",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        margin: 0,
        fontSize: "20px",
        fontWeight: 700,
        color: "#1a1a1a",
    },
    closeBtn: {
        background: "none",
        border: "none",
        fontSize: "20px",
        cursor: "pointer",
        color: "#999",
    },
    body: {
        padding: "24px 32px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    label: {
        fontSize: "14px",
        fontWeight: 600,
        color: "#666",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    input: {
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1.5px solid #eee",
        fontSize: "16px",
        outline: "none",
        transition: "border-color 0.2s",
    },
    textarea: {
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1.5px solid #eee",
        fontSize: "16px",
        outline: "none",
        resize: "vertical",
        fontFamily: "inherit",
    },
    footer: {
        padding: "24px 32px",
        borderTop: "1px solid #eee",
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
    },
    cancelBtn: {
        padding: "12px 24px",
        background: "#f5f5f5",
        border: "none",
        borderRadius: "12px",
        fontSize: "16px",
        fontWeight: 600,
        cursor: "pointer",
        color: "#666",
    },
    saveBtn: {
        padding: "12px 24px",
        background: "#FF7A3D",
        color: "white",
        border: "none",
        borderRadius: "12px",
        fontSize: "16px",
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(255, 122, 61, 0.2)",
    },
};

export default CustomizationModal;
