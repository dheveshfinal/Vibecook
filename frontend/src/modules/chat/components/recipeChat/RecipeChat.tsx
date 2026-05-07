/**
 * RecipeChat - Main chatbot container component
 * Manages open/close state and blur overlay
 */

import React, { useState, useCallback } from "react";
import ChatIcon from "./ChatIcon";
import ChatWindow from "./ChatWindow";
import { useChat } from "../../hooks/useChat";
import styles from "./RecipeChat.module.css";

interface RecipeChatProps {
    recipeId: string;
    recipeTitle: string;
    initialMessage?: string;
    autoOpen?: boolean;
    standalone?: boolean;
}

export const RecipeChat: React.FC<RecipeChatProps> = ({
    recipeId,
    recipeTitle,
    initialMessage,
    autoOpen = false,
    standalone = false,
}) => {
    const [isOpen, setIsOpen] = useState(autoOpen);
    const {
        messages,
        loading,
        error,
        sendMessage,
        messagesEndRef,
    } = useChat({
        recipeId,
        recipeTitle,
        initialMessage,
    });

    const handleToggleChat = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const handleCloseChat = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <>
            {/* Blur overlay (visible when chat is open and NOT standalone) */}
            {isOpen && !standalone && (
                <div
                    className={styles.overlay}
                    onClick={handleCloseChat}
                    aria-hidden="true"
                />
            )}

            {/* Chat container */}
            <div
                className={`${styles.chatContainer} ${isOpen ? styles.chatContainerOpen : ""} ${standalone ? styles.standalone : ""}`}
            >
                {/* Chat panel */}
                {isOpen && (
                    <div className={styles.chatPanel}>
                        <ChatWindow
                            messages={messages}
                            isLoading={loading}
                            error={error}
                            onSendMessage={sendMessage}
                            messagesEndRef={messagesEndRef}
                            recipeTitle={recipeTitle}
                        />
                    </div>
                )}

                {/* Floating chat icon (NOT standalone) */}
                {!standalone && (
                    <ChatIcon
                        isOpen={isOpen}
                        onClick={handleToggleChat}
                        unreadCount={0}
                    />
                )}
            </div>
        </>
    );
};

