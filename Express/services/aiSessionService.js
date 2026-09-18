// AI 向导会话持久化（wz_ai_sessions / wz_ai_messages，见 sql/migrations/03-ai-session-stats.sql）
const crypto = require('crypto');
const runQuery = require('../common/utils');

function newId() {
  return crypto.randomUUID();
}

// 会话是否已存在（客户端带来的 sessionId 有效性判断）
async function exists(sessionId) {
  if (!sessionId) return false;
  const rows = await runQuery('SELECT id FROM wz_ai_sessions WHERE id = ?', [sessionId]);
  return rows.length > 0;
}

// 确保会话存在：不存在则创建；已有会话且传入 userId 时补关联（游客登录后继续聊）
async function ensure(sessionId, userId) {
  if (!(await exists(sessionId))) {
    await runQuery(
      'INSERT INTO wz_ai_sessions (id, user_id, channel) VALUES (?, ?, ?)',
      [sessionId, userId || null, 'web'],
    );
  } else if (userId) {
    await runQuery(
      'UPDATE wz_ai_sessions SET user_id = ? WHERE id = ? AND user_id IS NULL',
      [userId, sessionId],
    );
  }
  return sessionId;
}

// 取会话历史（仅 user/assistant，供大模型上下文与前端回放），按时间正序返回
async function getMessages(sessionId, limit = 10) {
  const rows = await runQuery(
    `SELECT role, content FROM wz_ai_messages
     WHERE session_id = ? AND role IN ('user', 'assistant')
     ORDER BY id DESC LIMIT ?`,
    [sessionId, Number(limit)],
  );
  return rows.reverse();
}

// 追加一条消息并累加会话计数；extra: { toolName, costMs }
async function append(sessionId, role, content, extra = {}) {
  await runQuery(
    'INSERT INTO wz_ai_messages (session_id, role, content, tool_name, cost_ms) VALUES (?, ?, ?, ?, ?)',
    [sessionId, role, String(content), extra.toolName || null, extra.costMs || null],
  );
  await runQuery(
    'UPDATE wz_ai_sessions SET message_count = message_count + 1 WHERE id = ?',
    [sessionId],
  );
}

module.exports = { newId, exists, ensure, getMessages, append };
