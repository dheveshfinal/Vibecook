CREATE_TASK_LOGS_TABLE = """
CREATE TABLE IF NOT EXISTS task_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     VARCHAR(100),
    level       VARCHAR(20) DEFAULT 'INFO',
    module      VARCHAR(50),
    message     TEXT,
    timestamp   TIMESTAMPTZ DEFAULT NOW()
);
"""
