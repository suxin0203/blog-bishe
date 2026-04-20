const express = require('express');
const router = express.Router();
const qrLoginController = require('../controllers/qrLoginController');

// 创建 PC 端扫码登录会话
router.post('/session', qrLoginController.createSession);
// 查询扫码登录会话状态
router.get('/session/:sceneId', qrLoginController.getSessionStatus);
// 获取小程序码图片
router.get('/session/:sceneId/code.png', qrLoginController.getMiniProgramCodePng);

module.exports = router;
