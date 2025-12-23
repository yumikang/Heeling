/**
 * CategoryService - 카테고리 관리 서비스
 *
 * SQLite에서 카테고리 데이터 관리
 */

import { getAllRows, getFirstRow, runSql, withTransaction } from '../database';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// DB row → Category 변환
const rowToCategory = (row: any): Category => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  icon: row.icon,
  color: row.color,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const CategoryService = {
  /**
   * 모든 카테고리 조회
   */
  async getAllCategories(): Promise<Category[]> {
    const rows = await getAllRows(
      'SELECT * FROM categories ORDER BY sort_order ASC'
    );
    return rows.map(rowToCategory);
  },

  /**
   * 카테고리 slug로 조회
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const row = await getFirstRow(
      'SELECT * FROM categories WHERE slug = ?',
      [slug]
    );
    return row ? rowToCategory(row) : null;
  },

  /**
   * 카테고리 ID로 조회
   */
  async getCategoryById(id: string): Promise<Category | null> {
    const row = await getFirstRow(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    return row ? rowToCategory(row) : null;
  },

  /**
   * 카테고리 저장 (upsert)
   */
  async saveCategory(category: Partial<Category> & { id: string; slug: string; name: string }): Promise<void> {
    await runSql(
      `INSERT INTO categories (id, slug, name, description, icon, color, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         slug = ?,
         name = ?,
         description = ?,
         icon = ?,
         color = ?,
         sort_order = ?,
         updated_at = datetime('now')`,
      [
        category.id,
        category.slug,
        category.name,
        category.description ?? null,
        category.icon ?? null,
        category.color ?? null,
        category.sortOrder ?? 0,
        // UPDATE values
        category.slug,
        category.name,
        category.description ?? null,
        category.icon ?? null,
        category.color ?? null,
        category.sortOrder ?? 0,
      ]
    );
  },

  /**
   * 서버에서 가져온 카테고리 목록 동기화
   */
  async syncCategories(serverCategories: Array<{
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    icon?: string;
    color?: string;
    sortOrder?: number;
  }>): Promise<{ added: number; updated: number; deleted: number }> {
    const result = { added: 0, updated: 0, deleted: 0 };

    if (serverCategories.length === 0) {
      return result;
    }

    await withTransaction(async () => {
      // 현재 로컬 카테고리 ID 목록
      const localRows = await getAllRows<{ id: string }>('SELECT id FROM categories');
      const localIds = new Set(localRows.map(r => r.id));
      const serverIds = new Set(serverCategories.map(c => c.id));

      // 삭제할 카테고리
      const toDelete = [...localIds].filter(id => !serverIds.has(id));
      for (const id of toDelete) {
        await runSql('DELETE FROM categories WHERE id = ?', [id]);
        result.deleted++;
      }

      // 추가/업데이트할 카테고리
      for (const cat of serverCategories) {
        const existing = localIds.has(cat.id);

        await runSql(
          `INSERT INTO categories (id, slug, name, description, icon, color, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
           ON CONFLICT(id) DO UPDATE SET
             slug = ?,
             name = ?,
             description = ?,
             icon = ?,
             color = ?,
             sort_order = ?,
             updated_at = datetime('now')`,
          [
            cat.id,
            cat.slug,
            cat.name,
            cat.description ?? null,
            cat.icon ?? null,
            cat.color ?? null,
            cat.sortOrder ?? 0,
            cat.slug,
            cat.name,
            cat.description ?? null,
            cat.icon ?? null,
            cat.color ?? null,
            cat.sortOrder ?? 0,
          ]
        );

        if (existing) {
          result.updated++;
        } else {
          result.added++;
        }
      }
    });

    console.log(`[Categories] Synced: ${result.added} added, ${result.updated} updated, ${result.deleted} deleted`);
    return result;
  },

  /**
   * 카테고리 삭제
   */
  async deleteCategory(id: string): Promise<void> {
    await runSql('DELETE FROM categories WHERE id = ?', [id]);
  },

  /**
   * 모든 카테고리 삭제
   */
  async clearAll(): Promise<void> {
    await runSql('DELETE FROM categories');
  },

  /**
   * 카테고리 수 조회
   */
  async getCount(): Promise<number> {
    const row = await getFirstRow<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM categories'
    );
    return row?.cnt ?? 0;
  },
};

export default CategoryService;
