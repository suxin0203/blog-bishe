const express = require('express');
const router = express.Router();
const articleFavoriteController = require('../controllers/articleFavoriteController');

// 切换当前用户对指定文章的收藏状态
router.post('/token/article/:articleId/toggle', articleFavoriteController.toggleFavorite);
// 获取当前登录用户的收藏列表
router.get('/token/list', articleFavoriteController.getMyFavorites);
// 检查当前用户是否已收藏指定文章
router.get('/article/:articleId/check', articleFavoriteController.checkFavorited);

module.exports = router;
