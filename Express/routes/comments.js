const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.get('/article/:articleId', commentController.getCommentsByArticleId);
router.get('/token/', commentController.getCommentList);
router.post('/', commentController.createComment);
router.put('/token/:id', commentController.updateComment);
router.delete('/token/:id', commentController.deleteComment);

module.exports = router;
