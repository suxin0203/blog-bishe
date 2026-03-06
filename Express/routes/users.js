const express = require('express');
const router = express.Router();
const usercontroller = require('../controllers/user');


/* GET users listing. */
router.get('/token/:id', usercontroller.getUserById);
router.get('/token/', usercontroller.getAllUsers);
router.put('/token/:id', usercontroller.updateUser);
router.delete('/token/:id', usercontroller.deleteUser);
router.post('/register', usercontroller.registerUser);
router.post('/login', usercontroller.loginUser);
router.post('/token/updatePassword', usercontroller.updatePassword);
module.exports = router;
