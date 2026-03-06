const express = require('express');
const router = express.Router();
const wechatlogincontroller = require('../controllers/wechatlogin');

/* GET Articles listing. */
router.get('/openid/:code', wechatlogincontroller.wxloginUser);
router.get('/userinfo/:openid', wechatlogincontroller.wxloginUserByOpenid);
module.exports = router;