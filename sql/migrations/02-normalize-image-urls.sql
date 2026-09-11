-- ============================================================
-- 迁移脚本：图片地址归一化 + 头像域名迁移 + 扫码会话表补齐
-- 创建时间：2026-09-12
-- 关联文档：/Bug修复记录.md（轮播图丢失、安卓微信扫码失败两节）
--
-- ✅ 执行状态（2026-09-12 更新）：
-- 经扫码会话记录交叉验证，线上服务使用的数据库就是 wztest
-- （线上创建的 qr_login_sessions 记录与 wztest 完全一致）。
-- 本脚本第 1、2 节的数据修复已于 2026-09-12 直接在 wztest 执行完毕，
-- 全库 8 张表复扫零残留。保留本脚本作为变更记录；
-- 第 3 节建表语句供全新环境初始化使用（IF NOT EXISTS，可重复执行）。
-- 注：config.js 中注释的 wz-blog 库为历史配置，其账号未开放外部访问，
-- 与线上运行无关。
-- ============================================================

-- ---------- 1. 轮播图地址归一化 ----------
-- 背景：后台上传时把「当前环境 API 域名」拼进了 image_url，
-- 线上库存在 http://127.0.0.1/upload/... 这类只有服务器自己能访问的地址，
-- 导致访客浏览器轮播图空白。
-- 修复：统一截取 /upload/ 起始的相对路径入库，前端渲染时再拼接各自环境的 API 域名。

-- 执行前核对（应看到将要被归一化的行）：
SELECT id, image_url FROM wz_swiper WHERE image_url LIKE 'http%://%/upload/%';

-- 归一化：http(s)://任意域名/upload/xxx -> /upload/xxx
UPDATE wz_swiper
SET image_url = SUBSTRING(image_url, LOCATE('/upload/', image_url))
WHERE image_url LIKE 'http%://%/upload/%';

-- 兼容旧数据：无前导斜杠的 upload/xxx -> /upload/xxx
UPDATE wz_swiper
SET image_url = CONCAT('/', image_url)
WHERE image_url NOT LIKE 'http%' AND image_url NOT LIKE '/%' AND image_url LIKE 'upload/%';

-- ---------- 2. 默认头像与站点 logo 域名迁移 ----------
-- 背景：default_avatar_url、site_logo_url 及一批用户头像指向旧域名 api.suxin23.cn，
-- 与现役 API 域名 wzapi.suxin23.cn 不一致，旧域名下线即全站头像失效。
-- 前置条件：新版后端仓库的 public/upload/ 下已包含 avatar.png 与
--   upload/20260320/708c1ba2-1390-4376-8d44-c4ba9cbdb2b8.png，并已部署到服务器。

-- 执行前核对：
SELECT COUNT(*) AS users_to_fix FROM wz_users WHERE avatar_url LIKE '%//api.suxin23.cn%';
SELECT id, name, content FROM wz_otherswitch WHERE content LIKE '%//api.suxin23.cn%';

UPDATE wz_users
SET avatar_url = REPLACE(avatar_url, '//api.suxin23.cn', '//wzapi.suxin23.cn')
WHERE avatar_url LIKE '%//api.suxin23.cn%';

UPDATE wz_otherswitch
SET content = REPLACE(content, '//api.suxin23.cn', '//wzapi.suxin23.cn')
WHERE content LIKE '%//api.suxin23.cn%';

-- ---------- 3. 扫码登录会话表补齐（仅新环境需要） ----------
-- 背景：wz_qr_login_sessions 此前不在任何建库脚本中，是手工建的；
-- 新环境按本段建表，已有表会因 IF NOT EXISTS 跳过。
-- 说明：user_agent 列保持 varchar(255)，与代码中的截断逻辑一致；
-- 同时代码侧已增加"UA 超长导致写入失败时自动放弃 UA 重试"的兜底，
-- 即使列长度再被改小，也不会再出现安卓微信扫码生成二维码失败。

CREATE TABLE IF NOT EXISTS `wz_qr_login_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `scene_id` varchar(64) NOT NULL COMMENT '扫码登录会话ID，对应二维码中的唯一标识',
  `status` enum('pending','confirmed','completed','expired') NOT NULL DEFAULT 'pending' COMMENT '会话状态',
  `user_id` int unsigned DEFAULT NULL COMMENT '确认登录的用户ID，关联wz_users.id',
  `channel` varchar(32) NOT NULL DEFAULT 'pc' COMMENT '登录通道，例如pc、h5等',
  `temp_openid` varchar(128) DEFAULT NULL COMMENT '扫码得到但尚未注册/绑定的openid',
  `bind_token` varchar(128) DEFAULT NULL COMMENT '用于注册/绑定的一次性token',
  `bind_token_expires_at` datetime DEFAULT NULL COMMENT 'bind_token过期时间',
  `client_ip` varchar(45) DEFAULT NULL COMMENT '发起扫码登录的PC端IP（可选）',
  `user_agent` varchar(255) DEFAULT NULL COMMENT 'PC浏览器UA（可选）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `expires_at` datetime NOT NULL COMMENT '会话过期时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scene_id` (`scene_id`),
  KEY `idx_status_expires` (`status`,`expires_at`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_bind_token` (`bind_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PC扫码登录会话表';

-- ---------- 4. 执行后验证 ----------
-- 轮播接口应返回相对路径，且不再出现 127.0.0.1 / localhost：
-- SELECT id, image_url FROM wz_swiper;
-- 页面验证：PC 首页轮播正常显示；安卓微信内打开登录页能生成小程序码。
