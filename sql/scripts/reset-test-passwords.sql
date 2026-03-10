-- 将测试账号（admin / editor / user1）密码统一设为 123456
-- 执行后可用 TEST_PASS=123456 跑 node test.js；生成方式：node Express/scripts/gen-bcrypt-sql.js
-- 请根据实际库名修改 USE

USE `wzblog`;

UPDATE `wz_users` SET `password` = '$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa'
WHERE `username` IN ('admin', 'editor', 'user1');
