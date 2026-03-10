/**
 * 生成「将 admin/editor/user1 密码设为指定明文」的 SQL
 * 用法：node scripts/gen-bcrypt-sql.js [明文密码]
 * 默认明文：123456（与 test.js 的 TEST_PASS 一致）
 */
const bcrypt = require('bcrypt');
const saltRounds = 10;

const plain = process.argv[2] || 's18582505185';

bcrypt.hash(plain, saltRounds).then((hash) => {
  console.log('-- 将 admin/editor/user1 密码设为明文: ' + plain);
  console.log('-- 执行后可用 TEST_PASS=' + plain + ' 跑 node test.js\n');
  console.log('USE `wz-blog`;\n');
  console.log(
    "UPDATE `wz_users` SET `password` = '" + hash + "'\nWHERE `username` IN ('admin', 'editor', 'user1');"
  );
});
