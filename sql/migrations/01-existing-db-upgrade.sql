-- ============================================================
-- 文栈博客 · 已有库升级（表结构 + 全局配置）
-- 适用：由旧版创建的数据库，需补充新字段与配置项
-- 使用：INSERT 可重复执行；ALTER 若报 Duplicate column 表示列已存在，可忽略
-- ============================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- 1. 扩展 otherswitch.content 为 TEXT（便于存 JSON/长文本）
-- ------------------------------------------------------------
ALTER TABLE wz_otherswitch MODIFY COLUMN content TEXT NULL DEFAULT NULL COMMENT '配置 value，可为 JSON';

-- ------------------------------------------------------------
-- 2. 用户表：Token 刷新、找回密码尝试
-- ------------------------------------------------------------
ALTER TABLE wz_users ADD COLUMN refresh_token VARCHAR(512) NULL DEFAULT NULL COMMENT '刷新令牌';
ALTER TABLE wz_users ADD COLUMN refresh_token_expires_at DATETIME NULL DEFAULT NULL COMMENT '刷新令牌过期时间';
ALTER TABLE wz_users ADD COLUMN reset_attempt_count INT NOT NULL DEFAULT 0 COMMENT '当日找回密码错误次数';
ALTER TABLE wz_users ADD COLUMN reset_attempt_date DATE NULL DEFAULT NULL COMMENT '找回密码尝试日期';

-- ------------------------------------------------------------
-- 3. 文章表：流量来源统计
-- ------------------------------------------------------------
ALTER TABLE wz_articles ADD COLUMN view_internal_count INT NOT NULL DEFAULT 0 COMMENT '站内来源阅读数';
ALTER TABLE wz_articles ADD COLUMN view_external_count INT NOT NULL DEFAULT 0 COMMENT '站外来源阅读数';

-- ------------------------------------------------------------
-- 4. 全局配置 INSERT（可重复执行）
-- ------------------------------------------------------------
INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'sensitive_words', '[]', 0, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'sensitive_words' AND (deleted = 0 OR deleted IS NULL));

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'site_name', '文栈博客', 0, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'site_name' AND (deleted = 0 OR deleted IS NULL));

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'site_description', '也许，将会是最好用的博客管理系统', 0, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'site_description' AND (deleted = 0 OR deleted IS NULL));

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'site_logo_url', '', 0, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'site_logo_url' AND (deleted = 0 OR deleted IS NULL));

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'default_avatar_url', 'https://api.suxin23.cn/upload/avatar.png', 0, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'default_avatar_url' AND (deleted = 0 OR deleted IS NULL));

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'footer_title', 'Suxin ·', 0, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'footer_title' AND (deleted = 0 OR deleted IS NULL));

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'footer_content', '© 2022 - 也许，将会是最好用的博客管理系统！', 0, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'footer_content' AND (deleted = 0 OR deleted IS NULL));

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'footer_icp', '蜀ICP备2022022757', 0, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'footer_icp' AND (deleted = 0 OR deleted IS NULL));

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'carousel_notice', '欢迎来到我的博客', 1, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'carousel_notice' LIMIT 1);

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'carousel_noticecontent', '记录技术与生活', 1, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'carousel_noticecontent' LIMIT 1);

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'detail_notice', '点此留言', 1, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'detail_notice' LIMIT 1);

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'detail_noticecontent', '广告位招租', 1, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'detail_noticecontent' LIMIT 1);

INSERT INTO wz_otherswitch (name, content, value, deleted)
SELECT 'promo_card', '{"title":"如何成功","tags":["教程","思维","联想"],"content":"卡片正文示例"}', 1, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM wz_otherswitch WHERE name = 'promo_card' LIMIT 1);
