const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// 获取分类列表
router.get('/', categoryController.getAllCategories);
// 新建分类
router.post('/token/', categoryController.createCategory);
// 更新分类
router.put('/token/:id', categoryController.updateCategory);
// 删除分类
router.delete('/token/:id', categoryController.deleteCategory);

module.exports = router;
