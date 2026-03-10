const runQuery = require('../common/utils');

async function findAll() {
  return runQuery('SELECT * FROM wz_tags ORDER BY id');
}

async function findById(id) {
  const rows = await runQuery('SELECT * FROM wz_tags WHERE id = ?', [id]);
  return rows[0] || null;
}

/** 按名称查找（忽略首尾空格，不区分大小写按需可加），用于去重 */
async function findByName(name) {
  const n = (name || '').trim();
  if (!n) return null;
  const rows = await runQuery('SELECT * FROM wz_tags WHERE name = ?', [n]);
  return rows[0] || null;
}

async function findByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  return runQuery(`SELECT * FROM wz_tags WHERE id IN (${placeholders})`, ids);
}

/** 按名称查找或创建，返回 id */
async function findOrCreateByName(name) {
  const rows = await runQuery('SELECT id FROM wz_tags WHERE name = ?', [name.trim()]);
  if (rows.length > 0) return rows[0].id;
  await runQuery('INSERT INTO wz_tags (name) VALUES (?)', [name.trim()]);
  const lastId = await runQuery('SELECT LAST_INSERT_ID() AS id');
  return lastId[0]?.id;
}

async function create({ name }) {
  await runQuery('INSERT INTO wz_tags (name) VALUES (?)', [name]);
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  return rows[0]?.id;
}

async function update(id, { name }) {
  const result = await runQuery('UPDATE wz_tags SET name = ? WHERE id = ?', [name, id]);
  return result.affectedRows ?? 0;
}

async function remove(id) {
  const result = await runQuery('DELETE FROM wz_tags WHERE id = ?', [id]);
  return result.affectedRows ?? 0;
}

/** 检查是否有文章引用该标签（wz_article_tags） */
async function countArticlesByTagId(tagId) {
  const rows = await runQuery('SELECT COUNT(DISTINCT article_id) AS total FROM wz_article_tags WHERE tag_id = ?', [tagId]);
  return Number(rows[0]?.total ?? 0);
}

/** 文章-标签关联 */
async function setArticleTags(articleId, tagIds) {
  await runQuery('DELETE FROM wz_article_tags WHERE article_id = ?', [articleId]);
  if (!tagIds || tagIds.length === 0) return;
  const values = tagIds.map((tag_id) => [articleId, tag_id]);
  for (const v of values) {
    await runQuery('INSERT INTO wz_article_tags (article_id, tag_id) VALUES (?, ?)', v);
  }
}

async function getTagIdsByArticleId(articleId) {
  const rows = await runQuery('SELECT tag_id FROM wz_article_tags WHERE article_id = ?', [articleId]);
  return rows.map((r) => r.tag_id);
}

module.exports = {
  findAll,
  findById,
  findByName,
  findByIds,
  findOrCreateByName,
  create,
  update,
  remove,
  countArticlesByTagId,
  setArticleTags,
  getTagIdsByArticleId,
};
