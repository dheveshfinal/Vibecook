CREATE_CHAT_HISTORY_TABLE = """
CREATE TABLE IF NOT EXISTS chat_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    message     TEXT NOT NULL,
    response    TEXT NOT NULL,
    context     TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
"""
