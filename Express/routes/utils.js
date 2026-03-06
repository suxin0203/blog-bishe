const express = require('express');
const router = express.Router();
const utilsController = require('../controllers/utils');

// console.log('----------------');
/* GET utils.js listing. */
router.get('/', utilsController.getQRcode);
module.exports = router;
