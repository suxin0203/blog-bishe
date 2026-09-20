-- ============================================================
-- 迁移脚本：用户注销/删除 · 内容换绑占位账号 + 外键收紧
-- 创建时间：2026-09-20
-- 关联文档：docs/AI向导-方案一设计计划.md（二期增补 · 注销策略）
--
-- 背景：wz_articles.author_id 原为 ON DELETE CASCADE——彻底删除(hard=1)
-- 用户会级联删除其全部文章；有点赞/收藏的用户则因 RESTRICT 直接报错删除失败。
--
-- 方案（主流社区做法）：创建不可登录的占位账号「已注销用户」，
-- 彻底删除用户前，后端先将其内容与互动/交易记录换绑到占位账号，再删用户行。
-- 外键同时收紧为 RESTRICT：不换绑就删不掉，杜绝内容静默丢失。
--
-- 执行环境：
--   开发库 wztest-ai：随二期开发立即执行；
--   正式库 wztest：上线同步时执行（幂等，可重复执行）。
-- ============================================================

-- ---------- 1. 占位账号「已注销用户」（幂等） ----------
-- status=0 停用 + 随机哈希：双重保证无法登录；nickname 用于历史内容展示
INSERT INTO wz_users (username, password, nickname, role, is_root, status, points, reset_attempt_count, reset_attempt_date)
SELECT 'deleted-user',
       '$2b$10$DoMN.uTRf587yxoL1LHs5.g0rA54s3i37C1ye0GRCyS/bcGKC4s1K',
       '已注销用户', 'user', 0, 0, 0, 0, CURDATE()
WHERE NOT EXISTS (SELECT 1 FROM wz_users WHERE username = 'deleted-user');

-- ---------- 2. 外键收紧：CASCADE → RESTRICT ----------
-- 文章是内容资产，删除用户前必须先换绑（后端已实现），不允许静默级联删除
ALTER TABLE wz_articles DROP FOREIGN KEY fk_wz_articles_author;
ALTER TABLE wz_articles ADD CONSTRAINT fk_wz_articles_author
  FOREIGN KEY (author_id) REFERENCES wz_users (id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 积分订单与流水是交易记录，同样禁止级联删除
ALTER TABLE wz_points_orders DROP FOREIGN KEY fk_wz_points_orders_user;
ALTER TABLE wz_points_orders ADD CONSTRAINT fk_wz_points_orders_user
  FOREIGN KEY (user_id) REFERENCES wz_users (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE wz_user_points_log DROP FOREIGN KEY fk_wz_points_user;
ALTER TABLE wz_user_points_log ADD CONSTRAINT fk_wz_points_user
  FOREIGN KEY (user_id) REFERENCES wz_users (id) ON DELETE RESTRICT ON UPDATE CASCADE;
