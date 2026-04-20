const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// 获取后台文章列表（需登录；编辑仅看自己，管理员看全部）
router.get('/token/list', articleController.getArticles);
// 获取文章排行榜
router.get('/top', articleController.getTopArticles);
// 获取文章归档数据
router.get('/archive', articleController.getArchive);
// 获取前台文章列表
router.get('/', articleController.getArticles);
// 获取单篇文章详情
router.get('/:id', articleController.getArticleById);
// 新建文章
router.post('/token/', articleController.createArticle);
// 更新文章
router.put('/token/:id', articleController.updateArticle);
// 删除文章（支持软删除/硬删除）
router.delete('/token/:id', articleController.deleteArticle);
// 恢复回收站中的文章
router.put('/token/:id/restore', articleController.restoreArticle);
// 增加文章阅读量
router.post('/:id/view', articleController.incrementViewCount);

module.exports = router;
