import { generateId, getFirstRow, runSql } from '../database';
import { User } from '../types';

// Convert DB row to User object
const rowToUser = (row: any): User => ({
  id: row.id,
  provider: row.provider,
  email: row.email,
  displayName: row.display_name,
  createdAt: row.created_at,
  lastLogin: row.last_login,
});

export const UserService = {
  // Create new user
  async createUser(
    provider: 'apple' | 'google' | 'guest',
    email?: string,
    displayName?: string
  ): Promise<User> {
    const id = generateId();
    const now = new Date().toISOString();

    await runSql(
      `INSERT INTO users (id, provider, email, display_name, created_at, last_login)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, provider, email || null, displayName || null, now, now]
    );

    return {
      id,
      provider,
      email,
      displayName,
      createdAt: now,
      lastLogin: now,
    };
  },

  // Get user by ID
  async getUser(id: string): Promise<User | null> {
    const row = await getFirstRow(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return row ? rowToUser(row) : null;
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const row = await getFirstRow(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return row ? rowToUser(row) : null;
  },

  // Update last login
  async updateLastLogin(userId: string): Promise<void> {
    await runSql(
      "UPDATE users SET last_login = datetime('now') WHERE id = ?",
      [userId]
    );
  },

  // Update user display name
  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    await runSql(
      'UPDATE users SET display_name = ? WHERE id = ?',
      [displayName, userId]
    );
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    await runSql('DELETE FROM users WHERE id = ?', [userId]);
  },
};

export default UserService;
