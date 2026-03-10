const mysql = require('mysql2/promise');
const configObj = require('./config');

const pool = mysql.createPool({
  ...configObj,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});


// 获取连接并执行操作
async function runQuery(sql) {
  const connection = await pool.getConnection();
  try {
    const [rows, fields] = await connection.query(sql);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}



// 使用占位符
// db.query('SELECT * FROM `users` WHERE `username` = ?','admin',function(err, results) {
//     console.log(results);
//   }
// );
// // 使用占位符
// db.query('SELECT * FROM `otherswitch`',function(err, results) {
//   console.log(results);
// }
// );
// // 使用占位符
// db.query('SELECT * FROM `messages`',function(err, results) {
//   console.log(results);
// }
// );// 使用占位符
// db.query('SELECT * FROM `articles`',function(err, results) {
//   console.log(results);
// }
// );// 使用占位符
// db.query('SELECT * FROM `categories`',function(err, results) {
//   console.log(results);
// }
// );


module.exports = pool;
