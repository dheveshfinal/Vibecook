/**
 * ChatIcon - Floating chat button (fixed at bottom-right)
 * Opens and closes the chat panel
 */

import React from "react";
import styles from "./RecipeChat.module.css";

interface ChatIconProps {
    isOpen: boolean;
    onClick: () => void;
    unreadCount?: number;
}

const ChatIcon: React.FC<ChatIconProps> = ({ isOpen, onClick, unreadCount = 0 }) => {
    return (
        <button
            className={`${styles.chatIcon} ${isOpen ? styles.chatIconActive : ""}`}
            onClick={onClick}
            title={isOpen ? "Close chat" : "Open chat with AI"}
            aria-label="AI Chat Assistant"
        >
            {/* Chat bubble icon */}
            <svg
                className={styles.chatIconSvg}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>

            {/* Close icon (visible when open) */}
            {isOpen && (
                <svg
                    className={styles.chatIconClose}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            )}

            {/* Unread badge */}
            {unreadCount > 0 && !isOpen && (
                <span className={styles.unreadBadge}>{Math.min(unreadCount, 9)}+</span>
            )}
        </button>
    );
};

export default ChatIcon;
