const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

// 获取标签列表
router.get('/', tagController.getAllTags);
// 新建标签
router.post('/token/', tagController.createTag);
// 更新标签
router.put('/token/:id', tagController.updateTag);
// 删除标签
router.delete('/token/:id', tagController.deleteTag);

module.exports = router;
