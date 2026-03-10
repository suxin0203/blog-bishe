const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/captcha', userController.getCaptcha);
router.get('/me', userController.getCurrentUser);
router.get('/token/', userController.getAllUsers);
router.get('/token/:id', userController.getUserById);
router.put('/token/:id', userController.updateUser);
router.delete('/token/:id', userController.deleteUser);
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/refresh', userController.refreshToken);
router.get('/forgot-email', userController.getForgotEmail);
router.post('/forgot-verify', userController.forgotVerify);
router.post('/forgot-reset', userController.forgotReset);
router.post('/token/updatePassword', userController.updatePassword);
router.post('/token/admin-add-user', userController.adminAddUser);

module.exports = router;
