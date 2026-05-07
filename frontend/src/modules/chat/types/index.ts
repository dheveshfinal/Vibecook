export interface ChatMessage {
    id: string;
    text: string;
    sender: "user" | "assistant";
    timestamp: Date;
    context?: Array<{ text: string; score: number }>;
    sources?: string[];
}

export interface ChatResponse {
    response: string;
    context: Array<{ text: string; score: number }>;
    sources: string[];
}
