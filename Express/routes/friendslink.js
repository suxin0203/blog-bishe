const express = require('express');
const router = express.Router();
const friendslinkcontroller = require('../controllers/friendslink');

console.log('----------------');
/* GET categorys listing. */
router.get('/', friendslinkcontroller.getAllFriendsLinks);
router.post('/token/', friendslinkcontroller.createFriendsLink);
router.put('/token/:id', friendslinkcontroller.updateFriendsLink);
router.delete('/token/:id', friendslinkcontroller.deleteFriendsLink);
module.exports = router;
