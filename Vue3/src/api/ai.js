// AI 向导流式聊天封装
// axios 不便逐块读取流式响应，这里直接用原生 fetch 解析 SSE；
// 事件协议见 controllers/aiController.js：{sessionId} → {delta}... → {error} → [DONE]
const BASE_URL = import.meta.env.VITE_BASE_URL || '';

/**
 * 发起一次流式对话
 * @param {Object}   options
 * @param {string}   options.message    用户提问
 * @param {string}  [options.sessionId] 多轮会话 ID（首问可不传）
 * @param {Function} options.onEvent    收到事件：{sessionId} / {delta} / {error}
 * @param {Function} [options.onDone]   流结束（正常或异常后都会调用）
 * @returns {{ abort: Function }} abort() 可中断本次请求（关闭面板时用）
 */
export function streamChat({ message, sessionId, onEvent, onDone }) {
  const controller = new AbortController();

  (async () => {
    let finished = false;
    const finish = () => { if (!finished) { finished = true; onDone && onDone(); } };

    try {
      const res = await fetch(`${BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId }),
        signal: controller.signal,
      });

      // 流式开始前的错误（限流/参数校验等）是普通 JSON 响应
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `请求失败（HTTP ${res.status}）`);
      }

      // 边缘兼容：部分安卓微信 X5 内核的响应没有 ReadableStream，无法逐块读取。
      // 降级为一次性读取全文再整体解析——前端打字机缓冲会让观感保持一致
      if (!res.body || typeof res.body.getReader !== 'function') {
        const full = await res.text();
        for (const line of full.split('\n')) {
          const payload = line.replace(/^data:\s*/, '').trim();
          if (!payload) continue;
          if (payload === '[DONE]') { finish(); return; }
          try {
            onEvent && onEvent(JSON.parse(payload));
          } catch (_) { /* 忽略无法解析的行 */ }
        }
        finish();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        // SSE 按行解析，不完整的行留在 buf 等下一个 chunk
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          const payload = line.replace(/^data:\s*/, '').trim();
          if (!payload) continue;
          if (payload === '[DONE]') { finish(); return; }
          try {
            const evt = JSON.parse(payload);
            if (evt.error) { /* 服务端友好错误提示，作为一条普通文本气泡展示 */ }
            onEvent && onEvent(evt);
          } catch (_) { /* 忽略无法解析的行 */ }
        }
      }
      finish();
    } catch (err) {
      if (err.name === 'AbortError') { finish(); return; }
      onEvent && onEvent({ error: err.message || '网络异常，请稍后再试' });
      finish();
    }
  })();

  return { abort: () => controller.abort() };
}

// 会话回放：按 sessionId 拉取历史消息（刷新页面后恢复对话）
// 返回 { sessionId, messages: [{role, content}] }；会话不存在时 sessionId 为空串
export async function fetchHistory(sessionId) {
  try {
    const res = await fetch(`${BASE_URL}/ai/history?sessionId=${encodeURIComponent(sessionId)}`);
    if (!res.ok) return { sessionId: '', messages: [] };
    const body = await res.json().catch(() => ({}));
    return body.data || { sessionId: '', messages: [] };
  } catch (_) {
    return { sessionId: '', messages: [] };
  }
}
