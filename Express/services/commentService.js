const runQuery = require('../common/utils');
const { formatDateTime } = require('../common/utils');

// 评论状态：0=待审核 1=已通过 2=屏蔽
async function getListByArticleId(articleId, { status = 1 } = {}) {
  const sql = `
    SELECT c.*, COALESCE(u.nickname, '用户已注销') AS user_name,
           u.avatar_url AS user_avatar, u.title AS user_title,
           u.role AS user_role, u.is_root AS user_is_root,
           (SELECT a.author_id FROM wz_articles a WHERE a.id = c.article_id) AS article_author_id
    FROM wz_comments c
    LEFT JOIN wz_users u ON u.id = c.user_id
    WHERE c.article_id = ? AND c.status = ?
    ORDER BY c.created_at ASC
  `;
  const rows = await runQuery(sql, [articleId, status]);
  rows.forEach((r) => {
    r.created_at = formatDateTime(r.created_at);
  });
  return rows;
}

async function getById(id) {
  const rows = await runQuery('SELECT * FROM wz_comments WHERE id = ?', [id]);
  return rows[0] || null;
}

// 新建评论默认 status=0（待审核），通过后改为 1 才在前台显示；仅通过时增加文章 comment_count
async function create({ article_id, user_id = null, parent_id = null, content, status = 0 }) {
  const s = status === 1 ? 1 : 0;
  await runQuery(
    'INSERT INTO wz_comments (article_id, user_id, parent_id, content, status) VALUES (?, ?, ?, ?, ?)',
    [article_id, user_id, parent_id || null, content, s]
  );
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  const commentId = rows[0]?.id;
  if (s === 1) {
    await runQuery('UPDATE wz_articles SET comment_count = comment_count + 1 WHERE id = ?', [article_id]);
  }
  return commentId;
}

async function update(id, { content, status }) {
  const comment = await getById(id);
  if (!comment) return 0;
  const set = [];
  const values = [];
  if (content !== undefined) {
    set.push('content = ?');
    values.push(content);
  }
  if (status !== undefined) {
    set.push('status = ?');
    values.push(status);
  }
  if (set.length === 0) return 0;
  values.push(id);
  const result = await runQuery(`UPDATE wz_comments SET ${set.join(', ')} WHERE id = ?`, values);
  const n = result.affectedRows ?? 0;
  if (n && status !== undefined) {
    const aid = comment.article_id;
    if (comment.status !== 1 && status === 1) {
      await runQuery('UPDATE wz_articles SET comment_count = comment_count + 1 WHERE id = ?', [aid]);
    } else if (comment.status === 1 && (status === 0 || status === 2)) {
      await runQuery('UPDATE wz_articles SET comment_count = GREATEST(0, comment_count - 1) WHERE id = ?', [aid]);
    }
  }
  return n;
}

async function remove(id) {
  const comment = await getById(id);
  if (!comment) return 0;
  const result = await runQuery('DELETE FROM wz_comments WHERE id = ?', [id]);
  if (result.affectedRows && comment.status === 1) {
    await runQuery('UPDATE wz_articles SET comment_count = GREATEST(0, comment_count - 1) WHERE id = ?', [
      comment.article_id,
    ]);
  }
  return result.affectedRows ?? 0;
}

/** 后台评论列表：按 status、分页、关键词（内容/文章标题/评论者），供管理员/作者审核 */
async function getList({ status, keyword, page = 1, pageSize = 20 } = {}) {
  let where = '1=1';
  const values = [];
  if (status !== undefined && status !== '') {
    where += ' AND c.status = ?';
    values.push(Number(status));
  }
  if (keyword && String(keyword).trim()) {
    const k = `%${String(keyword).trim()}%`;
    where += ' AND (c.content LIKE ? OR u.nickname LIKE ? OR (SELECT a.title FROM wz_articles a WHERE a.id = c.article_id) LIKE ?)';
    values.push(k, k, k);
  }
  const countSql = `SELECT COUNT(*) AS total FROM wz_comments c LEFT JOIN wz_users u ON u.id = c.user_id WHERE ${where}`;
  const listSql = `
    SELECT c.*, COALESCE(u.nickname, '用户已注销') AS user_name, u.username, u.avatar_url AS user_avatar,
           (SELECT a.title FROM wz_articles a WHERE a.id = c.article_id) AS article_title,
           (SELECT a.author_id FROM wz_articles a WHERE a.id = c.article_id) AS article_author_id
    FROM wz_comments c
    LEFT JOIN wz_users u ON u.id = c.user_id
    WHERE ${where}
    ORDER BY c.created_at DESC
    LIMIT ?, ?
  `;
  const offset = (Number(page) - 1) * Number(pageSize);
  const [countRow, list] = await Promise.all([
    runQuery(countSql, values),
    runQuery(listSql, [...values, offset, Number(pageSize)]),
  ]);
  list.forEach((r) => {
    r.created_at = formatDateTime(r.created_at);
  });
  return { list, total: countRow[0].total };
}

module.exports = { getListByArticleId, getById, create, update, remove, getList };
