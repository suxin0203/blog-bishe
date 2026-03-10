const runQuery = require('../common/utils');

async function toggle(articleId, userId) {
  const rows = await runQuery('SELECT id FROM wz_article_favorites WHERE article_id = ? AND user_id = ?', [
    articleId,
    userId,
  ]);
  if (rows.length > 0) {
    await runQuery('DELETE FROM wz_article_favorites WHERE article_id = ? AND user_id = ?', [articleId, userId]);
    await runQuery('UPDATE wz_articles SET favorite_count = GREATEST(0, favorite_count - 1) WHERE id = ?', [articleId]);
    return { favorited: false };
  } else {
    await runQuery('INSERT INTO wz_article_favorites (article_id, user_id) VALUES (?, ?)', [articleId, userId]);
    await runQuery('UPDATE wz_articles SET favorite_count = favorite_count + 1 WHERE id = ?', [articleId]);
    return { favorited: true };
  }
}

async function checkFavorited(articleId, userId) {
  const rows = await runQuery('SELECT 1 FROM wz_article_favorites WHERE article_id = ? AND user_id = ?', [
    articleId,
    userId,
  ]);
  return rows.length > 0;
}

/** 当前用户收藏的文章列表（分页，支持关键词模糊搜索标题/摘要） */
async function getUserFavorites(userId, { page = 1, pageSize = 10, keyword } = {}) {
  let where = 'f.user_id = ? AND a.status IN (0, 1)';
  const countParams = [userId];
  const listParams = [userId];
  if (keyword && String(keyword).trim()) {
    const k = `%${String(keyword).trim()}%`;
    where += ' AND (a.title LIKE ? OR a.summary LIKE ?)';
    countParams.push(k, k);
    listParams.push(k, k);
  }
  const countRows = await runQuery(
    `SELECT COUNT(*) AS total FROM wz_article_favorites f INNER JOIN wz_articles a ON a.id = f.article_id WHERE ${where}`,
    countParams
  );
  const total = countRows[0].total;
  const offset = (Number(page) - 1) * Number(pageSize);
  const rows = await runQuery(
    `SELECT a.id, a.title, a.summary, a.cover_url, a.view_count, a.like_count, a.comment_count, a.favorite_count, a.created_at,
            c.name AS category_name, f.created_at AS favorited_at
     FROM wz_article_favorites f
     INNER JOIN wz_articles a ON a.id = f.article_id
     LEFT JOIN wz_categories c ON c.id = a.category_id
     WHERE ${where}
     ORDER BY f.created_at DESC
     LIMIT ?, ?`,
    [...listParams, offset, Number(pageSize)]
  );
  rows.forEach((r) => {
    r.created_at = r.created_at?.toLocaleString?.() ?? r.created_at;
    r.favorited_at = r.favorited_at?.toLocaleString?.() ?? r.favorited_at;
  });
  return { list: rows, total };
}

module.exports = { toggle, checkFavorited, getUserFavorites };
