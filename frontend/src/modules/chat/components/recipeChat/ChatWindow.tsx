/**
 * ChatWindow - Main chat panel with messages and input
 */

import React, { useState } from "react";
import styles from "./RecipeChat.module.css";
import type { ChatMessage as Message } from "../../types";

interface ChatWindowProps {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    onSendMessage: (message: string) => Promise<void>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    recipeTitle: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    isLoading,
    error,
    onSendMessage,
    messagesEndRef,
    recipeTitle,
}) => {
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading || isSending) return;

        setIsSending(true);
        await onSendMessage(inputValue);
        setInputValue("");
        setIsSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Send on Enter, but allow Shift+Enter for new line
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className={styles.chatWindow}>
            {/* Header */}
            <div className={styles.chatHeader}>
                <div>
                    <h3 className={styles.chatTitle}>AI Assistant</h3>
                    <p className={styles.chatSubtitle}>{recipeTitle}</p>
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesContainer}>
                {messages.length === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>💬</div>
                        <p className={styles.emptyText}>
                            Ask me anything about this content! I can help with:
                        </p>
                        <ul className={styles.emptyList}>
                            <li>Cooking tips & techniques</li>
                            <li>Ingredient substitutions</li>
                            <li>Timing and portion adjustments</li>
                            <li>Related recipes</li>
                        </ul>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
                        <div className={styles.messageBubble}>
                            <p className={styles.messageContent}>{msg.text}</p>
                            <span className={styles.messageTime}>
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className={`${styles.message} ${styles.assistant}`}>
                        <div className={styles.messageBubble}>
                            <div className={styles.loadingDots}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className={`${styles.message} ${styles.error}`}>
                        <div className={styles.messageBubble}>
                            <p className={styles.messageContent}>⚠️ {error}</p>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={styles.chatFooter}>
                <div className={styles.inputWrapper}>
                    <textarea
                        className={styles.input}
                        placeholder="Ask me anything... (Shift+Enter for new line)"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading || isSending}
                        rows={1}
                    />
                    <button
                        className={styles.sendButton}
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading || isSending}
                        title="Send message (Enter)"
                    >
                        {isSending ? "..." : "➤"}
                    </button>
                </div>
                <p className={styles.inputHint}>Powered by Ollama + Qdrant</p>
            </div>
        </div>
    );
};

export default ChatWindow;
