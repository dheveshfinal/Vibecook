import React, { useState, useEffect, useCallback } from "react";
import type { Recipe } from "../../recipes/types";
import { RecipeChat } from "../../chat/components/recipeChat";
import CustomizationModal from "../../Customization/components/CustomizationModal";
import { useProfileContext } from "../../profile/context/ProfileContext";

interface CookingAssistantViewProps {
    recipe: Recipe;
    onClose: () => void;
}

const CookingAssistantView: React.FC<CookingAssistantViewProps> = ({ recipe, onClose }) => {
    const [stepIndex, setStepIndex] = useState(0); // 0 = Ingredients summary, 1+ = Steps
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);
    const { customizeRecipe } = useProfileContext();

    const handleSaveCustomization = async (data: any) => {
        const recipeDbId = recipe.db_id || recipe.id;
        if (!recipeDbId) return;
        await customizeRecipe(recipeDbId.toString(), data);
        setShowCustomize(false);
        // We might want to reload the page or update the local recipe state
        // For now, let's just close the modal. The user might need to restart cooking to see changes.
        alert("Recipe customized! You might need to restart cooking to see your changes.");
    };

    const ingredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : (recipe.ingredients || "").split("\n").filter(i => i.trim());

    const steps = Array.isArray(recipe.steps)
        ? recipe.steps
        : (recipe.steps || "").split("\n").filter(s => s.trim());

    const cleanStep = (s: string) => s.replace(/^\d+[\.\)]\s*[\.\)]?\s*/, "").trim();
    const activeSteps = steps.map(cleanStep).filter(s => s);

    // ── Voice Guidance (TTS) ──
    const speak = useCallback((text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    }, []);

    const stopSpeaking = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
    }, []);

    const pauseSpeaking = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsPaused(true);
    }, []);

    const resumeSpeaking = useCallback(() => {
        setIsPaused(false);
    }, []);

    // Auto-read on step change
    useEffect(() => {
        if (showChat || isPaused) return; // Don't speak if chat is open or paused

        if (stepIndex === 0) {
            const text = `Let's start with the ingredients for ${recipe.title}. You'll need: ${ingredients.join(", ")}. Ready to start cooking?`;
            speak(text);
        } else {
            const stepText = activeSteps[stepIndex - 1];
            if (stepText) {
                speak(`Step ${stepIndex}: ${stepText}`);
            }
        }
    }, [stepIndex, recipe.title, ingredients, activeSteps, speak, showChat, isPaused]);

    const handleNext = () => {
        if (stepIndex < activeSteps.length) {
            setStepIndex(prev => prev + 1);
        } else {
            speak("You've completed the recipe! Enjoy your meal.");
            setTimeout(onClose, 5000);
        }
    };

    const handleBack = () => {
        if (stepIndex > 0) {
            setStepIndex(prev => prev - 1);
        }
    };

    const handleDoubt = () => {
        stopSpeaking();
        setShowChat(true);
    };

    const handleResume = () => {
        setShowChat(false);
        // Re-read current step logic will trigger via useEffect
    };

    const currentContent = stepIndex === 0
        ? { title: "Ingredients", text: ingredients.join("\n") }
        : { title: `Step ${stepIndex}`, text: activeSteps[stepIndex - 1] };

    const progress = activeSteps.length > 0 ? (stepIndex / activeSteps.length) * 100 : 0;

    return (
        <div style={styles.container}>
            {/* Header / Progress */}
            <div style={styles.header}>
                <div style={styles.headerTop}>
                    <div style={styles.logoBox}>👨‍🍳</div>
                    <div style={styles.titleBlock}>
                        <p style={styles.recipeTitleText}>AI Cooking Assistant</p>
                        <p style={styles.subtitleText}>Step-by-step guided recipe</p>
                    </div>
                </div>
                <div style={styles.progressRow}>
                    <div style={styles.progressMeta}>
                        <span>Step {stepIndex} of {activeSteps.length}</span>
                        <span>{Math.round(progress)}% Complete</span>
                    </div>
                    <div style={styles.progressWrap}>
                        <div style={{ ...styles.progressBar, width: `${progress}%` }} />
                    </div>
                </div>
                <div style={styles.headerActions}>
                    <button
                        style={styles.customizeBtn}
                        onClick={() => { stopSpeaking(); setShowCustomize(true); }}
                        title="Customize Recipe"
                    >
                        ✏️ Customize
                    </button>
                    <button style={styles.closeBtnOverlay} onClick={() => { stopSpeaking(); onClose(); }}>✕</button>
                </div>
            </div>

            {showCustomize && (
                <CustomizationModal
                    recipe={recipe}
                    onClose={() => setShowCustomize(false)}
                    onSave={handleSaveCustomization}
                />
            )}

            {/* Main Content */}
            <main style={styles.main}>
                <div style={styles.contentCard}>
                    <h2 style={styles.stepTitle}>{currentContent.title}</h2>
                    {stepIndex === 0 ? (
                        <ul style={{ textAlign: "left", fontSize: "18px", lineHeight: 2, color: "#1a1a1a", paddingLeft: "20px", margin: 0 }}>
                            {ingredients.map((ing, i) => (
                                <li key={i}>{ing.replace(/^\d+\.\s*/, "").trim()}</li>
                            ))}
                        </ul>
                    ) : (
                        <p style={styles.stepText}>{currentContent.text}</p>
                    )}
                </div>

                <div style={styles.controls}>
                    <button style={styles.doubtBtn} onClick={handleDoubt}>
                        ❓ Doubt
                    </button>
                    {stepIndex > 0 && (
                        <button style={styles.backBtn} onClick={handleBack}>
                            ← Back
                        </button>
                    )}
                    <button style={styles.nextBtn} onClick={handleNext}>
                        {stepIndex === 0 ? "Start Cooking →" : "Proceed →"}
                    </button>
                </div>
            </main>

            {/* Floating Assistant Indicator & Voice Controls */}
            <div style={styles.assistantIndicator}>
                <div style={styles.voiceControlPanel}>
                    {(isSpeaking || isPaused) && (
                        <div style={styles.voiceActions}>
                            {isPaused ? (
                                <button style={styles.voiceSmallBtn} onClick={resumeSpeaking}>▶ Resume</button>
                            ) : (
                                <button style={styles.voiceSmallBtn} onClick={pauseSpeaking}>⏸ Pause</button>
                            )}
                            <button style={styles.voiceSmallBtn} onClick={stopSpeaking}>⏹ Stop</button>
                        </div>
                    )}
                    <div style={{ ...styles.aiPulse, animation: isSpeaking && !isPaused ? "pulse 2s infinite" : "none" }}>
                        🤖
                    </div>
                    <div style={styles.aiStatus}>
                        {isSpeaking ? (isPaused ? "Paused" : "Speaking...") : showChat ? "Listening..." : "Ready"}
                    </div>
                </div>
            </div>

            {/* Chat Overlay for Doubts */}
            {showChat && (
                <div style={styles.chatOverlay}>
                    <div style={styles.chatModal}>
                        <div style={styles.chatHeader}>
                            <h3 style={styles.chatHeaderTitle}>Cooking Assistant</h3>
                            <button style={styles.closeBtnSmall} onClick={handleResume} title="Close">✕</button>
                        </div>
                        <div style={styles.chatBody}>
                            <RecipeChat
                                recipeId={recipe.db_id || recipe.title || "unknown"}
                                recipeTitle={recipe.title || "Recipe"}
                                initialMessage={`I'm currently on Step ${stepIndex}: "${currentContent.text}". Can you help me with a doubt?`}
                                autoOpen={true}
                                standalone={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 122, 61, 0.7); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(255, 122, 61, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 122, 61, 0); }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "#fff9f5",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        padding: "20px 40px 16px",
        display: "flex",
        flexDirection: "column",
        background: "#FF7A3D",
        gap: "12px",
        position: "relative",
    },
    headerTop: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
    },
    logoBox: {
        width: "56px",
        height: "56px",
        background: "white",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
    },
    titleBlock: {
        display: "flex",
        flexDirection: "column",
    },
    recipeTitleText: {
        fontSize: "28px",
        fontWeight: 800,
        color: "white",
        margin: 0,
    },
    subtitleText: {
        fontSize: "14px",
        color: "rgba(255,255,255,0.85)",
        margin: 0,
    },
    closeBtnOverlay: {
        background: "rgba(255,255,255,0.2)",
        border: "none",
        color: "white",
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        fontWeight: "bold",
    },
    headerActions: {
        position: "absolute",
        top: "20px",
        right: "40px",
        display: "flex",
        gap: "12px",
        alignItems: "center",
    },
    customizeBtn: {
        background: "white",
        border: "none",
        color: "#FF7A3D",
        padding: "6px 16px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    progressRow: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    progressMeta: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "14px",
        fontWeight: 700,
        color: "white",
    },
    progressWrap: {
        width: "100%",
        height: "8px",
        background: "rgba(255,255,255,0.3)",
        borderRadius: "4px",
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        background: "white",
        transition: "width 0.5s ease",
    },
    main: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px",
        textAlign: "center",
        overflowY: "auto",
    },
    contentCard: {
        maxWidth: "800px",
        background: "white",
        padding: "60px",
        borderRadius: "32px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        marginBottom: "40px",
    },
    stepTitle: {
        fontSize: "20px",
        color: "#FF7A3D",
        textTransform: "uppercase",
        letterSpacing: "2px",
        marginBottom: "24px",
    },
    stepText: {
        fontSize: "32px",
        fontWeight: 700,
        color: "#1a1a1a",
        lineHeight: 1.4,
        margin: 0,
        whiteSpace: "pre-wrap",
    },
    controls: {
        display: "flex",
        gap: "20px",
    },
    nextBtn: {
        padding: "16px 40px",
        background: "#FF7A3D",
        color: "white",
        border: "none",
        borderRadius: "16px",
        fontSize: "18px",
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 8px 16px rgba(255, 122, 61, 0.3)",
    },
    doubtBtn: {
        padding: "16px 40px",
        background: "white",
        color: "#FF7A3D",
        border: "2px solid #FF7A3D",
        borderRadius: "16px",
        fontSize: "18px",
        fontWeight: 700,
        cursor: "pointer",
        minWidth: "120px",
    },
    backBtn: {
        padding: "16px 40px",
        background: "white",
        color: "#666",
        border: "2px solid #eee",
        borderRadius: "16px",
        fontSize: "18px",
        fontWeight: 700,
        cursor: "pointer",
        minWidth: "120px",
    },
    assistantIndicator: {
        position: "fixed",
        bottom: "40px",
        right: "40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
    },
    voiceControlPanel: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
    },
    voiceActions: {
        display: "flex",
        gap: "8px",
        marginBottom: "4px",
    },
    voiceSmallBtn: {
        padding: "6px 16px",
        background: "white",
        border: "1px solid #FF7A3D",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        color: "#FF7A3D",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    aiPulse: {
        width: "60px",
        height: "60px",
        background: "#FF7A3D",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "30px",
        color: "white",
    },
    aiStatus: {
        fontSize: "11px",
        fontWeight: 700,
        color: "#FF7A3D",
        textTransform: "uppercase",
    },
    chatOverlay: {
        position: "fixed",
        inset: 0,
        zIndex: 4000,
        background: "transparent",
        pointerEvents: "none",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        padding: "20px",
    },
    chatModal: {
        width: "100%",
        maxWidth: "400px",
        height: "500px",
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        pointerEvents: "auto",
        animation: "slideUp 0.3s ease-out",
        marginRight: "20px",
        marginBottom: "20px",
    },
    chatHeader: {
        padding: "12px 20px",
        background: "white",
        borderBottom: "1px solid #eee",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    chatHeaderTitle: {
        margin: 0,
        fontSize: "16px",
        fontWeight: 600,
        color: "#333",
    },
    closeBtnSmall: {
        background: "none",
        border: "none",
        color: "#999",
        fontSize: "18px",
        cursor: "pointer",
        padding: "4px",
    },
    chatBody: {
        flex: 1,
        overflow: "hidden",
        position: "relative",
    }
};

export default CookingAssistantView;
