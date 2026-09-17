// AI 向导控制器：POST /ai/chat/stream（SSE 流式，游客可用）
// 协议：首条 data 下发 sessionId，随后逐条 {delta}，异常发 {error}，结束发 [DONE]
const aiService = require('../services/aiService');
const aiConfig = require('../common/aiConfig');

// 简单 IP 限流：windowMs 内最多 max 次，超限返回 429
const hits = new Map();
function isLimited(ip) {
  const now = Date.now();
  const hit = hits.get(ip);
  if (!hit || hit.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + aiConfig.rateLimit.windowMs });
    return false;
  }
  hit.count += 1;
  return hit.count > aiConfig.rateLimit.max;
}

exports.chatStream = async (req, res) => {
  // 流式开始前的错误用统一 JSON 格式返回，前端按普通接口处理
  if (!aiConfig.apiKey) {
    return res.status(500).json({ code: 500, message: 'AI 服务未配置，请联系站长', data: null });
  }
  if (isLimited(req.ip)) {
    return res.status(429).json({ code: 429, message: '提问太频繁啦，请一分钟后再试', data: null });
  }
  const userMessage = String((req.body && req.body.message) || '').trim();
  if (!userMessage) {
    return res.status(400).json({ code: 400, message: '问题不能为空', data: null });
  }
  if (userMessage.length > aiConfig.maxMessageLength) {
    return res.status(400).json({ code: 400, message: `单次提问请控制在 ${aiConfig.maxMessageLength} 字以内`, data: null });
  }

  // 带有效 sessionId 则续聊（多轮记忆），否则新建会话
  const clientSessionId = req.body && req.body.sessionId;
  const sessionId = aiService.isValidSession(clientSessionId) ? clientSessionId : aiService.createSession();

  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    // 告诉 nginx 不要缓冲此响应，否则前端会"转圈很久后一次性收到全文"
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  send({ sessionId });

  // 用户提前关闭页面时中断对大模型的请求，节省额度
  // 注意：必须监听 res 的 close（连接断开）；req 的 close 在请求体读完时就会触发
  const controller = new AbortController();
  res.on('close', () => controller.abort());

  let reply = '';
  try {
    const messages = aiService.buildMessages(sessionId, userMessage);
    for await (const delta of aiService.chatStream(messages, { signal: controller.signal })) {
      if (controller.signal.aborted) break;
      reply += delta;
      send({ delta });
    }
    if (!controller.signal.aborted) {
      aiService.saveTurn(sessionId, userMessage, reply);
      res.write('data: [DONE]\n\n');
    }
  } catch (err) {
    if (!controller.signal.aborted) {
      console.error('[ai] 流式回答失败:', err.message);
      // 响应头已发出，不能再改状态码，只能以事件形式告知前端
      const friendly = err.status === 429
        ? 'AI 现在有点忙（免费模型限流），请一分钟后再试'
        : (reply ? '回答中断了，请重试' : 'AI 服务暂时不可用，请稍后再试');
      send({ error: friendly });
      res.write('data: [DONE]\n\n');
    }
  } finally {
    res.end();
  }
};
