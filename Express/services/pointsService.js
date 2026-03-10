const runQuery = require('../common/utils');
const userService = require('./userService');

// ---------- 积分商品 ----------
async function getGoodsList(opts = {}) {
  const onlyOnSale = opts.all !== true;
  let where = onlyOnSale ? 'status = 1' : '1=1';
  const values = [];
  if (opts.keyword && String(opts.keyword).trim()) {
    const k = `%${String(opts.keyword).trim()}%`;
    where += ' AND (name LIKE ? OR description LIKE ?)';
    values.push(k, k);
  }
  const countSql = `SELECT COUNT(*) AS total FROM wz_points_goods WHERE ${where}`;
  const totalRes = await runQuery(countSql, values);
  const total = totalRes[0].total;

  const page = opts.page != null ? Math.max(1, Number(opts.page)) : null;
  const pageSize = opts.pageSize != null ? Math.min(100, Math.max(1, Number(opts.pageSize))) : null;
  let list;
  if (page != null && pageSize != null) {
    const offset = (page - 1) * pageSize;
    const listSql = `SELECT * FROM wz_points_goods WHERE ${where} ORDER BY id LIMIT ?, ?`;
    list = await runQuery(listSql, [...values, offset, pageSize]);
  } else {
    const listSql = `SELECT * FROM wz_points_goods WHERE ${where} ORDER BY id`;
    list = await runQuery(listSql, values);
  }
  return { list, total };
}

async function getGoodsById(id) {
  const rows = await runQuery('SELECT * FROM wz_points_goods WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createGoods({ name, type = 'physical', description, image_url, points_cost, stock, status = 1 }) {
  await runQuery(
    'INSERT INTO wz_points_goods (name, type, description, image_url, points_cost, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, type, description ?? null, image_url ?? null, points_cost, stock, status]
  );
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  return rows[0]?.id;
}

async function updateGoods(id, fields) {
  const allow = ['name', 'type', 'description', 'image_url', 'points_cost', 'stock', 'status'];
  const set = [];
  const values = [];
  for (const [k, v] of Object.entries(fields)) {
    if (allow.includes(k) && v !== undefined) {
      set.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (set.length === 0) return 0;
  values.push(id);
  const result = await runQuery(`UPDATE wz_points_goods SET ${set.join(', ')} WHERE id = ?`, values);
  return result.affectedRows ?? 0;
}

async function removeGoods(id) {
  const orderRows = await runQuery('SELECT COUNT(*) AS cnt FROM wz_points_orders WHERE goods_id = ?', [id]);
  if (orderRows[0].cnt > 0) {
    const err = new Error('该商品已有订单记录，无法删除。可先下架或联系管理员处理订单后再删。');
    err.code = 'HAS_ORDERS';
    throw err;
  }
  const result = await runQuery('DELETE FROM wz_points_goods WHERE id = ?', [id]);
  return result.affectedRows ?? 0;
}

// ---------- 积分订单 ----------
async function getOrderList({ userId, status, keyword, page = 1, pageSize = 10 } = {}) {
  let where = '1=1';
  const values = [];
  if (userId) {
    where += ' AND o.user_id = ?';
    values.push(userId);
  }
  if (status !== undefined && status !== '') {
    where += ' AND o.status = ?';
    values.push(status);
  }
  if (keyword && String(keyword).trim()) {
    where += ' AND g.name LIKE ?';
    values.push(`%${String(keyword).trim()}%`);
  }
  const countSql = `SELECT COUNT(*) AS total FROM wz_points_orders o LEFT JOIN wz_points_goods g ON g.id = o.goods_id WHERE ${where}`;
  const offset = (Number(page) - 1) * Number(pageSize);
  const listSql = `
    SELECT o.*, g.name AS goods_name, g.type AS goods_type,
           u.username AS redeemer_username
    FROM wz_points_orders o
    LEFT JOIN wz_points_goods g ON g.id = o.goods_id
    LEFT JOIN wz_users u ON u.id = o.user_id
    WHERE ${where}
    ORDER BY o.id DESC
    LIMIT ?, ?
  `;
  const [countRow, list] = await Promise.all([
    runQuery(countSql, values),
    runQuery(listSql, [...values, offset, Number(pageSize)]),
  ]);
  list.forEach((o) => {
    o.redeemer_username = o.redeemer_username ?? o.username ?? '';
    o.created_at = o.created_at?.toLocaleString?.() ?? o.created_at;
    o.updated_at = o.updated_at?.toLocaleString?.() ?? o.updated_at;
  });
  return { list, total: countRow[0].total };
}

async function getOrderById(id) {
  const rows = await runQuery(
    `SELECT o.*, g.name AS goods_name, g.type AS goods_type,
            u.username AS redeemer_username
     FROM wz_points_orders o
     LEFT JOIN wz_points_goods g ON g.id = o.goods_id
     LEFT JOIN wz_users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [id]
  );
  const row = rows[0] || null;
  if (row) {
    row.redeemer_username = row.redeemer_username ?? row.username ?? '';
  }
  return row;
}

async function createOrder({ user_id, goods_id, quantity = 1, receiver_name, receiver_phone, receiver_address, user_remark }) {
  const goods = await getGoodsById(goods_id);
  if (!goods || goods.status !== 1) throw new Error('商品不存在或已下架');
  const total = goods.points_cost * quantity;
  const userRows = await runQuery('SELECT points FROM wz_users WHERE id = ?', [user_id]);
  if (!userRows.length || userRows[0].points < total) throw new Error('积分不足');
  if (goods.stock != null && goods.stock < quantity) throw new Error('库存不足');

  await runQuery(
    'INSERT INTO wz_points_orders (user_id, goods_id, quantity, points_cost, total_points, receiver_name, receiver_phone, receiver_address, user_remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [user_id, goods_id, quantity, goods.points_cost, total, receiver_name ?? null, receiver_phone ?? null, receiver_address ?? null, user_remark ?? null]
  );
  const rows = await runQuery('SELECT LAST_INSERT_ID() AS id');
  const orderId = rows[0]?.id;

  await runQuery('UPDATE wz_users SET points = points - ? WHERE id = ?', [total, user_id]);
  await runQuery('INSERT INTO wz_user_points_log (user_id, `change`, reason) VALUES (?, ?, ?)', [
    user_id,
    -total,
    'redeem_goods',
  ]);
  if (goods.stock != null) {
    await runQuery('UPDATE wz_points_goods SET stock = stock - ? WHERE id = ?', [quantity, goods_id]);
  }

  if (goods.type === 'title') {
    await runQuery('UPDATE wz_points_orders SET status = ? WHERE id = ?', ['completed', orderId]);
    await userService.update(user_id, { title: goods.name || '' });
    return { orderId, isTitle: true, titleName: goods.name || '' };
  }
  return orderId;
}

async function updateOrderStatus(id, { status, logistics_company, logistics_no, admin_remark }) {
  const set = ['status = ?'];
  const values = [status];
  if (logistics_company !== undefined) {
    set.push('logistics_company = ?');
    values.push(logistics_company);
  }
  if (logistics_no !== undefined) {
    set.push('logistics_no = ?');
    values.push(logistics_no);
  }
  if (admin_remark !== undefined) {
    set.push('admin_remark = ?');
    values.push(admin_remark);
  }
  values.push(id);
  const result = await runQuery(`UPDATE wz_points_orders SET ${set.join(', ')} WHERE id = ?`, values);
  return result.affectedRows ?? 0;
}

async function addPointsLog(userId, change, reason) {
  await runQuery('INSERT INTO wz_user_points_log (user_id, `change`, reason) VALUES (?, ?, ?)', [
    userId,
    change,
    reason,
  ]);
  await runQuery('UPDATE wz_users SET points = points + ? WHERE id = ?', [change, userId]);
}

/** 当日是否已有该原因的积分记录（用于每日首次登录等） */
async function hasPointsLogToday(userId, reason) {
  const rows = await runQuery(
    'SELECT 1 FROM wz_user_points_log WHERE user_id = ? AND reason = ? AND DATE(created_at) = CURDATE() LIMIT 1',
    [userId, reason]
  );
  return rows.length > 0;
}

async function getPointsLogList(userId, { page = 1, pageSize = 20 } = {}) {
  const offset = (Number(page) - 1) * Number(pageSize);
  const countRow = await runQuery('SELECT COUNT(*) AS total FROM wz_user_points_log WHERE user_id = ?', [userId]);
  const list = await runQuery(
    'SELECT * FROM wz_user_points_log WHERE user_id = ? ORDER BY id DESC LIMIT ?, ?',
    [userId, offset, Number(pageSize)]
  );
  list.forEach((r) => {
    r.created_at = r.created_at?.toLocaleString?.() ?? r.created_at;
  });
  return { list, total: countRow[0].total };
}

module.exports = {
  getGoodsList,
  getGoodsById,
  createGoods,
  updateGoods,
  removeGoods,
  getOrderList,
  getOrderById,
  createOrder,
  updateOrderStatus,
  addPointsLog,
  hasPointsLogToday,
  getPointsLogList,
};
