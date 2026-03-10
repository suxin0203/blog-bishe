const express = require('express');
const router = express.Router();
const articleFavoriteController = require('../controllers/articleFavoriteController');

router.post('/token/article/:articleId/toggle', articleFavoriteController.toggleFavorite);
router.get('/token/list', articleFavoriteController.getMyFavorites);
router.get('/article/:articleId/check', articleFavoriteController.checkFavorited);

module.exports = router;
