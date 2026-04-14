const express = require('express');
const router = express.Router();
const qrLoginController = require('../controllers/qrLoginController');

router.post('/session', qrLoginController.createSession);
router.get('/session/:sceneId', qrLoginController.getSessionStatus);

module.exports = router;

