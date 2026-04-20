const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// 获取留言列表
router.get('/', messageController.getAllMessages);
// 提交留言
router.post('/', messageController.createMessage);
// 更新留言状态或内容
router.put('/token/:id', messageController.updateMessage);
// 删除留言
router.delete('/token/:id', messageController.deleteMessage);

module.exports = router;
