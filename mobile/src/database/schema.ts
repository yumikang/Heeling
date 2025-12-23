// SQLite Database Schema for Heeling App

export const DATABASE_NAME = 'heeling.db';
export const DATABASE_VERSION = 4;

// Create Tables SQL
export const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('apple', 'google', 'guest')),
    email TEXT,
    display_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_TRACKS_TABLE = `
  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    category TEXT,
    duration INTEGER NOT NULL,
    audio_file TEXT NOT NULL,
    background_image TEXT,
    recommended_brightness REAL DEFAULT 0.5,
    is_free INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    tags TEXT,
    play_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_PLAY_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS play_history (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    played_at TEXT NOT NULL DEFAULT (datetime('now')),
    duration_played INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );
`;

export const CREATE_USER_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY NOT NULL,
    default_brightness REAL DEFAULT 0.5,
    clock_style TEXT DEFAULT 'digital' CHECK (clock_style IN ('digital', 'analog', 'minimal')),
    clock_persist INTEGER DEFAULT 0,
    haptic_enabled INTEGER DEFAULT 1,
    auto_play INTEGER DEFAULT 1,
    cross_fade INTEGER DEFAULT 0,
    default_volume REAL DEFAULT 0.8,
    default_sleep_timer INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

export const CREATE_APP_METADATA_TABLE = `
  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_FAVORITES_TABLE = `
  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    UNIQUE(user_id, track_id)
  );
`;

export const CREATE_DOWNLOADS_TABLE = `
  CREATE TABLE IF NOT EXISTS downloads (
    track_id TEXT PRIMARY KEY NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'downloading', 'completed', 'failed', 'paused')),
    progress INTEGER NOT NULL DEFAULT 0,
    local_path TEXT,
    file_size INTEGER NOT NULL DEFAULT 0,
    downloaded_size INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    error TEXT,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );
`;

export const CREATE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_HOME_CACHE_TABLE = `
  CREATE TABLE IF NOT EXISTS home_cache (
    key TEXT PRIMARY KEY NOT NULL,
    data TEXT NOT NULL,
    cached_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );
`;

// Create Indexes SQL
export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_play_history_user ON play_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_play_history_track ON play_history(track_id);
  CREATE INDEX IF NOT EXISTS idx_play_history_played_at ON play_history(played_at DESC);
  CREATE INDEX IF NOT EXISTS idx_tracks_category ON tracks(category);
  CREATE INDEX IF NOT EXISTS idx_tracks_is_free ON tracks(is_free);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
  CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
  CREATE INDEX IF NOT EXISTS idx_home_cache_expires ON home_cache(expires_at);
`;

// All tables creation array
export const ALL_TABLES = [
  CREATE_USERS_TABLE,
  CREATE_TRACKS_TABLE,
  CREATE_PLAY_HISTORY_TABLE,
  CREATE_USER_SETTINGS_TABLE,
  CREATE_APP_METADATA_TABLE,
  CREATE_FAVORITES_TABLE,
  CREATE_DOWNLOADS_TABLE,
  CREATE_CATEGORIES_TABLE,
  CREATE_HOME_CACHE_TABLE,
];
