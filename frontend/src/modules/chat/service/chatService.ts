import axios from "axios";
import type { AxiosInstance } from "axios";
import type { ChatResponse } from "../types";
import { authService } from "../../Auth/service/authService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";

class ChatService {
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_BASE,
            headers: {
                "Content-Type": "application/json",
            },
            timeout: 600000,
        });

        // Add interceptor for auth
        this.axiosInstance.interceptors.request.use((config) => {
            const token = authService.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    async sendMessage(message: string, recipe_id?: string, recipe_title?: string): Promise<ChatResponse> {
        const endpoint = recipe_id ? "/api/v1/chat/recipe" : "/api/v1/chat/";
        const payload = {
            message,
            ...(recipe_id && { recipe_id, recipe_title }),
        };

        const response = await this.axiosInstance.post<ChatResponse>(endpoint, payload);
        return response.data;
    }

    async getHistory(): Promise<any[]> {
        const response = await this.axiosInstance.get("/api/v1/chat/history");
        return response.data;
    }

    async *streamMessage(message: string, recipe_id?: string, recipe_title?: string): AsyncGenerator<any> {
        const endpoint = recipe_id ? "/api/v1/chat/recipe/stream" : "/api/v1/chat/stream";
        const url = `${API_BASE}${endpoint}`;

        const token = authService.getToken();
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                message,
                recipe_id,
                recipe_title,
            }),
        });

        if (!response.ok) {
            throw new Error(`Chat stream failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        yield JSON.parse(line);
                    } catch (e) {
                        console.error("Failed to parse stream chunk", e);
                    }
                }
            }
        }
    }
}

export const chatService = new ChatService();

