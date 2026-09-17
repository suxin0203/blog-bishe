// 数据库连接配置（线上 MySQL：47.109.90.45，库 wztest 即线上库）
// 注：JWT 密钥统一从 common/jwt.js 取，不要在这里配置
// 密钥统一走 Express/.env（模板见 .env.example）；|| 后的旧值仅为兼容未配置 .env 的
// 已部署环境。在服务器上补好 .env 并更换数据库密码后，应删除这些明文回退值。
require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || "47.109.90.45",
  user: process.env.DB_USER || "wztest",
  password: process.env.DB_PASSWORD || "CDD7KCtYecj6a5FC",
  database: process.env.DB_NAME || "wztest"
};
