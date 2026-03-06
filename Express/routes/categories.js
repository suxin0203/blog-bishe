const express = require('express');
const router = express.Router();
const categoriescontroller = require('../controllers/categories');


/* GET categorys listing. */
router.get('/', categoriescontroller.getAllCategories);
router.post('/token/', categoriescontroller.createCategory);
router.put('/token/:id', categoriescontroller.updateCategory);
router.delete('/token/:id', categoriescontroller.deleteCategory);
module.exports = router;
