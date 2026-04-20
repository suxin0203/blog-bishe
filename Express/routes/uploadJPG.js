const express = require('express');
const router = express.Router();
const uploadJPGcontroller = require('../controllers/uploadJPG');

// 富文本编辑器上传图片
router.post('/token/rich_editor_upload', uploadJPGcontroller.richEditorUpload);
// 上传轮播图图片
router.post('/token/lbt_upload', uploadJPGcontroller.lbtUpload);
// 获取已上传图片列表
router.get('/imglist', uploadJPGcontroller.getImageList);
// 删除指定图片
router.delete('/token/delimg', uploadJPGcontroller.deleteImage);

module.exports = router;
