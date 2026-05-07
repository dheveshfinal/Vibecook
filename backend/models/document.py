CREATE_DOCUMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path   VARCHAR(300) NOT NULL,
    file_type   VARCHAR(20) NOT NULL,
    content_preview TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
"""
