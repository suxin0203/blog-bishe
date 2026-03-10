const runQuery = require('../common/utils');

async function findAll() {
  return runQuery('SELECT * FROM wz_categories ORDER BY sort_order ASC, id ASC');
}

async function findById(id) {
  const rows = await runQuery('SELECT * FROM wz_categories WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ name, description = null, sort_order = 1 }) {
  await runQuery('INSERT INTO wz_categories (name, description, sort_order) VALUES (?, ?, ?)', [
    name,
    description,
    sort_order,
  ]);
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  return rows[0]?.id;
}

async function update(id, { name, description, sort_order }) {
  const vals = [];
  const set = [];
  if (name !== undefined) {
    set.push('name = ?');
    vals.push(name);
  }
  if (description !== undefined) {
    set.push('description = ?');
    vals.push(description);
  }
  if (sort_order !== undefined) {
    set.push('sort_order = ?');
    vals.push(sort_order);
  }
  if (set.length === 0) return 0;
  vals.push(id);
  const result = await runQuery(`UPDATE wz_categories SET ${set.join(', ')} WHERE id = ?`, vals);
  return result.affectedRows ?? 0;
}

async function remove(id) {
  const result = await runQuery('DELETE FROM wz_categories WHERE id = ?', [id]);
  return result.affectedRows ?? 0;
}

/** 检查是否有文章引用该分类 */
async function countArticlesByCategoryId(categoryId) {
  const rows = await runQuery('SELECT COUNT(*) AS total FROM wz_articles WHERE category_id = ?', [categoryId]);
  return Number(rows[0]?.total ?? 0);
}

module.exports = { findAll, findById, create, update, remove, countArticlesByCategoryId };
