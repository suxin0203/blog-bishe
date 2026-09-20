/**
 * 服务器环境兼容性检查（Node 升级后 / 日常部署前运行）
 * 用法：node scripts/check-node-compat.js
 * 检查：Node 版本、全部运行时依赖可加载、bcrypt 原生模块可用、数据库连通
 */
require('dotenv').config();

const REQUIRED_NODE_MAJOR = 18; // 推荐 18/20/22 LTS；低于 14 直接不通过

function nodeMajor() {
  return Number(process.versions.node.split('.')[0]);
}

(async () => {
  let ok = true;

  // 1. Node 版本
  const v = nodeMajor();
  if (v >= REQUIRED_NODE_MAJOR) {
    console.log(`✓ Node ${process.versions.node}（≥${REQUIRED_NODE_MAJOR}，推荐）`);
  } else if (v >= 14) {
    console.log(`⚠️ Node ${process.versions.node} 可运行（AI 模块已兼容 14），但 14 已停止维护，建议升级到 18/20/22 LTS`);
  } else {
    ok = false;
    console.log(`✗ Node ${process.versions.node} 过旧，至少需要 14`);
  }

  // 2. 运行时依赖全部可加载
  const deps = [
    'express', 'mysql2', 'axios', 'dotenv', 'jsonwebtoken', 'bcrypt', 'multer',
    'cookie-parser', 'cors', 'http-errors', 'morgan', 'swagger-jsdoc', 'swagger-ui-express', 'uuid',
  ];
  for (const d of deps) {
    try {
      require(d);
      console.log(`✓ 依赖 ${d}`);
    } catch (e) {
      ok = false;
      console.log(`✗ 依赖 ${d} 加载失败: ${e.message}`);
    }
  }

  // 3. bcrypt 原生模块功能验证（Node 升级后最容易出问题的就是原生模块）
  try {
    const bcrypt = require('bcrypt');
    const hash = bcrypt.hashSync('compat-check', 4);
    if (!bcrypt.compareSync('compat-check', hash)) throw new Error('哈希自比对失败');
    console.log('✓ bcrypt 原生模块可用（登录功能正常的前提）');
  } catch (e) {
    ok = false;
    console.log('✗ bcrypt 异常（登录将不可用）:', e.message);
  }

  // 4. 数据库连通（读 .env 配置，本地=wztest-ai，线上=wztest）
  try {
    const mysql = require('mysql2/promise');
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    await conn.query('SELECT 1');
    await conn.end();
    console.log(`✓ 数据库连接: ${process.env.DB_NAME}`);
  } catch (e) {
    ok = false;
    console.log('✗ 数据库连接失败:', e.message);
  }

  console.log(ok ? '\n✅ 环境检查通过，可正常启动' : '\n❌ 环境检查未通过，请先处理上面的 ✗ 项');
  process.exit(ok ? 0 : 1);
})();
