const express = require('express');
const router = express.Router();
const qrLoginController = require('../controllers/qrLoginController');

router.post('/qr-login/entry', qrLoginController.miniappEntry);
router.post('/qr-login/register-and-confirm', qrLoginController.miniappRegisterAndConfirm);
router.post('/qr-login/bind-and-confirm', qrLoginController.miniappBindAndConfirm);

module.exports = router;

