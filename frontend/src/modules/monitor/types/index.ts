export interface LogEntry {
    id: string;
    task_id: string | null;
    level: string;
    module: string;
    message: string;
    timestamp: string;
}
