const express = require('express');
const router = express.Router();
const swiperController = require('../controllers/swiperController');

router.get('/', swiperController.getSwiperList);
router.post('/token/', swiperController.createSwiper);
router.put('/token/:id', swiperController.updateSwiper);
router.delete('/token/:id', swiperController.deleteSwiper);

module.exports = router;
