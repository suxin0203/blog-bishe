const runQuery = require('../common/utils');
const tagService = require('./tagService');

const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, '');

/**
 * 后台/前台列表：支持 keyword, category_id, tag_id, status（0,1 展示与置顶；2 回收站）, year, month（时间归档）
 * author_id：传入时仅返回该作者的文章（编辑者仅看自己）
 */
async function getList({ page = 1, pageSize = 8, keyword = '', category_id, tag_id, status, author_id, year, month }) {
  const offset = (Number(page) - 1) * Number(pageSize);
  const statusList = status !== undefined && status !== '' ? [Number(status)] : [0, 1];
  const placeholders = statusList.map(() => '?').join(',');
  let where = `a.status IN (${placeholders})`;
  const values = [...statusList];

  if (year != null && year !== '') {
    where += ' AND YEAR(a.created_at) = ?';
    values.push(Number(year));
  }
  if (month != null && month !== '') {
    where += ' AND MONTH(a.created_at) = ?';
    values.push(Number(month));
  }
  if (author_id != null) {
    where += ' AND a.author_id = ?';
    values.push(author_id);
  }
  if (keyword) {
    where += ' AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)';
    values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (category_id) {
    where += ' AND a.category_id = ?';
    values.push(category_id);
  }
  if (tag_id) {
    where += ' AND EXISTS (SELECT 1 FROM wz_article_tags at WHERE at.article_id = a.id AND at.tag_id = ?)';
    values.push(tag_id);
  }

  const countSql = `SELECT COUNT(*) AS total FROM wz_articles a WHERE ${where}`;
  const listSql = `
    SELECT a.id, a.title, a.summary, a.cover_url, a.category_id, a.author_id, a.status, a.view_count, a.like_count, a.comment_count, a.favorite_count, a.created_at, a.updated_at,
           c.name AS category_name, COALESCE(u.nickname, '用户已注销') AS author_name
    FROM wz_articles a
    LEFT JOIN wz_categories c ON c.id = a.category_id
    LEFT JOIN wz_users u ON u.id = a.author_id
    WHERE ${where}
    ORDER BY CASE WHEN a.status = 1 THEN 0 ELSE 1 END, a.id DESC
    LIMIT ?, ?
  `;
  const [countRow, list] = await Promise.all([
    runQuery(countSql, values),
    runQuery(listSql, [...values, offset, Number(pageSize)]),
  ]);
  const total = countRow[0].total;
  list.forEach((a) => {
    a.created_at = a.created_at?.toLocaleString?.() ?? a.created_at;
    a.updated_at = a.updated_at?.toLocaleString?.() ?? a.updated_at;
    if (a.summary == null && a.content) a.summary = stripHtml(a.content).slice(0, 200);
  });
  return { list, total };
}

/** 单条详情（含分类名、作者昵称、标签 id 列表） */
async function getById(id, options = {}) {
  const { incrementView = false, source } = options;
  let sql = `
    SELECT a.*, c.name AS category_name,
           COALESCE(u.nickname, '用户已注销') AS author_name,
           u.avatar_url AS author_avatar
    FROM wz_articles a
    LEFT JOIN wz_categories c ON c.id = a.category_id
    LEFT JOIN wz_users u ON u.id = a.author_id
    WHERE a.id = ?
  `;
  const rows = await runQuery(sql, [id]);
  const article = rows[0] || null;
  if (!article) return null;
  if (incrementView) {
    await incrementViewCount(id, source === 'internal' ? 'internal' : source === 'external' ? 'external' : undefined);
    article.view_count = (article.view_count || 0) + 1;
  }
  article.tag_ids = await tagService.getTagIdsByArticleId(id);
  article.created_at = article.created_at?.toLocaleString?.() ?? article.created_at;
  article.updated_at = article.updated_at?.toLocaleString?.() ?? article.updated_at;
  return article;
}

async function create({ title, summary, cover_url, content, category_id, author_id, status = 0, tag_ids }) {
  await runQuery(
    'INSERT INTO wz_articles (title, summary, cover_url, content, category_id, author_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, summary || null, cover_url || null, content, category_id, author_id, status]
  );
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  const articleId = rows[0]?.id;
  if (tag_ids && tag_ids.length) await tagService.setArticleTags(articleId, tag_ids);
  return articleId;
}

async function update(id, { title, summary, cover_url, content, category_id, status, tag_ids }) {
  const updates = ['title = ?', 'summary = ?', 'cover_url = ?', 'content = ?', 'category_id = ?', 'status = ?'];
  const values = [title, summary ?? null, cover_url ?? null, content, category_id, status ?? 0];
  values.push(id);
  const result = await runQuery(
    `UPDATE wz_articles SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  if (tag_ids !== undefined) await tagService.setArticleTags(id, tag_ids || []);
  return result.affectedRows ?? 0;
}

/** 软删除：改为 status=2 */
async function softDelete(id) {
  const result = await runQuery('UPDATE wz_articles SET status = 2 WHERE id = ?', [id]);
  return result.affectedRows ?? 0;
}

/** 恢复：status 改为 0 */
async function restore(id) {
  const result = await runQuery('UPDATE wz_articles SET status = 0 WHERE id = ?', [id]);
  return result.affectedRows ?? 0;
}

/** 硬删除 */
async function remove(id) {
  const result = await runQuery('DELETE FROM wz_articles WHERE id = ?', [id]);
  return result.affectedRows ?? 0;
}

/** 阅读量 +1；source: 'internal' | 'external' 时同时增加站内/站外计数 */
async function incrementViewCount(id, source) {
  if (source === 'internal') {
    await runQuery('UPDATE wz_articles SET view_count = view_count + 1, view_internal_count = view_internal_count + 1 WHERE id = ?', [id]);
  } else if (source === 'external') {
    await runQuery('UPDATE wz_articles SET view_count = view_count + 1, view_external_count = view_external_count + 1 WHERE id = ?', [id]);
  } else {
    await runQuery('UPDATE wz_articles SET view_count = view_count + 1 WHERE id = ?', [id]);
  }
  return 1;
}

/** 排行榜：按阅读/点赞/收藏取 Top N（仅展示中的文章 status 0,1） */
async function getTopBy(column, limit = 5) {
  const allowed = ['view_count', 'like_count', 'favorite_count'];
  if (!allowed.includes(column)) return [];
  const sql = `
    SELECT id, title, view_count, like_count, favorite_count
    FROM wz_articles
    WHERE status IN (0, 1)
    ORDER BY ${column} DESC, id DESC
    LIMIT ?
  `;
  const rows = await runQuery(sql, [Number(limit) || 5]);
  return rows;
}

async function getTopLists(limit = 5) {
  const [view_top, like_top, favorite_top] = await Promise.all([
    getTopBy('view_count', limit),
    getTopBy('like_count', limit),
    getTopBy('favorite_count', limit),
  ]);
  return { view_top, like_top, favorite_top };
}

/** 时间归档：按年-月聚合，返回 [{ year, month, count }]，仅统计已展示文章 */
async function getArchiveGroups() {
  const sql = `
    SELECT YEAR(created_at) AS year, MONTH(created_at) AS month, COUNT(*) AS count
    FROM wz_articles
    WHERE status IN (0, 1)
    GROUP BY YEAR(created_at), MONTH(created_at)
    ORDER BY year DESC, month DESC
  `;
  const rows = await runQuery(sql);
  return rows;
}

module.exports = {
  getList,
  getById,
  create,
  update,
  softDelete,
  restore,
  remove,
  incrementViewCount,
  getTopLists,
  getArchiveGroups,
};
