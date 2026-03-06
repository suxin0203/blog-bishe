const express = require('express');
const router = express.Router();
const articlescontroller = require('../controllers/articles.js');

/* GET Articles listing. */
router.get('/:id', articlescontroller.getArticleById);
router.get('/', articlescontroller.getArticles);
router.post('/token/', articlescontroller.createArticle);
router.put('/token/:id', articlescontroller.updateArticle);
router.delete('/token/:id', articlescontroller.deleteArticle);
module.exports = router;
