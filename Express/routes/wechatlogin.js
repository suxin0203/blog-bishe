const express = require('express');
const router = express.Router();
const wechatlogincontroller = require('../controllers/wechatlogin');

// 根据微信登录 code 换取 openid
router.get('/openid/:code', wechatlogincontroller.wxloginUser);
// 根据 openid 获取系统内用户信息
router.get('/userinfo/:openid', wechatlogincontroller.wxloginUserByOpenid);

module.exports = router;
