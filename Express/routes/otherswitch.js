const express = require('express');
const router = express.Router();
const otherswitchController = require('../controllers/otherswitchController');

router.get('/', otherswitchController.getAllOtherswitch);
router.post('/token/', otherswitchController.createOtherswitch);
router.put('/token/:id', otherswitchController.updateOtherswitch);
router.delete('/token/:id', otherswitchController.deleteOtherswitch);

module.exports = router;
