const runQuery = require('../common/utils');

async function findByUsername(username) {
  const rows = await runQuery('SELECT * FROM wz_users WHERE username = ?', [username]);
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

async function create({ username, password, email = null, nickname = null, role = 'user' }) {
  const is_root = role === 'admin' ? 1 : 0;
  await runQuery(
    'INSERT INTO wz_users (username, password, email, nickname, role, is_root) VALUES (?, ?, ?, ?, ?, ?)',
    [username, password, email, nickname, role, is_root]
  );
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  return rows[0]?.id;
}

async function update(id, fields) {
  const allow = ['nickname', 'avatar_url', 'email', 'status', 'role', 'points', 'title', 'refresh_token', 'refresh_token_expires_at', 'reset_attempt_count', 'reset_attempt_date'];
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

async function remove(id) {
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
  remove,
};
