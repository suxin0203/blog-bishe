const express = require('express');
const router = express.Router();
const friendslinkController = require('../controllers/friendslinkController');

// 获取友情链接列表
router.get('/', friendslinkController.getAllFriendsLinks);
// 新建友情链接
router.post('/token/', friendslinkController.createFriendsLink);
// 更新友情链接
router.put('/token/:link_id', friendslinkController.updateFriendsLink);
// 删除友情链接
router.delete('/token/:link_id', friendslinkController.deleteFriendsLink);

module.exports = router;
