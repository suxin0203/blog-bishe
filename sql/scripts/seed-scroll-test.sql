-- 滚动测试用种子数据（用于测试后台各列表/表格页的卡片内滚动与分页）
-- 前置：必须先执行 wz_blog_schema.sql 建表；会使用当前库中已有的分类与用户。请根据实际库名修改 USE

SET NAMES utf8mb4;
USE `wzblog`;

-- 1) 分类：追加多条
INSERT INTO `wz_categories` (`name`,`description`,`sort_order`,`created_at`) VALUES
('分类滚动测试1','用于滚动测试',10,NOW()),('分类滚动测试2','用于滚动测试',11,NOW()),('分类滚动测试3','用于滚动测试',12,NOW()),
('分类滚动测试4','用于滚动测试',13,NOW()),('分类滚动测试5','用于滚动测试',14,NOW()),('分类滚动测试6','用于滚动测试',15,NOW()),
('分类滚动测试7','用于滚动测试',16,NOW()),('分类滚动测试8','用于滚动测试',17,NOW()),('分类滚动测试9','用于滚动测试',18,NOW()),
('分类滚动测试10','用于滚动测试',19,NOW()),('分类滚动测试11','用于滚动测试',20,NOW()),('分类滚动测试12','用于滚动测试',21,NOW()),
('分类滚动测试13','用于滚动测试',22,NOW()),('分类滚动测试14','用于滚动测试',23,NOW()),('分类滚动测试15','用于滚动测试',24,NOW()),
('分类滚动测试16','用于滚动测试',25,NOW()),('分类滚动测试17','用于滚动测试',26,NOW()),('分类滚动测试18','用于滚动测试',27,NOW()),
('分类滚动测试19','用于滚动测试',28,NOW()),('分类滚动测试20','用于滚动测试',29,NOW())
ON DUPLICATE KEY UPDATE `sort_order` = VALUES(`sort_order`);

-- 2) 标签：追加多条
INSERT INTO `wz_tags` (`name`,`created_at`) VALUES
('标签滚动1',NOW()),('标签滚动2',NOW()),('标签滚动3',NOW()),('标签滚动4',NOW()),('标签滚动5',NOW()),
('标签滚动6',NOW()),('标签滚动7',NOW()),('标签滚动8',NOW()),('标签滚动9',NOW()),('标签滚动10',NOW()),
('标签滚动11',NOW()),('标签滚动12',NOW()),('标签滚动13',NOW()),('标签滚动14',NOW()),('标签滚动15',NOW()),
('标签滚动16',NOW()),('标签滚动17',NOW()),('标签滚动18',NOW()),('标签滚动19',NOW()),('标签滚动20',NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3) 用户：追加多条（密码占位，登录请用 seed 中的账号或 reset-test-passwords）
INSERT INTO `wz_users` (`username`,`password`,`email`,`nickname`,`role`,`is_root`,`status`,`points`,`created_at`,`updated_at`) VALUES
('scroll_u1','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s1@test.com','滚动测试1','user',0,1,0,NOW(),NOW()),
('scroll_u2','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s2@test.com','滚动测试2','user',0,1,0,NOW(),NOW()),
('scroll_u3','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s3@test.com','滚动测试3','user',0,1,0,NOW(),NOW()),
('scroll_u4','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s4@test.com','滚动测试4','user',0,1,0,NOW(),NOW()),
('scroll_u5','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s5@test.com','滚动测试5','user',0,1,0,NOW(),NOW()),
('scroll_u6','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s6@test.com','滚动测试6','user',0,1,0,NOW(),NOW()),
('scroll_u7','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s7@test.com','滚动测试7','user',0,1,0,NOW(),NOW()),
('scroll_u8','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s8@test.com','滚动测试8','user',0,1,0,NOW(),NOW()),
('scroll_u9','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s9@test.com','滚动测试9','user',0,1,0,NOW(),NOW()),
('scroll_u10','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s10@test.com','滚动测试10','user',0,1,0,NOW(),NOW()),
('scroll_u11','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s11@test.com','滚动测试11','user',0,1,0,NOW(),NOW()),
('scroll_u12','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s12@test.com','滚动测试12','user',0,1,0,NOW(),NOW()),
('scroll_u13','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s13@test.com','滚动测试13','user',0,1,0,NOW(),NOW()),
('scroll_u14','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s14@test.com','滚动测试14','user',0,1,0,NOW(),NOW()),
('scroll_u15','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s15@test.com','滚动测试15','user',0,1,0,NOW(),NOW()),
('scroll_u16','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s16@test.com','滚动测试16','user',0,1,0,NOW(),NOW()),
('scroll_u17','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s17@test.com','滚动测试17','user',0,1,0,NOW(),NOW()),
('scroll_u18','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s18@test.com','滚动测试18','user',0,1,0,NOW(),NOW()),
('scroll_u19','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s19@test.com','滚动测试19','user',0,1,0,NOW(),NOW()),
('scroll_u20','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','s20@test.com','滚动测试20','user',0,1,0,NOW(),NOW())
ON DUPLICATE KEY UPDATE `nickname` = VALUES(`nickname`);

-- 4) 文章：追加多篇（使用库中已有分类与用户）
INSERT INTO `wz_articles` (`title`,`summary`,`content`,`category_id`,`author_id`,`status`,`view_count`,`like_count`,`comment_count`,`favorite_count`,`created_at`,`updated_at`)
SELECT '滚动测试文章4','摘要4','<p>正文4</p>',(SELECT id FROM wz_categories ORDER BY id LIMIT 1),(SELECT id FROM wz_users ORDER BY id LIMIT 1),0,0,0,0,0,NOW(),NOW() FROM DUAL
WHERE EXISTS (SELECT 1 FROM wz_categories LIMIT 1) AND EXISTS (SELECT 1 FROM wz_users LIMIT 1);
INSERT INTO `wz_articles` (`title`,`summary`,`content`,`category_id`,`author_id`,`status`,`view_count`,`like_count`,`comment_count`,`favorite_count`,`created_at`,`updated_at`)
SELECT '滚动测试文章5','摘要5','<p>正文5</p>',(SELECT id FROM wz_categories ORDER BY id LIMIT 1),(SELECT id FROM wz_users ORDER BY id LIMIT 1),0,0,0,0,0,NOW(),NOW() FROM DUAL
WHERE EXISTS (SELECT 1 FROM wz_categories LIMIT 1) AND EXISTS (SELECT 1 FROM wz_users LIMIT 1);
INSERT INTO `wz_articles` (`title`,`summary`,`content`,`category_id`,`author_id`,`status`,`view_count`,`like_count`,`comment_count`,`favorite_count`,`created_at`,`updated_at`)
SELECT '滚动测试文章6','摘要6','<p>正文6</p>',(SELECT id FROM wz_categories ORDER BY id LIMIT 1),(SELECT id FROM wz_users ORDER BY id LIMIT 1),0,0,0,0,0,NOW(),NOW() FROM DUAL
WHERE EXISTS (SELECT 1 FROM wz_categories LIMIT 1) AND EXISTS (SELECT 1 FROM wz_users LIMIT 1);
INSERT INTO `wz_articles` (`title`,`summary`,`content`,`category_id`,`author_id`,`status`,`view_count`,`like_count`,`comment_count`,`favorite_count`,`created_at`,`updated_at`)
SELECT '滚动测试文章7','摘要7','<p>正文7</p>',(SELECT id FROM wz_categories ORDER BY id LIMIT 1),(SELECT id FROM wz_users ORDER BY id LIMIT 1),0,0,0,0,0,NOW(),NOW() FROM DUAL
WHERE EXISTS (SELECT 1 FROM wz_categories LIMIT 1) AND EXISTS (SELECT 1 FROM wz_users LIMIT 1);
INSERT INTO `wz_articles` (`title`,`summary`,`content`,`category_id`,`author_id`,`status`,`view_count`,`like_count`,`comment_count`,`favorite_count`,`created_at`,`updated_at`)
SELECT '滚动测试文章8','摘要8','<p>正文8</p>',(SELECT id FROM wz_categories ORDER BY id LIMIT 1),(SELECT id FROM wz_users ORDER BY id LIMIT 1),0,0,0,0,0,NOW(),NOW() FROM DUAL
WHERE EXISTS (SELECT 1 FROM wz_categories LIMIT 1) AND EXISTS (SELECT 1 FROM wz_users LIMIT 1);
INSERT INTO `wz_articles` (`title`,`summary`,`content`,`category_id`,`author_id`,`status`,`view_count`,`like_count`,`comment_count`,`favorite_count`,`created_at`,`updated_at`)
SELECT '滚动测试文章9','摘要9','<p>正文9</p>',(SELECT id FROM wz_categories ORDER BY id LIMIT 1),(SELECT id FROM wz_users ORDER BY id LIMIT 1),0,0,0,0,0,NOW(),NOW() FROM DUAL
WHERE EXISTS (SELECT 1 FROM wz_categories LIMIT 1) AND EXISTS (SELECT 1 FROM wz_users LIMIT 1);
INSERT INTO `wz_articles` (`title`,`summary`,`content`,`category_id`,`author_id`,`status`,`view_count`,`like_count`,`comment_count`,`favorite_count`,`created_at`,`updated_at`)
SELECT '滚动测试文章10','摘要10','<p>正文10</p>',(SELECT id FROM wz_categories ORDER BY id LIMIT 1),(SELECT id FROM wz_users ORDER BY id LIMIT 1),0,0,0,0,0,NOW(),NOW() FROM DUAL
WHERE EXISTS (SELECT 1 FROM wz_categories LIMIT 1) AND EXISTS (SELECT 1 FROM wz_users LIMIT 1);

-- 5) 留言：匿名多条
INSERT INTO `wz_messages` (`user_id`,`name`,`content`,`status`,`value`,`created_at`) VALUES
(NULL,'匿名','留言滚动测试 1',1,25,NOW()),(NULL,'匿名','留言滚动测试 2',1,25,NOW()),(NULL,'匿名','留言滚动测试 3',0,25,NOW()),
(NULL,'匿名','留言滚动测试 4',1,25,NOW()),(NULL,'匿名','留言滚动测试 5',1,25,NOW()),(NULL,'匿名','留言滚动测试 6',1,25,NOW()),
(NULL,'匿名','留言滚动测试 7',1,25,NOW()),(NULL,'匿名','留言滚动测试 8',1,25,NOW()),(NULL,'匿名','留言滚动测试 9',0,25,NOW()),
(NULL,'匿名','留言滚动测试 10',1,25,NOW()),(NULL,'匿名','留言滚动测试 11',1,25,NOW()),(NULL,'匿名','留言滚动测试 12',1,25,NOW());
