const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// 获取指定文章的评论列表
router.get('/article/:articleId', commentController.getCommentsByArticleId);
// 获取后台评论列表
router.get('/token/', commentController.getCommentList);
// 发表评论
router.post('/', commentController.createComment);
// 更新评论状态或内容
router.put('/token/:id', commentController.updateComment);
// 删除评论
router.delete('/token/:id', commentController.deleteComment);

module.exports = router;
