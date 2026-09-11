const runQuery = require('../common/utils');

function now() {
  return new Date();
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function generateSceneId() {
  // 32 位以内字符串，兼容微信小程序码 scene 限制
  const { randomUUID } = require('crypto');
  return randomUUID().replace(/-/g, '').slice(0, 32);
}

async function createSession({ channel = 'pc', clientIp = null, userAgent = null, ttlMinutes = 5 } = {}) {
  const createdAt = now();
  const expiresAt = addMinutes(createdAt, ttlMinutes);
  const sceneId = generateSceneId();

  // 截断 user_agent 到 255 字符以避免数据库字段溢出（安卓微信 UA 通常很长）
  const truncatedUserAgent = userAgent ? userAgent.substring(0, 255) : null;

  const insertSql = 'INSERT INTO wz_qr_login_sessions (scene_id, status, user_id, channel, temp_openid, bind_token, bind_token_expires_at, client_ip, user_agent, created_at, updated_at, expires_at) VALUES (?, ?, NULL, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?)';
  try {
    await runQuery(
      insertSql,
      [sceneId, 'pending', channel, clientIp, truncatedUserAgent, createdAt, createdAt, expiresAt]
    );
  } catch (e) {
    // 兜底：个别环境 user_agent 列长度不足或编码超长时，放弃 UA 也不能让二维码生成失败
    if (truncatedUserAgent && /Data too long|truncated|ER_DATA_TOO_LONG/i.test(String(e?.message))) {
      await runQuery(
        insertSql,
        [sceneId, 'pending', channel, clientIp, null, createdAt, createdAt, expiresAt]
      );
    } else {
      throw e;
    }
  }
  return { sceneId, expiresAt };
}

async function findBySceneId(sceneId) {
  const rows = await runQuery('SELECT * FROM wz_qr_login_sessions WHERE scene_id = ?', [sceneId]);
  return rows[0] || null;
}

async function updateSession(sceneId, fields) {
  const allow = [
    'status',
    'user_id',
    'temp_openid',
    'bind_token',
    'bind_token_expires_at',
    'expires_at',
  ];
  const set = [];
  const values = [];
  for (const [k, v] of Object.entries(fields || {})) {
    if (allow.includes(k)) {
      set.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (!set.length) return 0;
  set.push('updated_at = CURRENT_TIMESTAMP');
  values.push(sceneId);
  const result = await runQuery(
    `UPDATE wz_qr_login_sessions SET ${set.join(', ')} WHERE scene_id = ?`,
    values
  );
  return result.affectedRows ?? 0;
}

module.exports = {
  createSession,
  findBySceneId,
  updateSession,
};

