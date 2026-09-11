const runQuery = require('../common/utils');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pointsService = require('../services/pointsService');
const userService = require('../services/userService');

const secretKey = require('../common/jwt');
const POINTS_DAILY_LOGIN = 5;

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

async function grantDailyLoginPoints(user_id) {
  try {
    const hadToday = await pointsService.hasPointsLogToday(user_id, 'daily_login');
    if (!hadToday) {
      await pointsService.addPointsLog(user_id, POINTS_DAILY_LOGIN, 'daily_login');
    }
  } catch (error) {
    console.error('points daily_login', error);
  }
}

// 微信登录获取openid
exports.wxloginUser = async (req, res) => {
  try {
    const code = req.params.code;
    const appId = 'wx15276ccd959c150c';
    const appSecret = 'e92d91ea4d286209050510806625dc9d';
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
    const result = await axios.get(url);
    if (result.data.errcode) {
      return res.status(200).json({ code: 0, message: '微信登录失败', errcode: result.data.errcode, errmsg: result.data.errmsg });
    }
    return res.json({
      message: '获取openid成功',
      data: result.data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: '操作错误' });
  }
};

// 微信登录根据openid获取用户信息
exports.wxloginUserByOpenid = async (req, res) => {
  try {
    const openid = req.params.openid;
    const users = await runQuery('SELECT * FROM wz_users WHERE openid = ?', [openid]);

    if (users.length === 0) {
      return res.status(200).json({ code: 0, message: '用户不存在' });
    }

    const user = users[0];
    await userService.updateLastLogin(user.id);
    await grantDailyLoginPoints(user.id);

    const latestUsers = await runQuery('SELECT * FROM wz_users WHERE id = ?', [user.id]);
    const latestUser = sanitizeUser(latestUsers[0] || user);
    const token = jwt.sign(
      { id: latestUser.id, username: latestUser.username, is_root: latestUser.is_root, role: latestUser.role },
      secretKey,
      { expiresIn: '10h' }
    );

    return res.json({
      code: 200,
      message: '登录成功',
      token,
      data: latestUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: '操作错误' });
  }
};
