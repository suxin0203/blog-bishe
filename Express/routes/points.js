const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/pointsController');

// 商品
router.get('/goods', pointsController.getGoodsList);
router.get('/goods/:id', pointsController.getGoodsById);
router.post('/token/goods', pointsController.createGoods);
router.put('/token/goods/:id', pointsController.updateGoods);
router.delete('/token/goods/:id', pointsController.deleteGoods);

// 订单
router.get('/orders', pointsController.getOrderList);
router.get('/orders/:id', pointsController.getOrderById);
router.post('/orders', pointsController.createOrder);
router.put('/token/orders/:id', pointsController.updateOrderStatus);

// 积分流水
router.get('/log', pointsController.getPointsLog);

module.exports = router;
