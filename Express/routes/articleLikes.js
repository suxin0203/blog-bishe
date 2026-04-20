const express = require('express');
const router = express.Router();
const articleLikeController = require('../controllers/articleLikeController');

// 切换当前用户对指定文章的点赞状态
router.post('/token/article/:articleId/toggle', articleLikeController.toggleLike);
// 检查当前用户是否已点赞指定文章
router.get('/article/:articleId/check', articleLikeController.checkLiked);

module.exports = router;
