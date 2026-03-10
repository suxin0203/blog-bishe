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

module.exports = runQuery;