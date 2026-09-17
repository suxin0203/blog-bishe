// AI 向导配置（方案一：纯提示词聊天向导，见 docs/AI向导-方案一设计计划.md）
// Key 在 Express/.env 的 ZHIPU_API_KEY 中配置，不要写进代码
require('dotenv').config();

module.exports = {
  // 智谱 BigModel 开放平台（https://open.bigmodel.cn），flash 系列模型免费
  apiKey: process.env.ZHIPU_API_KEY || '',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  // 免费模型实测（2026-09-18）：
  // - glm-4-flash-250414：直出模型，响应最快（~200ms），作默认；
  // - glm-4.7-flash：最新但免费档限流严重（1302 排队挂起）；
  // - glm-4.5-flash：推理模型，回答前先"思考"，聊天场景延迟高。
  // 限流按模型独立计数，被限时可切换这里的模型名
  model: 'glm-4-flash-250414',

  // 会话记忆：最多保留最近 maxHistory 条消息（约 5 轮对话），sessionTTL 毫秒无活动则过期
  maxHistory: 10,
  sessionTTL: 30 * 60 * 1000,

  // 单条提问长度上限
  maxMessageLength: 500,

  // 每 IP 限流：windowMs 内最多 max 次
  rateLimit: { windowMs: 60 * 1000, max: 10 },
};
