// AI 向导控制器（二期：Tool Calling + 会话落库）
// POST /ai/chat/stream —— SSE 协议：{sessionId} → ({tool: 状态} / {delta})* → {error}? → [DONE]
// GET  /ai/history     —— 会话回放（刷新页面恢复对话用）
// 流式开始前的错误用统一 JSON 格式返回；开始后只能以事件形式告知
const crypto = require('crypto');
const { success, error } = require('../common/response');
const aiService = require('../services/aiService');
const aiTools = require('../services/aiTools');
const aiSessionService = require('../services/aiSessionService');
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

  // 会话：客户端带来的有效 sessionId 续聊（多轮记忆），否则新建；登录用户自动关联
  const clientSessionId = req.body && req.body.sessionId;
  const userId = req.user && Number(req.user.id) ? Number(req.user.id) : null;
  let sessionId;
  if (clientSessionId && (await aiSessionService.exists(clientSessionId))) {
    sessionId = clientSessionId;
    await aiSessionService.ensure(sessionId, userId);
  } else {
    sessionId = crypto.randomUUID();
    await aiSessionService.ensure(sessionId, userId);
  }

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
  const cancelState = { cancelled: false };
  res.on('close', () => {
    cancelState.cancelled = true;
    if (cancelState.cancel) cancelState.cancel();
  });

  let reply = '';
  const t0 = Date.now();
  try {
    const history = await aiSessionService.getMessages(sessionId, aiConfig.maxHistory);
    const messages = aiService.buildMessages(history, userMessage);
    await aiSessionService.append(sessionId, 'user', userMessage);

    // 工具循环：最多 MAX_TOOL_ROUNDS 轮，支持复合问题的链式查询
    // （例："有哪些 Vue 的文章？大概讲了什么？"→ 先 search_articles 搜索，再 get_article_detail 读内容）
    // 模型不再要工具时，其非流式回答即最终回答；达到轮数上限后流式收口
    const MAX_TOOL_ROUNDS = 2;
    let round = 0;
    // 工具调用守卫：涉及站点数据的问题若模型没调工具就想回答，强制打回重试一次
    // （防止模型在畸形/重复输入下跳过工具、凭空回答"没有找到某文章"）
    const SITE_DATA_INTENT = /(文章|分类|标签|推荐|热门|搜索|阅读量|点赞最多|讲了什么|有多少|多少篇|找.{0,8}(文章|内容))/;

    while (!cancelState.cancelled) {
      const assistantMsg = await aiService.chatWithTools(messages, aiTools.toolSchemas, { signal: cancelState });
      const toolCalls = Array.isArray(assistantMsg.tool_calls) ? assistantMsg.tool_calls : [];

      // 模型不再调用工具：非流式回答即最终回答，一次性下发（前端打字机匀速播放）
      if (!toolCalls.length) {
        if (round === 0 && SITE_DATA_INTENT.test(userMessage)) {
          // 守卫生效：打回并要求必须调用工具
          console.log('[ai] 守卫触发：涉站点数据但模型未调用工具，强制重试');
          messages.push(assistantMsg);
          messages.push({
            role: 'user',
            content: '这是涉及站点真实数据的问题，禁止凭记忆回答。请必须先调用工具查询后再回答。',
          });
          round += 1;
          continue;
        }
        reply = String(assistantMsg.content || '').trim() || '抱歉，我这次没能生成有效回答，请换个问法或稍后再试。';
        send({ delta: reply });
        break;
      }

      // 执行模型点名的全部工具，结果以 role:'tool' 消息回填
      messages.push(assistantMsg);
      for (const tc of toolCalls) {
        const name = (tc.function && tc.function.name) || 'unknown';
        let args = {};
        try {
          args = JSON.parse((tc.function && tc.function.arguments) || '{}');
        } catch (_) { /* 参数非法按空处理 */ }
        send({ tool: { name, brief: aiTools.describeTool(name) } });
        const result = await aiTools.executeTool(name, args);
        if (cancelState.cancelled) break;
        await aiSessionService.append(sessionId, 'tool', JSON.stringify(result), { toolName: name });
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result).slice(0, 6000),
        });
      }
      round += 1;
      if (round >= MAX_TOOL_ROUNDS || cancelState.cancelled) break;
    }

    // 流式收口：工具轮达到上限后，基于全部工具结果生成最终回答
    if (!reply && !cancelState.cancelled) {
      const finalMessages = [
        ...messages,
        {
          role: 'user',
          content: '请根据以上工具查询结果回答我最初的问题（包括其中每一个子问题）；引用文章时给出形如 https://wzblog.suxin23.cn/#/detail?id=文章id 的完整链接。',
        },
      ];
      for await (const delta of aiService.chatStream(finalMessages, { signal: cancelState })) {
        if (cancelState.cancelled) break;
        reply += delta;
        send({ delta });
      }
    }

    if (!reply && !cancelState.cancelled) {
      reply = '抱歉，我这次没能生成有效回答，请换个问法或稍后再试。';
      send({ delta: reply });
    }

    if (!cancelState.cancelled) {
      await aiSessionService.append(sessionId, 'assistant', reply, { costMs: Date.now() - t0 });
      res.write('data: [DONE]\n\n');
    }
  } catch (err) {
    if (!cancelState.cancelled) {
      console.error('[ai] 对话处理失败:', err.message);
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

// 会话回放：前端刷新后按 localStorage 里的 sessionId 拉取历史（仅 user/assistant，最近 20 条）
exports.history = async (req, res) => {
  try {
    const sessionId = String(req.query.sessionId || '').trim();
    if (!sessionId || !(await aiSessionService.exists(sessionId))) {
      return success(res, { sessionId: '', messages: [] });
    }
    const messages = await aiSessionService.getMessages(sessionId, 20);
    return success(res, { sessionId, messages });
  } catch (e) {
    console.error('[ai] 历史查询失败:', e.message);
    return error(res, '历史查询失败');
  }
};
