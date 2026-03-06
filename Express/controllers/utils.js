// const db = require('../common/pool');
const axios = require('axios');

exports.getQRcode = async (req, res, next) => {
  try {
    // 需要生成二维码的数据：scene里的参数 eventID、type、arearId和token
    const { eventID, type, arearId=1, token } = req.query;

    if (!eventID || !type || !arearId || !token) {
      let resErrorData = {
        code:201,
        message:'参数错误~'
      }
      res.json(resErrorData);
      return;
    }

    const data = {
      groupId: '317964',
      memberSystemId: '21',
      appId: 'wx2804355dbf8d15c3',
      // type= 3签到 4猜口令 11啦朋友 5抽奖 29 免费领 
      scene: `?type=${type}&arearId=${arearId}&eventID=${eventID}`,
      check_path: true,
      page: 'pages/allType/allType',
      is_hyaline: true
    };

    // 设置请求头
    const config = {
      method: 'post',
      url: 'https://chabaidao-gateway2.shuxinyc.com/hll-message/cmd/wechat/app/qrCode',
      headers: {
        'CSESSION': token,
        // 'versionCode': '33111',
        // 'versionName': '3.3.111',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      data: data
    };

    // 发送请求
    const response = await axios(config);
    
    // console.log('请求结果',response.data);

    resData = response.data

    if (resData.code === '000') {
      resData.code = 200;
      resData.status = 'success';
      resData.message = '不可以看人家里面哦~';
      resData.data = resData.data;
      res.json(resData);
    }else{
      let resErrorData = {
        code:201,
        message:resData.msg?resData.msg:(resData.error?resData.error:'异常啦~')
      }
      res.json(resErrorData);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};

