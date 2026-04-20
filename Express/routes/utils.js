const express = require('express');
const router = express.Router();
const utilsController = require('../controllers/utils');

// 生成二维码工具接口
router.get('/', utilsController.getQRcode);

module.exports = router;
