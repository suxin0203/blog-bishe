const express = require('express');
const router = express.Router();
const qrLoginController = require('../controllers/qrLoginController');

// 小程序扫码后上报进入登录流程
router.post('/qr-login/entry', qrLoginController.miniappEntry);
// 小程序端注册并确认登录
router.post('/qr-login/register-and-confirm', qrLoginController.miniappRegisterAndConfirm);
// 小程序端绑定账号并确认登录
router.post('/qr-login/bind-and-confirm', qrLoginController.miniappBindAndConfirm);

module.exports = router;
