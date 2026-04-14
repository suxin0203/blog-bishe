const axios = require('axios');

let cachedAccessToken = null;
let cachedAccessTokenExp = 0;

function getConfig() {
  const appId = process.env.WX_MINIAPP_APPID || 'wx15276ccd959c150c';
  const appSecret = process.env.WX_MINIAPP_SECRET || 'e92d91ea4d286209050510806625dc9d';
  const loginPage = process.env.WX_MINIAPP_PC_LOGIN_PAGE || 'pages/pc-qr-login/index';
  if (!appId || !appSecret) {
    throw new Error('缺少微信小程序配置：请在环境变量中设置 WX_MINIAPP_APPID 和 WX_MINIAPP_SECRET');
  }
  return { appId, appSecret, loginPage };
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessTokenExp - 60 > now) {
    return cachedAccessToken;
  }
  const { appId, appSecret } = getConfig();
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const resp = await axios.get(url, { timeout: 8000 });
  if (!resp.data || !resp.data.access_token) {
    throw new Error(`获取微信 access_token 失败：${JSON.stringify(resp.data || {})}`);
  }
  cachedAccessToken = resp.data.access_token;
  cachedAccessTokenExp = now + (resp.data.expires_in || 7000);
  return cachedAccessToken;
}

async function code2Session(code) {
  const { appId, appSecret } = getConfig();
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${encodeURIComponent(
    code
  )}&grant_type=authorization_code`;
  const resp = await axios.get(url, { timeout: 8000 });
  const data = resp.data || {};
  if (data.errcode && data.errcode !== 0) {
    const msg = data.errmsg || '调用 jscode2session 失败';
    const err = new Error(msg);
    err.code = data.errcode;
    throw err;
  }
  if (!data.openid) {
    throw new Error('jscode2session 未返回 openid');
  }
  return data;
}

async function getPcLoginMiniProgramCode(sceneId) {
  const accessToken = await getAccessToken();
  const { loginPage } = getConfig();
  const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;
  const payload = {
    scene: sceneId,
    check_path: false,
    width: 512,
    // 调试阶段默认使用体验版，小程序端需上传体验版代码
    env_version: process.env.WX_MINIAPP_ENV_VERSION || 'trial',
  };
  // 仅当显式配置了页面路径时才带上 page；否则使用小程序启动页
  if (loginPage) {
    payload.page = loginPage;
  }
  const resp = await axios.post(url, payload, {
    responseType: 'arraybuffer',
    timeout: 10000,
  });
  const contentType = resp.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    const text = Buffer.from(resp.data).toString('utf8');
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = { raw: text };
    }
    throw new Error(`获取小程序码失败：${JSON.stringify(data)}`);
  }
  const base64 = Buffer.from(resp.data, 'binary').toString('base64');
  return `data:image/png;base64,${base64}`;
}

module.exports = {
  code2Session,
  getPcLoginMiniProgramCode,
};

