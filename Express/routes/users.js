const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 获取登录验证码
router.get('/captcha', userController.getCaptcha);
// 获取当前登录用户信息
router.get('/me', userController.getCurrentUser);
// 获取用户列表（后台）
router.get('/token/', userController.getAllUsers);
// 获取指定用户详情
router.get('/token/:id', userController.getUserById);
// 更新指定用户信息
router.put('/token/:id', userController.updateUser);
// 删除或停用指定用户
router.delete('/token/:id', userController.deleteUser);
// 用户注册
router.post('/register', userController.registerUser);
// 用户登录
router.post('/login', userController.loginUser);
// 刷新 access token
router.post('/refresh', userController.refreshToken);
// 根据用户名获取脱敏邮箱
router.get('/forgot-email', userController.getForgotEmail);
// 找回密码时校验邮箱
router.post('/forgot-verify', userController.forgotVerify);
// 找回密码并重置新密码
router.post('/forgot-reset', userController.forgotReset);
// 修改当前用户密码
router.post('/token/updatePassword', userController.updatePassword);
// 管理员新增用户
router.post('/token/admin-add-user', userController.adminAddUser);

module.exports = router;
