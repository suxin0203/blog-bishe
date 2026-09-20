// AI 向导会话持久化（wz_ai_sessions / wz_ai_messages，见 sql/migrations/03-ai-session-stats.sql）
const crypto = require('crypto');
const runQuery = require('../common/utils');
const { formatDateTime } = require('../common/utils');

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

// ---------- 管理端（仅超管，配合 /ai/token/* 路由） ----------

// 会话分页列表：含用户昵称与首问预览，keyword 匹配用户名/会话ID/消息内容
async function listSessions({ page = 1, pageSize = 10, keyword = '' } = {}) {
  const kw = `%${keyword}%`;
  const where = keyword
    ? `(COALESCE(u.nickname, u.username) LIKE ? OR s.id LIKE ? OR EXISTS (SELECT 1 FROM wz_ai_messages m2 WHERE m2.session_id = s.id AND m2.content LIKE ?))`
    : '1=1';
  const whereValues = keyword ? [kw, kw, kw] : [];
  const baseSql = `
    FROM wz_ai_sessions s
    LEFT JOIN wz_users u ON u.id = s.user_id
    WHERE ${where}`;
  const totalRows = await runQuery(`SELECT COUNT(*) AS total ${baseSql}`, whereValues);
  const rows = await runQuery(
    `SELECT s.id, s.user_id, s.channel, s.message_count, s.created_at, s.updated_at,
            COALESCE(u.nickname, u.username, '游客') AS user_name,
            (SELECT m.content FROM wz_ai_messages m WHERE m.session_id = s.id AND m.role = 'user' ORDER BY m.id ASC LIMIT 1) AS first_question
     ${baseSql}
     ORDER BY s.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...whereValues, Number(pageSize), (Number(page) - 1) * Number(pageSize)],
  );
  rows.forEach((r) => {
    r.created_at = formatDateTime(r.created_at);
    r.updated_at = formatDateTime(r.updated_at);
    r.first_question = r.first_question ? String(r.first_question).slice(0, 60) : '（无提问记录）';
  });
  return { list: rows, total: totalRows[0].total };
}

// 会话完整消息（含工具消息，供后台查看对话过程）
async function getAllMessages(sessionId) {
  const rows = await runQuery(
    'SELECT id, role, content, tool_name, cost_ms, created_at FROM wz_ai_messages WHERE session_id = ? ORDER BY id',
    [sessionId],
  );
  rows.forEach((r) => {
    r.created_at = formatDateTime(r.created_at);
  });
  return rows;
}

// 删除会话及其全部消息（事务保证不出现孤儿消息）
async function removeSession(sessionId) {
  const { withTransaction } = require('../common/utils');
  return withTransaction(async (query) => {
    await query('DELETE FROM wz_ai_messages WHERE session_id = ?', [sessionId]);
    const ret = await query('DELETE FROM wz_ai_sessions WHERE id = ?', [sessionId]);
    return ret.affectedRows;
  });
}

module.exports = { newId, exists, ensure, getMessages, append, listSessions, getAllMessages, removeSession };
