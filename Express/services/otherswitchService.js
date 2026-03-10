const runQuery = require('../common/utils');

async function getAll(deleted = 0) {
  return runQuery('SELECT * FROM wz_otherswitch WHERE (deleted = ? OR deleted IS NULL) ORDER BY id', [deleted]);
}

async function getByKey(name) {
  const rows = await runQuery('SELECT * FROM wz_otherswitch WHERE name = ? AND deleted = 0', [name]);
  return rows[0] || null;
}

async function create({ name, content = null, value = 0 }) {
  await runQuery('INSERT INTO wz_otherswitch (name, content, value, deleted) VALUES (?, ?, ?, 0)', [name, content, value]);
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  return rows[0]?.id;
}

async function update(id, { name, content, value, deleted }) {
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
  if (value !== undefined) {
    set.push('value = ?');
    values.push(value);
  }
  if (deleted !== undefined) {
    set.push('deleted = ?');
    values.push(deleted);
  }
  if (set.length === 0) return 0;
  values.push(id);
  const result = await runQuery(`UPDATE wz_otherswitch SET ${set.join(', ')} WHERE id = ?`, values);
  return result.affectedRows ?? 0;
}

async function remove(id) {
  const result = await runQuery('DELETE FROM wz_otherswitch WHERE id = ?', [id]);
  return result.affectedRows ?? 0;
}

module.exports = { getAll, getByKey, create, update, remove };
