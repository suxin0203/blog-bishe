const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.get('/', messageController.getAllMessages);
router.post('/', messageController.createMessage);
router.put('/token/:id', messageController.updateMessage);
router.delete('/token/:id', messageController.deleteMessage);

module.exports = router;
