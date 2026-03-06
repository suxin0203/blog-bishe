const express = require('express');
const router = express.Router();
const messagescontroller = require('../controllers/messages');


/* GET categorys listing. */
router.get('/', messagescontroller.getAllMessages);
router.post('/', messagescontroller.createMessage);
router.put('/token/:id', messagescontroller.updateMessage);
router.delete('/token/:id', messagescontroller.deleteMessage);
module.exports = router;
