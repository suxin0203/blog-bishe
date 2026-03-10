const runQuery = require('../common/utils');

async function getList(onlyShow = true) {
  let sql = 'SELECT * FROM wz_swiper';
  const values = [];
  if (onlyShow) {
    sql += ' WHERE status = 1';
  }
  sql += ' ORDER BY sort_order ASC, id ASC';
  return runQuery(sql, values);
}

async function getById(id) {
  const rows = await runQuery('SELECT * FROM wz_swiper WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ image_url, link_url = null, title = null, sort_order = 1, status = 1 }) {
  await runQuery(
    'INSERT INTO wz_swiper (image_url, link_url, title, sort_order, status) VALUES (?, ?, ?, ?, ?)',
    [image_url, link_url, title, sort_order, status]
  );
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  return rows[0]?.id;
}

async function update(id, { image_url, link_url, title, sort_order, status }) {
  const set = [];
  const values = [];
  if (image_url !== undefined) {
    set.push('image_url = ?');
    values.push(image_url);
  }
  if (link_url !== undefined) {
    set.push('link_url = ?');
    values.push(link_url);
  }
  if (title !== undefined) {
    set.push('title = ?');
    values.push(title);
  }
  if (sort_order !== undefined) {
    set.push('sort_order = ?');
    values.push(sort_order);
  }
  if (status !== undefined) {
    set.push('status = ?');
    values.push(status);
  }
  if (set.length === 0) return 0;
  values.push(id);
  const result = await runQuery(`UPDATE wz_swiper SET ${set.join(', ')} WHERE id = ?`, values);
  return result.affectedRows ?? 0;
}

async function remove(id) {
  const result = await runQuery('DELETE FROM wz_swiper WHERE id = ?', [id]);
  return result.affectedRows ?? 0;
}

module.exports = { getList, getById, create, update, remove };
