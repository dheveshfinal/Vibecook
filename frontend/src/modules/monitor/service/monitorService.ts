import type { LogEntry } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const monitorService = {
    async getLogs(limit: number = 100, module?: string): Promise<LogEntry[]> {
        const url = new URL(`${API_BASE}/api/v1/monitor/logs`);
        url.searchParams.append("limit", limit.toString());
        if (module) {
            url.searchParams.append("module", module);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error("Failed to fetch logs");
        }
        return response.json();
    }
};
