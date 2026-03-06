const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activity');


/* GET categorys listing. */
router.get('/token/', ActivityController.getAllActivitys);
router.post('/time', ActivityController.createActivity);
// 签到
router.get('/sign/select', ActivityController.createActivitySignSelect);
router.post('/sign', ActivityController.createActivitySign);
// router.put('/token/:id', ActivityController.updateActivity);
// router.delete('/token/:id', ActivityController.deleteActivity);
module.exports = router;
