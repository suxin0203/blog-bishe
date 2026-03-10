const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/token/stats', dashboardController.getStats);
router.get('/token/article-rank', dashboardController.getArticleRank);
router.get('/token/user-trend', dashboardController.getUserTrend);
router.get('/token/article-trend', dashboardController.getArticleTrend);
router.get('/token/traffic-source', dashboardController.getTrafficSource);

module.exports = router;
