const express = require('express');
const router = express.Router();
const otherswitchController = require('../controllers/otherswitchController');

// 获取站点开关配置
router.get('/', otherswitchController.getAllOtherswitch);
// 新建站点开关配置
router.post('/token/', otherswitchController.createOtherswitch);
// 更新站点开关配置
router.put('/token/:id', otherswitchController.updateOtherswitch);
// 删除站点开关配置
router.delete('/token/:id', otherswitchController.deleteOtherswitch);

module.exports = router;
