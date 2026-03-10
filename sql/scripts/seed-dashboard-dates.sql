-- 看板展示用：按不同日期插入用户、文章、评论、留言，便于「用户增长趋势」「文章发布统计」「热门文章排行」有数据
-- 执行前请确保已执行 wz_blog_schema.sql + wz_blog_seed.sql（存在 wz_users、wz_articles 等及 id 1,2,3）
-- 密码统一为 123456（与 reset-test-passwords.sql 中 hash 一致），仅测试用。请根据实际库名修改 USE

USE `wzblog`;

-- 1) 用户：最近 7 天每天 2 个新用户
INSERT INTO `wz_users` (`username`,`password`,`email`,`nickname`,`role`,`is_root`,`status`,`created_at`) VALUES
('seed_d1_u1','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d1_u1@test.com','测试用户D1-1','user',0,1,DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
('seed_d1_u2','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d1_u2@test.com','测试用户D1-2','user',0,1,DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
('seed_d2_u1','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d2_u1@test.com','测试用户D2-1','user',0,1,DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
('seed_d2_u2','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d2_u2@test.com','测试用户D2-2','user',0,1,DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
('seed_d3_u1','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d3_u1@test.com','测试用户D3-1','user',0,1,DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
('seed_d3_u2','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d3_u2@test.com','测试用户D3-2','user',0,1,DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
('seed_d4_u1','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d4_u1@test.com','测试用户D4-1','user',0,1,DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
('seed_d4_u2','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d4_u2@test.com','测试用户D4-2','user',0,1,DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
('seed_d5_u1','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d5_u1@test.com','测试用户D5-1','user',0,1,DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
('seed_d5_u2','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d5_u2@test.com','测试用户D5-2','user',0,1,DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
('seed_d6_u1','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d6_u1@test.com','测试用户D6-1','user',0,1,DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
('seed_d6_u2','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d6_u2@test.com','测试用户D6-2','user',0,1,DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
('seed_d7_u1','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d7_u1@test.com','测试用户D7-1','user',0,1,CURDATE()),
('seed_d7_u2','$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa','seed_d7_u2@test.com','测试用户D7-2','user',0,1,CURDATE());

-- 2) 文章：最近 7 天每天 1～2 篇（依赖 category_id 1,2,3 与 author_id 1,2）
INSERT INTO `wz_articles` (`title`,`summary`,`content`,`category_id`,`author_id`,`status`,`view_count`,`like_count`,`comment_count`,`created_at`,`updated_at`) VALUES
('昨日发布：Vue 组合式 API 小结','组合式 API 与选项式对比','<p>内容摘要：组合式 API 更利于逻辑复用。</p>',1,1,0,88,5,2,DATE_SUB(CURDATE(), INTERVAL 6 DAY),NOW()),
('6 天前：Express 中间件实践','日志与错误处理','<p>内容摘要：中间件链与 next。</p>',2,2,0,120,8,4,DATE_SUB(CURDATE(), INTERVAL 5 DAY),NOW()),
('5 天前：MySQL 索引优化笔记','B+ 树与覆盖索引','<p>内容摘要：索引设计原则。</p>',2,1,0,256,12,6,DATE_SUB(CURDATE(), INTERVAL 5 DAY),NOW()),
('4 天前：前端工程化入门','Vite 与 Monorepo','<p>内容摘要：构建与分包。</p>',1,2,0,64,3,1,DATE_SUB(CURDATE(), INTERVAL 4 DAY),NOW()),
('3 天前：博客评论模块设计','审核与树形结构','<p>内容摘要：评论状态与父子关系。</p>',3,1,0,320,18,10,DATE_SUB(CURDATE(), INTERVAL 3 DAY),NOW()),
('2 天前：Pinia 状态管理','与 Vuex 对比','<p>内容摘要：store 与持久化。</p>',1,2,0,156,7,3,DATE_SUB(CURDATE(), INTERVAL 2 DAY),NOW()),
('昨天：数据看板 ECharts 接入','折线图与排行表','<p>内容摘要：看板接口与图表展示。</p>',3,1,0,198,9,5,DATE_SUB(CURDATE(), INTERVAL 1 DAY),NOW()),
('今日：种子数据说明','用于看板展示','<p>内容摘要：不同日期的用户与文章数据。</p>',3,2,0,42,2,0,CURDATE(),NOW());

-- 3) 评论：对文章 1,2 按日期补几条，status=1
INSERT INTO `wz_comments` (`article_id`,`user_id`,`parent_id`,`content`,`status`,`like_count`,`created_at`) VALUES
(1,NULL,NULL,'6天前的一条评论',1,0,DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(2,3,NULL,'5天前：表结构很清晰',1,0,DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(1,3,NULL,'4天前：期待更多教程',1,0,DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(2,NULL,NULL,'3天前匿名评论',1,0,DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(1,2,NULL,'2天前编辑回复',1,0,DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(2,3,NULL,'昨天：已收藏',1,0,DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(1,NULL,NULL,'今日留言支持',1,0,CURDATE());

-- 4) 留言：不同日期几条，status=1
INSERT INTO `wz_messages` (`user_id`,`name`,`content`,`status`,`value`,`created_at`) VALUES
(3,'小栈友','6天前留言：博客主题很好看',1,25,DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(NULL,'访客','5天前匿名：希望有 RSS',1,25,DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(2,'编辑者','3天前：留言管理测试',1,25,DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(NULL,'匿名','昨天：数据看板很实用',1,25,DATE_SUB(CURDATE(), INTERVAL 1 DAY));
