const express = require('express');
const router = express.Router();
const otherswitchcontroller = require('../controllers/otherswitch');


/* GET categorys listing. */
router.get('/', otherswitchcontroller.getAllOtherswitch);
router.post('/token/', otherswitchcontroller.createOtherswitch);
router.put('/token/:id', otherswitchcontroller.updateOtherswitch);
router.delete('/token/:id', otherswitchcontroller.deleteOtherswitch);
module.exports = router;
