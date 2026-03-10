/*
 * 文栈博客 - 建表语句（仅保留项目实际使用的表）
 * 已移除未使用的表：wz_activity, wz_activity_sign, wz_role_permissions
 * 生成日期：2026-03
 */

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 用户表
-- ----------------------------
DROP TABLE IF EXISTS `wz_user_points_log`;
DROP TABLE IF EXISTS `wz_points_orders`;
DROP TABLE IF EXISTS `wz_points_goods`;
DROP TABLE IF EXISTS `wz_swiper`;
DROP TABLE IF EXISTS `wz_friendslink`;
DROP TABLE IF EXISTS `wz_otherswitch`;
DROP TABLE IF EXISTS `wz_messages`;
DROP TABLE IF EXISTS `wz_article_favorites`;
DROP TABLE IF EXISTS `wz_article_likes`;
DROP TABLE IF EXISTS `wz_comments`;
DROP TABLE IF EXISTS `wz_article_tags`;
DROP TABLE IF EXISTS `wz_articles`;
DROP TABLE IF EXISTS `wz_tags`;
DROP TABLE IF EXISTS `wz_categories`;
DROP TABLE IF EXISTS `wz_users`;
-- 未使用表一并删除
DROP TABLE IF EXISTS `wz_activity_sign`;
DROP TABLE IF EXISTS `wz_activity`;
DROP TABLE IF EXISTS `wz_role_permissions`;

-- ----------------------------
-- Table: wz_users
-- ----------------------------
CREATE TABLE `wz_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL COMMENT '密码哈希',
  `email` varchar(150) DEFAULT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT 'https://api.suxin23.cn/upload/avatar.png',
  `role` enum('user','editor','admin') NOT NULL DEFAULT 'user' COMMENT '角色',
  `is_root` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1=管理员',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=正常，0=禁用',
  `points` int NOT NULL DEFAULT 0 COMMENT '积分',
  `title` varchar(50) DEFAULT NULL COMMENT '当前称号',
  `openid` varchar(200) DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `refresh_token` varchar(512) DEFAULT NULL,
  `refresh_token_expires_at` datetime DEFAULT NULL,
  `reset_attempt_count` int NOT NULL DEFAULT 0,
  `reset_attempt_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wz_username` (`username`),
  UNIQUE KEY `uk_wz_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_categories
-- ----------------------------
CREATE TABLE `wz_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `sort_order` int DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wz_category_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_tags
-- ----------------------------
CREATE TABLE `wz_tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wz_tag_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_articles
-- ----------------------------
CREATE TABLE `wz_articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `summary` varchar(500) DEFAULT NULL COMMENT '摘要',
  `cover_url` varchar(255) DEFAULT NULL COMMENT '封面图 URL',
  `content` longtext NOT NULL COMMENT '正文',
  `category_id` int NOT NULL,
  `author_id` int NOT NULL COMMENT '作者',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '0=展示，1=置顶，2=回收站',
  `view_count` int NOT NULL DEFAULT 0,
  `like_count` int NOT NULL DEFAULT 0,
  `comment_count` int NOT NULL DEFAULT 0,
  `favorite_count` int NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `view_internal_count` int NOT NULL DEFAULT 0 COMMENT '站内阅读数',
  `view_external_count` int NOT NULL DEFAULT 0 COMMENT '站外阅读数',
  PRIMARY KEY (`id`),
  KEY `idx_wz_articles_category_id` (`category_id`),
  KEY `idx_wz_articles_author_id` (`author_id`),
  CONSTRAINT `fk_wz_articles_author` FOREIGN KEY (`author_id`) REFERENCES `wz_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_wz_articles_category` FOREIGN KEY (`category_id`) REFERENCES `wz_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_article_tags
-- ----------------------------
CREATE TABLE `wz_article_tags` (
  `article_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`article_id`,`tag_id`),
  KEY `idx_wz_article_tags_tag_id` (`tag_id`),
  CONSTRAINT `fk_wz_article_tags_article` FOREIGN KEY (`article_id`) REFERENCES `wz_articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_wz_article_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `wz_tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_comments
-- ----------------------------
CREATE TABLE `wz_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `article_id` int NOT NULL,
  `user_id` int DEFAULT NULL COMMENT '可空',
  `parent_id` int DEFAULT NULL COMMENT '楼中楼',
  `content` text NOT NULL,
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '1=已发布，0=待审核，2=屏蔽',
  `like_count` int NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wz_comments_article_id` (`article_id`),
  KEY `idx_wz_comments_user_id` (`user_id`),
  KEY `idx_wz_comments_parent_id` (`parent_id`),
  CONSTRAINT `fk_wz_comments_article` FOREIGN KEY (`article_id`) REFERENCES `wz_articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_wz_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `wz_comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_wz_comments_user` FOREIGN KEY (`user_id`) REFERENCES `wz_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_article_likes
-- ----------------------------
CREATE TABLE `wz_article_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `article_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wz_article_user` (`article_id`,`user_id`),
  KEY `fk_wz_likes_user` (`user_id`),
  CONSTRAINT `fk_wz_likes_article` FOREIGN KEY (`article_id`) REFERENCES `wz_articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_wz_likes_user` FOREIGN KEY (`user_id`) REFERENCES `wz_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_article_favorites
-- ----------------------------
CREATE TABLE `wz_article_favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `article_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wz_fav_article_user` (`article_id`,`user_id`),
  KEY `fk_wz_fav_user` (`user_id`),
  CONSTRAINT `fk_wz_fav_article` FOREIGN KEY (`article_id`) REFERENCES `wz_articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_wz_fav_user` FOREIGN KEY (`user_id`) REFERENCES `wz_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_messages
-- ----------------------------
CREATE TABLE `wz_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL COMMENT '可空',
  `name` varchar(255) DEFAULT '匿名',
  `content` text NOT NULL,
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '1=已发布，0=待审核，2=屏蔽',
  `value` int NOT NULL DEFAULT 25,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wz_messages_user_id` (`user_id`),
  CONSTRAINT `fk_wz_messages_user` FOREIGN KEY (`user_id`) REFERENCES `wz_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_otherswitch
-- ----------------------------
CREATE TABLE `wz_otherswitch` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT '配置 key',
  `content` text,
  `value` int DEFAULT 0,
  `deleted` int NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_friendslink
-- ----------------------------
CREATE TABLE `wz_friendslink` (
  `link_id` int NOT NULL AUTO_INCREMENT,
  `blog_name` varchar(255) NOT NULL,
  `blog_url` varchar(255) NOT NULL,
  `blog_theme` varchar(255) DEFAULT NULL,
  `blogger_name` varchar(255) DEFAULT NULL,
  `contact_info` varchar(255) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `sort_order` int DEFAULT 1,
  PRIMARY KEY (`link_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_swiper
-- ----------------------------
CREATE TABLE `wz_swiper` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_url` varchar(255) NOT NULL COMMENT '轮播图地址',
  `link_url` varchar(255) DEFAULT NULL COMMENT '跳转链接',
  `title` varchar(100) DEFAULT NULL COMMENT '标题',
  `sort_order` int NOT NULL DEFAULT 1 COMMENT '排序',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '1=展示，0=隐藏',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_points_goods
-- ----------------------------
CREATE TABLE `wz_points_goods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '商品/称号名称',
  `type` enum('physical','title') NOT NULL DEFAULT 'physical' COMMENT 'physical=实物，title=称号',
  `description` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `points_cost` int NOT NULL COMMENT '所需积分',
  `stock` int DEFAULT NULL COMMENT '库存，NULL=不限',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '1=上架，0=下架',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_points_orders
-- ----------------------------
CREATE TABLE `wz_points_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '兑换人',
  `goods_id` int NOT NULL COMMENT '商品',
  `quantity` int NOT NULL DEFAULT 1,
  `points_cost` int NOT NULL COMMENT '单件积分快照',
  `total_points` int NOT NULL COMMENT '本次消耗积分',
  `status` enum('pending','approved','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
  `receiver_name` varchar(50) DEFAULT NULL,
  `receiver_phone` varchar(50) DEFAULT NULL,
  `receiver_address` varchar(255) DEFAULT NULL,
  `logistics_company` varchar(100) DEFAULT NULL,
  `logistics_no` varchar(100) DEFAULT NULL,
  `user_remark` varchar(255) DEFAULT NULL,
  `admin_remark` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wz_points_orders_user_id` (`user_id`),
  KEY `idx_wz_points_orders_goods_id` (`goods_id`),
  CONSTRAINT `fk_wz_points_orders_goods` FOREIGN KEY (`goods_id`) REFERENCES `wz_points_goods` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_wz_points_orders_user` FOREIGN KEY (`user_id`) REFERENCES `wz_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: wz_user_points_log
-- ----------------------------
CREATE TABLE `wz_user_points_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `change` int NOT NULL COMMENT '积分变化',
  `reason` varchar(255) NOT NULL COMMENT 'daily_login/comment/redeem_goods/admin_adjust',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wz_points_user_id` (`user_id`),
  CONSTRAINT `fk_wz_points_user` FOREIGN KEY (`user_id`) REFERENCES `wz_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
