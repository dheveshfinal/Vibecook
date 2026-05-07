CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(80) NOT NULL DEFAULT 'Food Explorer',
    bio         TEXT DEFAULT '',
    avatar_path VARCHAR(300) DEFAULT '',
    diet_type   VARCHAR(20) DEFAULT 'Veg',
    spice_level INT DEFAULT 30,
    allergies   TEXT[] DEFAULT '{}',
    cuisine_prefs TEXT[] DEFAULT '{}',
    cooking_skill VARCHAR(20) DEFAULT 'Beginner',
    recipes_cooked INT DEFAULT 0,
    recipes_saved  INT DEFAULT 0,
    member_since   TIMESTAMPTZ DEFAULT NOW()
);
"""

SEED_ADMIN_USER = """
INSERT INTO users (display_name, bio, diet_type, spice_level,
    allergies, cuisine_prefs, cooking_skill, recipes_cooked, recipes_saved)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
"""
