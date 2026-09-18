-- ============================================================
-- 迁移脚本：AI 向导二期 · 会话与消息持久化表
-- 创建时间：2026-09-19
-- 关联文档：docs/AI向导-方案一设计计划.md（二期实施记录）
--
-- 执行环境：
--   开发库 wztest-ai：二期开发阶段立即执行；
--   正式库 wztest：AI 向导二期上线同步时执行
--   （CREATE TABLE IF NOT EXISTS，可重复执行）。
--
-- 说明：
--   user_id 不加外键约束——游客会话为 NULL，且删除用户不应级联删除其 AI 会话。
--   会话表本期刊不做物理清理，靠 updated_at 索引支持后续归档策略。
-- ============================================================

-- ---------- 1. AI 会话表 ----------
CREATE TABLE IF NOT EXISTS wz_ai_sessions (
  id VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '会话ID(UUID)',
  user_id INT NULL COMMENT '关联用户ID，游客为NULL',
  channel VARCHAR(20) NOT NULL DEFAULT 'web' COMMENT '来源端：web/miniapp',
  message_count INT NOT NULL DEFAULT 0 COMMENT '累计消息条数',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最近活跃时间',
  INDEX idx_user (user_id),
  INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI 向导会话';

-- ---------- 2. AI 消息表 ----------
CREATE TABLE IF NOT EXISTS wz_ai_messages (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
  session_id VARCHAR(64) NOT NULL COMMENT '所属会话ID',
  role ENUM('user','assistant','tool') NOT NULL COMMENT '消息角色',
  content MEDIUMTEXT NOT NULL COMMENT '消息内容（tool 角色存 JSON 结果）',
  tool_name VARCHAR(64) NULL COMMENT '工具消息对应的工具名',
  cost_ms INT NULL COMMENT '该轮耗时（毫秒）',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_session (session_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI 向导消息';
