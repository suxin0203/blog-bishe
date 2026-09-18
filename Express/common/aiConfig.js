// AI 向导配置（二期：Tool Calling + 会话落库，见 docs/AI向导-方案一设计计划.md）
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
  // 站点对外地址：工具结果里的文章路径由系统提示词引导模型拼成完整链接
  siteUrl: process.env.SITE_URL || 'https://wzblog.suxin23.cn',

  // 会话记忆：每次请求取数据库中最近 maxHistory 条消息作为上下文
  maxHistory: 10,

  // 单条提问长度上限
  maxMessageLength: 500,

  // 每 IP 限流：windowMs 内最多 max 次
  rateLimit: { windowMs: 60 * 1000, max: 10 },
};
