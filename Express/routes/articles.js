const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// 后台列表（需登录；编辑仅看自己，管理员看全部）
router.get('/token/list', articleController.getArticles);
router.get('/top', articleController.getTopArticles);
router.get('/archive', articleController.getArchive);
router.get('/', articleController.getArticles);
router.get('/:id', articleController.getArticleById);
router.post('/token/', articleController.createArticle);
router.put('/token/:id', articleController.updateArticle);
router.delete('/token/:id', articleController.deleteArticle);
router.put('/token/:id/restore', articleController.restoreArticle);
router.post('/:id/view', articleController.incrementViewCount);

module.exports = router;
