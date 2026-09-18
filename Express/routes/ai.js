const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// AI 向导聊天（SSE 流式；游客可用，带 token 时 req.user 已由全局中间件解析）
router.post('/chat/stream', aiController.chatStream);
// 会话回放：按 sessionId 拉历史消息（前端刷新恢复对话）
router.get('/history', aiController.history);

module.exports = router;
