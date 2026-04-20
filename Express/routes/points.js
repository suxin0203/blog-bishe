const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/pointsController');

// 商品：获取积分商品列表
router.get('/goods', pointsController.getGoodsList);
// 商品：获取单个积分商品详情
router.get('/goods/:id', pointsController.getGoodsById);
// 商品：新建积分商品
router.post('/token/goods', pointsController.createGoods);
// 商品：更新积分商品
router.put('/token/goods/:id', pointsController.updateGoods);
// 商品：删除积分商品
router.delete('/token/goods/:id', pointsController.deleteGoods);

// 订单：获取积分订单列表
router.get('/orders', pointsController.getOrderList);
// 订单：获取单个积分订单详情
router.get('/orders/:id', pointsController.getOrderById);
// 订单：创建积分订单
router.post('/orders', pointsController.createOrder);
// 订单：更新订单状态
router.put('/token/orders/:id', pointsController.updateOrderStatus);

// 积分流水：获取积分变动记录
router.get('/token/log', pointsController.getPointsLog);

module.exports = router;
