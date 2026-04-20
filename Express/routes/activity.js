const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activity');

// 获取活动列表（后台）
router.get('/token/', ActivityController.getAllActivitys);
// 创建活动时间配置
router.post('/time', ActivityController.createActivity);
// 获取签到查询结果
router.get('/sign/select', ActivityController.createActivitySignSelect);
// 提交签到
router.post('/sign', ActivityController.createActivitySign);
// router.put('/token/:id', ActivityController.updateActivity);
// router.delete('/token/:id', ActivityController.deleteActivity);

module.exports = router;
