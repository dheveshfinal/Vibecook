CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_id UUID UNIQUE,
    username    VARCHAR(80) UNIQUE,
    email       VARCHAR(120) UNIQUE,
    hashed_password VARCHAR(255),
    role        VARCHAR(20) DEFAULT 'user',
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
CREATE_FOLLOWS_TABLE = """
CREATE TABLE IF NOT EXISTS follows (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    followed_id UUID REFERENCES users(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, followed_id)
);
"""
