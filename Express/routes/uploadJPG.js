const express = require('express');
const router = express.Router();
const uploadJPGcontroller = require('../controllers/uploadJPG');


// 富文本编辑器上传
router.post('/token/rich_editor_upload', uploadJPGcontroller.richEditorUpload);

// 轮播图上传
router.post('/token/lbt_upload', uploadJPGcontroller.lbtUpload);

// 获取图片列表
router.get('/imglist', uploadJPGcontroller.getImageList);

// 删除图片
router.delete('/token/delimg', uploadJPGcontroller.deleteImage);

module.exports = router;