const runQuery = require('../common/utils');

async function getList({ status } = {}) {
  let sql = 'SELECT m.*, u.nickname AS user_nickname FROM wz_messages m LEFT JOIN wz_users u ON u.id = m.user_id WHERE 1=1';
  const values = [];
  if (status !== undefined && status !== '') {
    sql += ' AND m.status = ?';
    values.push(status);
  }
  sql += ' ORDER BY m.id DESC';
  const rows = await runQuery(sql, values);
  rows.forEach((r) => {
    r.created_at = r.created_at?.toLocaleString?.() ?? r.created_at;
  });
  return rows;
}

async function create({ user_id = null, name = '匿名', content, status = 1, value = 25 }) {
  await runQuery('INSERT INTO wz_messages (user_id, name, content, status, value) VALUES (?, ?, ?, ?, ?)', [
    user_id,
    name,
    content,
    status,
    value,
  ]);
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  return rows[0]?.id;
}

async function update(id, { name, content, status, value }) {
  const set = [];
  const values = [];
  if (name !== undefined) {
    set.push('name = ?');
    values.push(name);
  }
  if (content !== undefined) {
    set.push('content = ?');
    values.push(content);
  }
  if (status !== undefined) {
    set.push('status = ?');
    values.push(status);
  }
  if (value !== undefined) {
    set.push('value = ?');
    values.push(value);
  }
  if (set.length === 0) return 0;
  values.push(id);
  const result = await runQuery(`UPDATE wz_messages SET ${set.join(', ')} WHERE id = ?`, values);
  return result.affectedRows ?? 0;
}

async function remove(id) {
  const result = await runQuery('DELETE FROM wz_messages WHERE id = ?', [id]);
  return result.affectedRows ?? 0;
}

module.exports = { getList, create, update, remove };
