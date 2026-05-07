import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage } from "../types";
import { chatService } from "../service/chatService";

interface UseChatOptions {
    recipeId?: string;
    recipeTitle?: string;
    initialMessage?: string;
}

export function useChat(options: UseChatOptions = {}) {
    const { recipeId, recipeTitle, initialMessage } = options;
    const storageKey = `chat_history_${recipeId || "general"}`;

    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                // Parse and recover Date objects
                return JSON.parse(saved).map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
        return [];
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial message & save to localStorage
    useEffect(() => {
        if (messages.length === 0) {
            const initialText = recipeTitle
                ? `👋 Hi! I'm your AI Assistant. Ask me anything about the **${recipeTitle}** context, relevant data, or project details.`
                : "👋 Hi! I'm your AI Assistant. Ask me anything about projects, documentation, or relevant knowledge base information.";

            const greeting: ChatMessage = {
                id: "1",
                text: initialText,
                sender: "assistant",
                timestamp: new Date(),
            };

            setMessages([greeting]);

            if (initialMessage) {
                setTimeout(() => sendMessage(initialMessage), 500);
            }
        }
    }, [recipeTitle, initialMessage, recipeId]);

    // Persist messages whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(messages));
        }
    }, [messages, storageKey]);

    // Auto-scroll
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text,
            sender: "user",
            timestamp: new Date(),
        };

        const assistantMsgId = (Date.now() + 1).toString();
        const initialAssistantMsg: ChatMessage = {
            id: assistantMsgId,
            text: "",
            sender: "assistant",
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg, initialAssistantMsg]);
        setLoading(true);
        setError(null);

        try {
            let fullText = "";
            const stream = chatService.streamMessage(text, recipeId, recipeTitle);
            
            for await (const chunk of stream) {
                if (chunk.type === "metadata") {
                    setMessages(prev => prev.map(m => 
                        m.id === assistantMsgId 
                            ? { ...m, context: chunk.context, sources: chunk.sources }
                            : m
                    ));
                } else if (chunk.type === "content") {
                    fullText += chunk.delta;
                    setMessages(prev => prev.map(m => 
                        m.id === assistantMsgId 
                            ? { ...m, text: fullText }
                            : m
                    ));
                } else if (chunk.type === "error") {
                    throw new Error(chunk.message);
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred";
            setError(errorMessage);
            setMessages(prev => prev.map(m => 
                m.id === assistantMsgId 
                    ? { ...m, text: `Sorry, I encountered an error: ${errorMessage}` }
                    : m
            ));
        } finally {
            setLoading(false);
        }
    }, [loading, recipeId, recipeTitle]);

    return { messages, loading, error, sendMessage, messagesEndRef, scrollToBottom };
}

