const express = require('express');
const router = express.Router();
const friendslinkController = require('../controllers/friendslinkController');

router.get('/', friendslinkController.getAllFriendsLinks);
router.post('/token/', friendslinkController.createFriendsLink);
router.put('/token/:link_id', friendslinkController.updateFriendsLink);
router.delete('/token/:link_id', friendslinkController.deleteFriendsLink);

module.exports = router;
