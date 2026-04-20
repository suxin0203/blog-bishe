const express = require('express');
const router = express.Router();
const swiperController = require('../controllers/swiperController');

// 获取轮播图列表
router.get('/', swiperController.getSwiperList);
// 新建轮播图
router.post('/token/', swiperController.createSwiper);
// 更新轮播图
router.put('/token/:id', swiperController.updateSwiper);
// 删除轮播图
router.delete('/token/:id', swiperController.deleteSwiper);

module.exports = router;
