import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import {
  DATABASE_NAME,
  DATABASE_VERSION,
  ALL_TABLES,
  CREATE_INDEXES,
} from './schema';

// Enable promise-based API
SQLite.enablePromise(true);

let db: SQLiteDatabase | null = null;

// Migration: v2 -> v3 (add downloads table)
const migrateV2toV3 = async (database: SQLiteDatabase): Promise<void> => {
  console.log('Migrating database from v2 to v3...');

  await database.executeSql('BEGIN TRANSACTION;');
  try {
    // Create downloads table
    await database.executeSql(`
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
    `);

    // Create index
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);');

    // Update version
    await database.executeSql(
      "UPDATE app_metadata SET value = '3', updated_at = datetime('now') WHERE key = 'db_version'"
    );

    await database.executeSql('COMMIT;');
    console.log('Migration v2 to v3 completed');
  } catch (error) {
    await database.executeSql('ROLLBACK;');
    throw error;
  }
};

// Migration: v3 -> v4 (add categories and home_cache tables)
const migrateV3toV4 = async (database: SQLiteDatabase): Promise<void> => {
  console.log('Migrating database from v3 to v4...');

  await database.executeSql('BEGIN TRANSACTION;');
  try {
    // Create categories table
    await database.executeSql(`
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
    `);

    // Create home_cache table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS home_cache (
        key TEXT PRIMARY KEY NOT NULL,
        data TEXT NOT NULL,
        cached_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL
      );
    `);

    // Create indexes
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);');
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_home_cache_expires ON home_cache(expires_at);');

    // Update version
    await database.executeSql(
      "UPDATE app_metadata SET value = '4', updated_at = datetime('now') WHERE key = 'db_version'"
    );

    await database.executeSql('COMMIT;');
    console.log('Migration v3 to v4 completed');
  } catch (error) {
    await database.executeSql('ROLLBACK;');
    throw error;
  }
};

// Migration: v1 -> v2 (remove category CHECK constraint)
const migrateV1toV2 = async (database: SQLiteDatabase): Promise<void> => {
  console.log('Migrating database from v1 to v2...');

  // SQLite doesn't support ALTER TABLE to modify constraints
  // Need to recreate the table
  await database.executeSql('BEGIN TRANSACTION;');
  try {
    // Create new table without CHECK constraint
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS tracks_new (
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
    `);

    // Copy data from old table
    await database.executeSql(`
      INSERT INTO tracks_new SELECT * FROM tracks;
    `);

    // Drop old table
    await database.executeSql('DROP TABLE tracks;');

    // Rename new table
    await database.executeSql('ALTER TABLE tracks_new RENAME TO tracks;');

    // Recreate index
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_tracks_category ON tracks(category);');
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_tracks_is_free ON tracks(is_free);');

    // Update version
    await database.executeSql(
      "UPDATE app_metadata SET value = '2', updated_at = datetime('now') WHERE key = 'db_version'"
    );

    await database.executeSql('COMMIT;');
    console.log('Migration v1 to v2 completed');
  } catch (error) {
    await database.executeSql('ROLLBACK;');
    throw error;
  }
};

// Initialize database
export const initDatabase = async (): Promise<SQLiteDatabase> => {
  if (db) return db;

  try {
    db = await SQLite.openDatabase({
      name: DATABASE_NAME,
      location: 'default',
    });

    // Enable WAL mode for better performance
    await db.executeSql('PRAGMA journal_mode = WAL;');
    await db.executeSql('PRAGMA foreign_keys = ON;');

    // Create all tables
    for (const tableSQL of ALL_TABLES) {
      await db.executeSql(tableSQL);
    }

    // Create indexes
    const indexStatements = CREATE_INDEXES.split(';').filter(s => s.trim());
    for (const indexSQL of indexStatements) {
      if (indexSQL.trim()) {
        await db.executeSql(indexSQL + ';');
      }
    }

    // Check and set database version
    const [versionResult] = await db.executeSql(
      "SELECT value FROM app_metadata WHERE key = 'db_version'"
    );

    let currentVersion = 0;
    if (versionResult.rows.length === 0) {
      await db.executeSql(
        "INSERT INTO app_metadata (key, value) VALUES ('db_version', ?)",
        [DATABASE_VERSION.toString()]
      );
      currentVersion = DATABASE_VERSION;
    } else {
      currentVersion = parseInt(versionResult.rows.item(0).value, 10);
    }

    // Run migrations if needed
    if (currentVersion < DATABASE_VERSION) {
      if (currentVersion < 2) {
        await migrateV1toV2(db);
      }
      if (currentVersion < 3) {
        await migrateV2toV3(db);
      }
      if (currentVersion < 4) {
        await migrateV3toV4(db);
      }
      // Add more migrations here as needed
    }

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Get database instance
export const getDatabase = (): SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Close database
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.close();
    db = null;
  }
};

// Generate UUID
export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Transaction helper
export const withTransaction = async <T>(
  callback: (db: SQLiteDatabase) => Promise<T>
): Promise<T> => {
  const database = getDatabase();
  await database.executeSql('BEGIN TRANSACTION;');
  try {
    const result = await callback(database);
    await database.executeSql('COMMIT;');
    return result;
  } catch (error) {
    await database.executeSql('ROLLBACK;');
    throw error;
  }
};

// Helper function to get first row from result
export const getFirstRow = async <T>(
  sql: string,
  params: any[] = []
): Promise<T | null> => {
  const database = getDatabase();
  const [result] = await database.executeSql(sql, params);
  if (result.rows.length > 0) {
    return result.rows.item(0) as T;
  }
  return null;
};

// Helper function to get all rows from result
export const getAllRows = async <T>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  const database = getDatabase();
  const [result] = await database.executeSql(sql, params);
  const rows: T[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(result.rows.item(i) as T);
  }
  return rows;
};

// Helper function to run insert/update/delete
export const runSql = async (
  sql: string,
  params: any[] = []
): Promise<{ insertId?: number; rowsAffected: number }> => {
  const database = getDatabase();
  const [result] = await database.executeSql(sql, params);
  return {
    insertId: result.insertId,
    rowsAffected: result.rowsAffected,
  };
};

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
  generateId,
  withTransaction,
  getFirstRow,
  getAllRows,
  runSql,
};
