import { useState, useEffect, useCallback } from "react";
import type { LogEntry } from "../types";
import { monitorService } from "../service/monitorService";

export function useMonitor(limit: number = 100, module?: string) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        try {
            if (logs.length === 0) setLoading(true);
            const data = await monitorService.getLogs(limit, module);
            setLogs(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    }, [limit, module, logs.length]);

    useEffect(() => {
        fetchLogs();

        // Poll for new logs every 5 seconds
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, [fetchLogs]);

    return { logs, loading, error, refresh: fetchLogs };
}
