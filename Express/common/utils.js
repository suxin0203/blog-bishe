const pool = require('./pool');

/** 执行查询，连接被重置时自动重试一次 */
async function runQuery(sql, values) {
  const run = async () => {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(sql, values || []);
      return rows;
    } finally {
      connection.release();
    }
  };
  try {
    return await run();
  } catch (err) {
    if (err && (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ETIMEDOUT')) {
      try {
        return await run();
      } catch (e) {
        throw e;
      }
    }
    throw err;
  }
}

/**
 * 事务执行：fn 收到一个绑定了单一连接的事务版 runQuery，
 * 抛错自动回滚，成功自动提交。用于"校验-写入-扣减"必须同生共死的场景（如积分下单）。
 */
async function withTransaction(fn) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const query = (sql, values) => connection.query(sql, values || []).then(([rows]) => rows);
    const result = await fn(query);
    await connection.commit();
    return result;
  } catch (err) {
    try {
      await connection.rollback();
    } catch (_) {}
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = runQuery;
module.exports.withTransaction = withTransaction;