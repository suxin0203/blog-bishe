const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

router.get('/', tagController.getAllTags);
router.post('/token/', tagController.createTag);
router.put('/token/:id', tagController.updateTag);
router.delete('/token/:id', tagController.deleteTag);

module.exports = router;
