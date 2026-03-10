const runQuery = require('../common/utils');

async function getAll() {
  return runQuery('SELECT * FROM wz_friendslink ORDER BY sort_order ASC, link_id ASC');
}

async function getById(linkId) {
  const rows = await runQuery('SELECT * FROM wz_friendslink WHERE link_id = ?', [linkId]);
  return rows[0] || null;
}

async function create({ blog_name, blog_url, blog_theme = null, blogger_name = null, contact_info = null, logo_url = null, sort_order = 1 }) {
  await runQuery(
    'INSERT INTO wz_friendslink (blog_name, blog_url, blog_theme, blogger_name, contact_info, logo_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [blog_name, blog_url, blog_theme, blogger_name, contact_info, logo_url, sort_order]
  );
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  return rows[0]?.id;
}

async function update(linkId, { blog_name, blog_url, blog_theme, blogger_name, contact_info, logo_url, sort_order }) {
  const result = await runQuery(
    'UPDATE wz_friendslink SET blog_name = ?, blog_url = ?, blog_theme = ?, blogger_name = ?, contact_info = ?, logo_url = ?, sort_order = ? WHERE link_id = ?',
    [blog_name, blog_url, blog_theme ?? null, blogger_name ?? null, contact_info ?? null, logo_url ?? null, sort_order ?? 1, linkId]
  );
  return result.affectedRows ?? 0;
}

async function remove(linkId) {
  const result = await runQuery('DELETE FROM wz_friendslink WHERE link_id = ?', [linkId]);
  return result.affectedRows ?? 0;
}

module.exports = { getAll, getById, create, update, remove };
