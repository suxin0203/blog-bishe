const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// 获取看板汇总统计数据
router.get('/token/stats', dashboardController.getStats);
// 获取文章排行数据
router.get('/token/article-rank', dashboardController.getArticleRank);
// 获取用户趋势数据
router.get('/token/user-trend', dashboardController.getUserTrend);
// 获取文章趋势数据
router.get('/token/article-trend', dashboardController.getArticleTrend);
// 获取流量来源统计
router.get('/token/traffic-source', dashboardController.getTrafficSource);

module.exports = router;
