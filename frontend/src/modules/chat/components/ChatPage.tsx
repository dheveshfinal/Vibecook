import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";

const ChatPage: React.FC = () => {
    const { messages, loading, sendMessage } = useChat();
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue("");
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>🤖 AI Chef Assistant</h1>
            </div>

            <div style={styles.messagesContainer}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{ ...styles.messageWrapper, justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                        <div style={{ ...styles.message, backgroundColor: msg.sender === "user" ? "#FF7A3D" : "#f0f0f0", color: msg.sender === "user" ? "white" : "#1a1a1a" }}>
                            <p style={styles.messageText}>{msg.text}</p>
                            {msg.sources && msg.sources.length > 0 && (
                                <div style={styles.sources}>
                                    <p style={styles.sourcesLabel}>📚 Sources:</p>
                                    {msg.sources.map((source, idx) => (
                                        <span key={idx} style={styles.sourceTag}>{source}</span>
                                    ))}
                                </div>
                            )}
                            <span style={styles.timestamp}>
                                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div style={{ ...styles.messageWrapper, justifyContent: "flex-start" }}>
                        <div style={{ ...styles.message, backgroundColor: "#f0f0f0" }}>
                            <div style={styles.loadingDots}>
                                <span style={styles.dot}></span>
                                <span style={styles.dot}></span>
                                <span style={styles.dot}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputContainer}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask me anything about recipes, cooking, or ingredients..."
                    style={styles.input}
                    disabled={loading}
                />
                <button
                    style={{ ...styles.sendBtn, opacity: loading ? 0.6 : 1 }}
                    onClick={handleSend}
                    disabled={loading}
                >
                    ➤
                </button>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#f9f1eb",
        height: "100vh",
    },
    header: {
        padding: "20px 24px",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "white",
    },
    title: {
        fontSize: 24,
        fontWeight: 700,
        color: "#1a1a1a",
        margin: 0,
    },
    messagesContainer: {
        flex: 1,
        overflowY: "auto",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    messageWrapper: {
        display: "flex",
        marginBottom: "12px",
    },
    message: {
        maxWidth: "70%",
        padding: "12px 16px",
        borderRadius: "12px",
        wordWrap: "break-word",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    messageText: {
        margin: "0 0 8px 0",
        fontSize: 14,
        lineHeight: 1.5,
    },
    sources: {
        marginTop: "12px",
        paddingTop: "12px",
        borderTop: "1px solid rgba(0,0,0,0.1)",
    },
    sourcesLabel: {
        margin: "0 0 8px 0",
        fontSize: 12,
        fontWeight: 600,
        opacity: 0.8,
    },
    sourceTag: {
        display: "inline-block",
        fontSize: 11,
        padding: "4px 8px",
        backgroundColor: "rgba(0,0,0,0.1)",
        borderRadius: "4px",
        marginRight: "6px",
        marginBottom: "4px",
    },
    timestamp: {
        fontSize: 11,
        opacity: 0.6,
        display: "block",
        marginTop: "8px",
        textAlign: "right",
    },
    inputContainer: {
        padding: "16px 24px",
        backgroundColor: "white",
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        gap: "12px",
    },
    input: {
        flex: 1,
        padding: "12px 16px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        fontSize: 14,
        fontFamily: "inherit",
    },
    sendBtn: {
        padding: "12px 20px",
        backgroundColor: "#FF7A3D",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 16,
    },
    loadingDots: {
        display: "flex",
        gap: "4px",
        alignItems: "center",
    },
    dot: {
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: "#999",
        animation: "pulse 1.4s infinite",
    },
};

export default ChatPage;
