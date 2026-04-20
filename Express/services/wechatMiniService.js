const axios = require('axios');

let cachedAccessToken = null;
let cachedAccessTokenExp = 0;

function getConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const appId = process.env.WX_MINIAPP_APPID || (!isProd ? 'wx15276ccd959c150c' : '');
  const appSecret = process.env.WX_MINIAPP_SECRET || (!isProd ? 'e92d91ea4d286209050510806625dc9d' : '');
  const loginPage = process.env.WX_MINIAPP_PC_LOGIN_PAGE || 'pages/pc-qr-login/index';
  if (!appId || !appSecret) {
    throw new Error('缺少微信小程序配置：请在环境变量中设置 WX_MINIAPP_APPID 和 WX_MINIAPP_SECRET');
  }
  return { appId, appSecret, loginPage };
}

function formatAxiosError(e) {
  if (!e) return '';
  const parts = [];
  if (e.code) parts.push(`code=${e.code}`);
  if (e.message) parts.push(`message=${e.message}`);
  if (e.response) {
    parts.push(`status=${e.response.status}`);
    const ct = e.response.headers?.['content-type'] || '';
    let dataPreview = '';
    try {
      if (Buffer.isBuffer(e.response.data)) dataPreview = e.response.data.toString('utf8').slice(0, 300);
      else if (typeof e.response.data === 'string') dataPreview = e.response.data.slice(0, 300);
      else dataPreview = JSON.stringify(e.response.data || {}).slice(0, 300);
    } catch (_) {}
    if (dataPreview) parts.push(`resp(${ct}):${dataPreview}`);
  }
  return parts.length ? ` [${parts.join(' | ')}]` : '';
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessTokenExp - 60 > now) {
    return cachedAccessToken;
  }
  const { appId, appSecret } = getConfig();
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  let resp;
  try {
    resp = await axios.get(url, { timeout: 8000 });
  } catch (e) {
    throw new Error(`获取微信 access_token 请求失败${formatAxiosError(e)}`);
  }
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
  let resp;
  try {
    resp = await axios.get(url, { timeout: 8000 });
  } catch (e) {
    throw new Error(`调用 jscode2session 请求失败${formatAxiosError(e)}`);
  }
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
  const buf = await getPcLoginMiniProgramCodeBuffer(sceneId);
  const base64 = Buffer.from(buf, 'binary').toString('base64');
  return `data:image/png;base64,${base64}`;
}

async function getPcLoginMiniProgramCodeBuffer(sceneId) {
  const accessToken = await getAccessToken();
  const { loginPage } = getConfig();
  const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;
  const isProd = process.env.NODE_ENV === 'production';
  const payload = {
    scene: sceneId,
    check_path: false,
    width: 512,
    // 生产默认 release；开发默认 trial（体验版）
    env_version: process.env.WX_MINIAPP_ENV_VERSION || (isProd ? 'release' : 'trial'),
  };
  // 仅当显式配置了页面路径时才带上 page；否则使用小程序启动页
  if (loginPage) {
    payload.page = loginPage;
  }
  let resp;
  try {
    resp = await axios.post(url, payload, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
  } catch (e) {
    throw new Error(`获取小程序码请求失败${formatAxiosError(e)}`);
  }
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
  return Buffer.from(resp.data);
}

module.exports = {
  code2Session,
  getPcLoginMiniProgramCode,
  getPcLoginMiniProgramCodeBuffer,
};

