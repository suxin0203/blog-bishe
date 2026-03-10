const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getAllCategories);
router.post('/token/', categoryController.createCategory);
router.put('/token/:id', categoryController.updateCategory);
router.delete('/token/:id', categoryController.deleteCategory);

module.exports = router;
