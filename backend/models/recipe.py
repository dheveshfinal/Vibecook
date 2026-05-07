CREATE_RECIPES_TABLE = """
CREATE TABLE IF NOT EXISTS recipes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(200) NOT NULL,
    image_path  VARCHAR(300) DEFAULT '',
    image_url   VARCHAR(500) DEFAULT '',
    document_path VARCHAR(300) DEFAULT '',
    ingredients TEXT DEFAULT '',
    steps       TEXT DEFAULT '',
    cuisine     VARCHAR(80) DEFAULT '',
    time_mins   INT DEFAULT 30,
    spice_level VARCHAR(20) DEFAULT 'None',
    diet_type   VARCHAR(20) DEFAULT 'Veg',
    description TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
"""

CREATE_SAVED_RECIPES_TABLE = """
CREATE TABLE IF NOT EXISTS saved_recipes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id   UUID REFERENCES recipes(id) ON DELETE CASCADE,
    saved_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);
"""
