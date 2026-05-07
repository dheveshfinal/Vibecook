import React from "react";
import { useMonitor } from "../hooks/useMonitor";

const MonitorPage: React.FC = () => {
    const { logs, loading, error } = useMonitor(50);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>System Monitor</h1>
                <p style={styles.subtitle}>Processing Logs (Chunking, Embedding, etc.)</p>
            </header>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.logContainer}>
                {loading && logs.length === 0 ? (
                    <p>Loading logs...</p>
                ) : logs.length === 0 ? (
                    <p>No logs found. Start a document processing task to see logs.</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={styles.th}>Timestamp</th>
                                <th style={styles.th}>Module</th>
                                <th style={styles.th}>Level</th>
                                <th style={styles.th}>Message</th>
                                <th style={styles.th}>Task ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} style={styles.row}>
                                    <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.badge, ...getModuleStyle(log.module) }}>
                                            {log.module}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ color: log.level === "ERROR" ? "#ff4d4d" : "#555" }}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{log.message}</td>
                                    <td style={styles.td}>{log.task_id || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const getModuleStyle = (module: string): React.CSSProperties => {
    switch (module.toLowerCase()) {
        case "chunking":
            return { backgroundColor: "#e3f2fd", color: "#1976d2" };
        case "embedding":
            return { backgroundColor: "#f3e5f5", color: "#7b1fa2" };
        case "processing":
            return { backgroundColor: "#e8f5e9", color: "#388e3c" };
        case "error":
            return { backgroundColor: "#ffebee", color: "#d32f2f" };
        default:
            return { backgroundColor: "#f5f5f5", color: "#616161" };
    }
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: "24px",
        marginLeft: "280px", // Accommodate sidebar
        background: "#f9f1eb",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        marginBottom: "32px",
    },
    title: {
        fontSize: "28px",
        fontWeight: 700,
        color: "#1a1a1a",
        margin: "0 0 8px 0",
    },
    subtitle: {
        fontSize: "16px",
        color: "#666",
        margin: 0,
    },
    logContainer: {
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        padding: "20px",
        overflowX: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "14px",
    },
    tableHeader: {
        borderBottom: "2px solid #f0f0f0",
        textAlign: "left",
    },
    th: {
        padding: "12px",
        color: "#888",
        fontWeight: 600,
    },
    td: {
        padding: "12px",
        borderBottom: "1px solid #f0f0f0",
        color: "#444",
    },
    row: {
        transition: "background 0.2s",
    },
    badge: {
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "uppercase",
    },
    error: {
        padding: "12px",
        backgroundColor: "#ffebee",
        color: "#d32f2f",
        borderRadius: "8px",
        marginBottom: "20px",
    },
};

export default MonitorPage;
