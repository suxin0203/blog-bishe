const runQuery = require('../common/utils');

/**
 * 轮播图地址统一归一化为"相对路径 + 前导斜杠"（如 /upload/lbt/xxx.jpg）后入库：
 * - 数据库不再绑定任何域名/端口，本地、线上、小程序拿到的都是同一条记录
 * - 前端渲染时再按各自环境拼接 API 域名
 * - 外链图片（如 https://picsum.photos/...）不含 /upload/，原样保留
 */
function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  const uploadIndex = trimmed.indexOf('/upload/');
  if (uploadIndex !== -1) {
    return trimmed.slice(uploadIndex);
  }
  // 兼容历史数据里不带前导斜杠的 "upload/lbt/xxx.jpg"
  if (/^upload\//.test(trimmed)) {
    return `/${trimmed}`;
  }
  return trimmed;
}

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
    [normalizeImageUrl(image_url), link_url, title, sort_order, status]
  );
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  return rows[0]?.id;
}

async function update(id, { image_url, link_url, title, sort_order, status }) {
  const set = [];
  const values = [];
  if (image_url !== undefined) {
    set.push('image_url = ?');
    values.push(normalizeImageUrl(image_url));
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
