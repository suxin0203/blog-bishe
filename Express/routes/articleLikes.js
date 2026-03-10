const express = require('express');
const router = express.Router();
const articleLikeController = require('../controllers/articleLikeController');

router.post('/token/article/:articleId/toggle', articleLikeController.toggleLike);
router.get('/article/:articleId/check', articleLikeController.checkLiked);

module.exports = router;
