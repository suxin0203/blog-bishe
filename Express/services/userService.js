const runQuery = require('../common/utils');

async function findByUsername(username, options = {}) {
  const includeDisabled = options.includeDisabled === true;
  const sql = includeDisabled
    ? 'SELECT * FROM wz_users WHERE username = ? LIMIT 1'
    : 'SELECT * FROM wz_users WHERE username = ? AND (status IS NULL OR status = 1) LIMIT 1';
  const rows = await runQuery(sql, [username]);
  return rows[0] || null;
}

async function findByEmail(email) {
  if (!email) return null;
  const rows = await runQuery('SELECT * FROM wz_users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await runQuery('SELECT * FROM wz_users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findAll(opts = {}) {
  let where = '1=1';
  const values = [];
  const status = opts.status !== undefined && opts.status !== null && opts.status !== '' ? Number(opts.status) : null;
  if (status !== null && !Number.isNaN(status)) {
    where += ' AND status = ?';
    values.push(status);
  }
  // --------
  if (opts.role) {
    where += ' AND role = ?';
    values.push(opts.role);
  }
  // ----------
  if (opts.keyword && String(opts.keyword).trim()) {
    const k = `%${String(opts.keyword).trim()}%`;
    where += ' AND (username LIKE ? OR nickname LIKE ? OR title LIKE ?)';
    values.push(k, k, k);
  }
  const order = opts.sort === 'points'
    ? 'ORDER BY points DESC, id ASC'
    : 'ORDER BY id ASC';
  const sql = `SELECT id, username, email, nickname, avatar_url, role, is_root, status, points, title, last_login_at, created_at, updated_at FROM wz_users WHERE ${where} ${order}`;
  return runQuery(sql, values);
}

async function create({ username, password, email = null, nickname = null, role = 'user', status = 1 }) {
  const is_root = role === 'admin' ? 1 : 0;
  await runQuery(
    'INSERT INTO wz_users (username, password, email, nickname, role, is_root, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [username, password, email, nickname, role, is_root, status]
  );
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  return rows[0]?.id;
}

async function update(id, fields) {
  const allow = [
    'username',
    'nickname',
    'avatar_url',
    'email',
    'status',
    'role',
    'points',
    'title',
    'refresh_token',
    'refresh_token_expires_at',
    'reset_attempt_count',
    'reset_attempt_date',
    'openid',
  ];
  const set = [];
  const values = [];
  for (const [k, v] of Object.entries(fields)) {
    if (allow.includes(k) && v !== undefined) {
      set.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (fields.role !== undefined) {
    set.push('is_root = ?');
    values.push(fields.role === 'admin' ? 1 : 0);
  }
  if (set.length === 0) return 0;
  values.push(id);
  const result = await runQuery(`UPDATE wz_users SET ${set.join(', ')} WHERE id = ?`, values);
  return result.affectedRows ?? 0;
}

async function updatePassword(id, hashedPassword) {
  const result = await runQuery('UPDATE wz_users SET password = ? WHERE id = ?', [hashedPassword, id]);
  return result.affectedRows ?? 0;
}

async function updateLastLogin(id) {
  await runQuery('UPDATE wz_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
}

// ---------- 用户彻底删除 · 内容换绑（注销策略，见 sql/migrations/04-user-deletion-rebind.sql） ----------
const PLACEHOLDER_USERNAME = 'deleted-user';

// 占位账号「已注销用户」的 id（由 04 迁移创建，status=0 停用不可登录）
async function getPlaceholderUserId() {
  const rows = await runQuery('SELECT id FROM wz_users WHERE username = ?', [PLACEHOLDER_USERNAME]);
  if (!rows.length) {
    throw new Error('占位账号 deleted-user 不存在，请先执行 sql/migrations/04-user-deletion-rebind.sql');
  }
  return rows[0].id;
}

// 把用户名下的内容与互动/交易记录全部换绑到占位账号
async function rebindContentToPlaceholder(userId) {
  const placeholderId = await getPlaceholderUserId();
  // 先清理占位账号在同名文章下的重复点赞/收藏，避免换绑时撞唯一键
  await runQuery(
    `DELETE l FROM wz_article_likes l
     JOIN wz_article_likes d ON d.article_id = l.article_id AND d.user_id = ?
     WHERE l.user_id = ?`,
    [placeholderId, userId],
  );
  await runQuery(
    `DELETE f FROM wz_article_favorites f
     JOIN wz_article_favorites d ON d.article_id = f.article_id AND d.user_id = ?
     WHERE f.user_id = ?`,
    [placeholderId, userId],
  );
  await runQuery('UPDATE wz_articles SET author_id = ? WHERE author_id = ?', [placeholderId, userId]);
  await runQuery('UPDATE wz_article_likes SET user_id = ? WHERE user_id = ?', [placeholderId, userId]);
  await runQuery('UPDATE wz_article_favorites SET user_id = ? WHERE user_id = ?', [placeholderId, userId]);
  await runQuery('UPDATE wz_points_orders SET user_id = ? WHERE user_id = ?', [placeholderId, userId]);
  await runQuery('UPDATE wz_user_points_log SET user_id = ? WHERE user_id = ?', [placeholderId, userId]);
}

async function remove(id) {
  // 彻底删除：内容换绑到占位账号后删除用户行（文章外键已收紧为 RESTRICT）
  await rebindContentToPlaceholder(id);
  await runQuery('UPDATE wz_comments SET user_id = NULL WHERE user_id = ?', [id]);
  await runQuery('UPDATE wz_messages SET user_id = NULL WHERE user_id = ?', [id]);
  const result = await runQuery('DELETE FROM wz_users WHERE id = ?', [id]);
  return result.affectedRows ?? 0;
}

async function findByRefreshToken(token) {
  if (!token) return null;
  const rows = await runQuery(
    'SELECT * FROM wz_users WHERE refresh_token = ? AND refresh_token_expires_at > NOW()',
    [token]
  );
  return rows[0] || null;
}

module.exports = {
  findByRefreshToken,
  findByUsername,
  findByEmail,
  findById,
  findAll,
  create,
  update,
  updatePassword,
  updateLastLogin,
  rebindContentToPlaceholder,
  remove,
};
