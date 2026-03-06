const pool = require('./pool');


// 获取连接并执行操作
async function runQuery(sql,values) {
  const connection = await pool.getConnection();
  try {
    const [rows, fields] = await connection.query(sql,values);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = runQuery;