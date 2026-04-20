const express = require('express');
const router = express.Router();

// 首页测试路由：渲染默认页面
router.get('/', function(req, res, next) {
  res.render('index', { title: '好像是异世界！？' });
});

module.exports = router;
