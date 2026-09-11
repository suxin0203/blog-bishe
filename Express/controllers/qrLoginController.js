const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const runQuery = require('../common/utils');
const qrLoginSessionService = require('../services/qrLoginSessionService');
const wechatMiniService = require('../services/wechatMiniService');
const userService = require('../services/userService');
const { success, fail, error } = require('../common/response');

const secretKey = require('../common/jwt');

function now() {
  return new Date();
}

function isExpired(expiresAt) {
  if (!expiresAt) return false;
  const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return Date.now() > exp.getTime();
}

function pickSafeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  if (rest.created_at?.toLocaleString) rest.created_at = rest.created_at.toLocaleString();
  if (rest.updated_at?.toLocaleString) rest.updated_at = rest.updated_at.toLocaleString();
  if (rest.last_login_at?.toLocaleString) rest.last_login_at = rest.last_login_at.toLocaleString();
  return rest;
}

const CLIENT_CHANNELS = ['pc', 'h5', 'wechat-h5'];

/** IP 脱敏：IPv4 隐藏后两段，IPv6 只保留前三个组，其余截断 */
function maskIp(ip) {
  const s = String(ip || '').split(',')[0].trim();
  if (!s) return '';
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) {
    const parts = s.split('.');
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  if (s.includes(':')) {
    const groups = s.split(':').filter(Boolean);
    return groups.length > 3 ? `${groups.slice(0, 3).join(':')}:…` : s;
  }
  return s.length > 12 ? `${s.slice(0, 12)}…` : s;
}

/**
 * 从会话存储的真实 UA / 通道解析扫码来源端信息，供小程序确认页展示。
 * UA 关键字参考：微信内置浏览器含 MicroMessenger，小程序 webview 额外含 miniProgram，
 * 手机 UA 含 Mobile/Android/iPhone 等（https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webview.html）
 */
function describeClient(sess) {
  const ua = String(sess?.user_agent || '');
  const inWeChat = /MicroMessenger/i.test(ua);
  const inMiniProgram = /miniProgram/i.test(ua);
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);

  let os = '未知设备';
  if (/Windows/i.test(ua)) os = 'Windows 电脑';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac 电脑';
  else if (/Android/i.test(ua)) os = 'Android 手机';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS 设备';
  else if (isMobile) os = '移动设备';

  let browser = '浏览器';
  if (inMiniProgram) browser = '小程序内置浏览器';
  else if (inWeChat) browser = '微信内置浏览器';
  else if (/Edg\//i.test(ua)) browser = 'Edge 浏览器';
  else if (/QQBrowser/i.test(ua)) browser = 'QQ 浏览器';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome 浏览器';
  else if (/Firefox/i.test(ua)) browser = 'Firefox 浏览器';
  else if (/Safari/i.test(ua)) browser = 'Safari 浏览器';

  let channel = CLIENT_CHANNELS.includes(sess?.channel) ? sess.channel : 'pc';
  const channelLabel =
    channel === 'wechat-h5' ? '微信内网页' : channel === 'h5' ? '手机网页' : '电脑网页';

  return {
    channel,
    channel_label: channelLabel,
    device: `${os} · ${browser}`,
    os,
    browser,
    is_mobile: isMobile,
    is_wechat: inWeChat,
    ip: maskIp(sess?.client_ip),
  };
}

async function generateTokensForUser(user) {
  const token = jwt.sign(
    { id: user.id, username: user.username, is_root: user.is_root, role: user.role },
    secretKey,
    { expiresIn: '2h' }
  );
  const refreshToken = jwt.sign({ id: user.id, type: 'refresh' }, secretKey, {
    expiresIn: '7d',
  });
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await userService.update(user.id, {
    refresh_token: refreshToken,
    refresh_token_expires_at: refreshExpires,
  });
  const latest = await userService.findById(user.id);
  return {
    token,
    refreshToken,
    user: pickSafeUser(latest || user),
  };
}

exports.createSession = async (req, res) => {
  try {
    // 前端按真实环境上报通道：pc 电脑浏览器 / h5 手机浏览器 / wechat-h5 微信内网页
    const channel = CLIENT_CHANNELS.includes(req.body?.channel) ? req.body.channel : 'pc';
    // 前端可手动指定扫码打开的小程序版本（release/trial/develop），
    // service 内做白名单校验，非法值回退默认规则
    const envVersion = req.body?.env_version;
    const clientIp =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      null;
    const userAgent = req.headers['user-agent'] || null;
    const { sceneId, expiresAt } = await qrLoginSessionService.createSession({
      channel,
      clientIp,
      userAgent,
      ttlMinutes: 5,
    });
    const miniProgramCode = await wechatMiniService.getPcLoginMiniProgramCode(sceneId, envVersion);
    return success(
      res,
      {
        sceneId,
        expiresAt,
        miniProgramCode,
      },
      '创建扫码登录会话成功'
    );
  } catch (e) {
    console.error(e);
    const isProd = process.env.NODE_ENV === 'production';
    if (e.message && e.message.includes('微信小程序配置')) {
      return fail(
        res,
        '微信小程序配置缺失，请补充 WX_MINIAPP_APPID / WX_MINIAPP_SECRET 环境变量后重试',
        500
      );
    }
    // 非生产环境直接返回错误详情，便于排查“不同环境结果不同”的问题
    if (!isProd && e?.message) {
      return fail(res, `创建扫码登录会话失败：${e.message}`, 500);
    }
    return error(res, '创建扫码登录会话失败');
  }
};

exports.getSessionStatus = async (req, res) => {
  try {
    const sceneId = String(req.params.sceneId || '').trim();
    if (!sceneId) return fail(res, 'sceneId 不能为空');
    const sess = await qrLoginSessionService.findBySceneId(sceneId);
    if (!sess) return fail(res, '会话不存在或已被清理', 404);
    if (isExpired(sess.expires_at) && (sess.status === 'pending' || sess.status === 'confirmed')) {
      await qrLoginSessionService.updateSession(sceneId, { status: 'expired' });
      return res
        .status(200)
        .json({ code: 410, message: '二维码已过期，请刷新', data: { status: 'expired' } });
    }
    if (sess.status === 'pending') {
      return success(
        res,
        { status: 'pending', expiresAt: sess.expires_at },
        '等待扫码或确认'
      );
    }
    if (sess.status === 'expired') {
      return res
        .status(200)
        .json({ code: 410, message: '二维码已过期，请刷新', data: { status: 'expired' } });
    }
    if (sess.status === 'completed') {
      return success(res, { status: 'completed' }, '会话已完成，请刷新二维码');
    }
    if (sess.status === 'confirmed') {
      if (!sess.user_id) {
        return fail(res, '会话状态异常：未绑定用户', 500);
      }
      const user = await userService.findById(sess.user_id);
      if (!user) {
        await qrLoginSessionService.updateSession(sceneId, { status: 'expired' });
        return fail(res, '关联用户不存在，会话已失效', 404);
      }
      const { token, refreshToken, user: safeUser } = await generateTokensForUser(user);
      await qrLoginSessionService.updateSession(sceneId, {
        status: 'completed',
        bind_token: null,
        bind_token_expires_at: null,
        temp_openid: null,
      });
      return success(
        res,
        {
          status: 'confirmed',
          token,
          refreshToken,
          user: safeUser,
        },
        '扫码登录已确认'
      );
    }
    return fail(res, '未知会话状态', 500);
  } catch (e) {
    console.error(e);
    return error(res, '查询扫码会话失败');
  }
};

// 返回 PNG 二进制小程序码（用于解决部分 Android 微信/QQ WebView 不渲染 dataURL 的问题）
exports.getMiniProgramCodePng = async (req, res) => {
  try {
    const sceneId = String(req.params.sceneId || '').trim();
    if (!sceneId) return fail(res, 'sceneId 不能为空');
    // 版本参数随图请求传入：同一个扫码会话可重新取不同版本的码，无需重建会话
    const envVersion = req.query.env_version;
    const pngBuf = await wechatMiniService.getPcLoginMiniProgramCodeBuffer(sceneId, envVersion);
    res.setHeader('Content-Type', 'image/png');
    // 避免 Android WebView/代理缓存导致“刷新不出来”
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(200).send(pngBuf);
  } catch (e) {
    console.error(e);
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd && e?.message) {
      return fail(res, `获取小程序码失败：${e.message}`, 500);
    }
    return error(res, '获取小程序码失败');
  }
};

exports.miniappEntry = async (req, res) => {
  try {
    const sceneId = String(req.body.sceneId || '').trim();
    const code = String(req.body.code || '').trim();
    console.log('[miniappEntry] incoming', { sceneId, code });
    if (!sceneId || !code) return fail(res, 'sceneId 与 code 不能为空');
    const sess = await qrLoginSessionService.findBySceneId(sceneId);
    if (!sess) return fail(res, '会话不存在或已被清理', 404);
    if (isExpired(sess.expires_at) || sess.status === 'expired' || sess.status === 'completed') {
      return res
        .status(200)
        .json({ code: 410, message: '二维码已过期，请刷新PC页面重新扫码', data: { status: 'expired' } });
    }
    const sessionData = await wechatMiniService.code2Session(code);
    const openid = sessionData.openid;
    const users = await runQuery('SELECT * FROM wz_users WHERE openid = ?', [openid]);
    const user = users[0];
    if (user) {
      await qrLoginSessionService.updateSession(sceneId, {
        status: 'confirmed',
        user_id: user.id,
        temp_openid: null,
        bind_token: null,
        bind_token_expires_at: null,
      });
      return success(res, { action: 'login_ok', client: describeClient(sess) }, '已确认登录');
    }
    const bindToken = crypto.randomUUID();
    const bindExp = new Date(now().getTime() + 5 * 60 * 1000);
    await qrLoginSessionService.updateSession(sceneId, {
      temp_openid: openid,
      bind_token: bindToken,
      bind_token_expires_at: bindExp,
    });
    return success(
      res,
      {
        action: 'need_register_or_bind',
        bindToken,
        client: describeClient(sess),
      },
      '需要注册或绑定账号'
    );
  } catch (e) {
    console.error(e);
    if (e.code) {
      return fail(res, `微信接口错误：${e.message || 'jscode2session 失败'}`, 400);
    }
    return error(res, '处理小程序扫码入口失败');
  }
};

const DEFAULT_WX_NICKNAME = '微信授权用户001';
const DEFAULT_WX_AVATAR_URL = 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132';

exports.miniappRegisterAndConfirm = async (req, res) => {
  try {
    const sceneId = String(req.body.sceneId || '').trim();
    const bindToken = String(req.body.bindToken || '').trim();
    const usernameRaw = req.body.username != null ? String(req.body.username).trim() : '';
    const passwordRaw = req.body.password != null ? String(req.body.password) : '';
    const emailRaw = req.body.email != null ? String(req.body.email).trim() : '';
    if (!sceneId || !bindToken) return fail(res, 'sceneId 与 bindToken 不能为空');
    if (!usernameRaw || usernameRaw.length < 4) return fail(res, '用户名至少 4 个字符');
    if (!passwordRaw || String(passwordRaw).trim().length < 4) return fail(res, '密码至少 4 个字符');
    if (!emailRaw) return fail(res, '请填写邮箱');
    const emailStr = emailRaw.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) return fail(res, '邮箱格式不正确');
    const sess = await qrLoginSessionService.findBySceneId(sceneId);
    if (!sess || !sess.bind_token || sess.bind_token !== bindToken) {
      return fail(res, 'bindToken 无效或会话不存在', 410);
    }
    if (!sess.temp_openid) {
      return fail(res, '会话未保存 openid，请重新扫码', 410);
    }
    if (!sess.bind_token_expires_at || isExpired(sess.bind_token_expires_at)) {
      return fail(res, '当前操作已过期，请重新扫码', 410);
    }
    const openid = sess.temp_openid;
    const existed = await runQuery('SELECT id FROM wz_users WHERE openid = ?', [openid]);
    if (existed[0]) {
      return fail(res, '该微信已绑定其他账号，请刷新二维码重试', 409);
    }
    const existUser = await runQuery('SELECT id FROM wz_users WHERE username = ?', [usernameRaw]);
    if (existUser[0]) return fail(res, '该用户名已被注册');
    const existEmail = await runQuery('SELECT id FROM wz_users WHERE email = ?', [emailStr]);
    if (existEmail[0]) return fail(res, '该邮箱已被注册');
    const password = String(passwordRaw).trim();
    const hashed = await bcrypt.hash(password, 10);
    const nickname = DEFAULT_WX_NICKNAME;
    const avatarUrl = DEFAULT_WX_AVATAR_URL;
    await runQuery(
      'INSERT INTO wz_users (username, password, email, nickname, avatar_url, role, is_root, openid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [usernameRaw, hashed, emailStr, nickname, avatarUrl, 'user', 0, openid]
    );
    const idRows = await runQuery('SELECT LAST_INSERT_ID() AS id');
    const userId = idRows[0]?.id;
    if (!userId) return error(res, '创建用户失败');
    await qrLoginSessionService.updateSession(sceneId, {
      status: 'confirmed',
      user_id: userId,
    });
    return success(res, { status: 'confirmed' }, '注册并确认PC登录成功');
  } catch (e) {
    console.error(e);
    return error(res, '注册并确认PC登录失败');
  }
};

exports.miniappBindAndConfirm = async (req, res) => {
  try {
    const sceneId = String(req.body.sceneId || '').trim();
    const bindToken = String(req.body.bindToken || '').trim();
    const usernameRaw = req.body.username != null ? String(req.body.username) : '';
    const passwordRaw = req.body.password != null ? String(req.body.password) : '';
    if (!sceneId || !bindToken || !usernameRaw || !passwordRaw) {
      return fail(res, 'sceneId、bindToken、账号和密码均不能为空');
    }
    const sess = await qrLoginSessionService.findBySceneId(sceneId);
    if (!sess || !sess.bind_token || sess.bind_token !== bindToken) {
      return fail(res, 'bindToken 无效或会话不存在', 410);
    }
    if (!sess.temp_openid) {
      return fail(res, '会话未保存 openid，请重新扫码', 410);
    }
    if (!sess.bind_token_expires_at || isExpired(sess.bind_token_expires_at)) {
      return fail(res, '当前操作已过期，请重新扫码', 410);
    }
    const openid = sess.temp_openid;
    const existed = await runQuery('SELECT id FROM wz_users WHERE openid = ?', [openid]);
    if (existed[0]) {
      return fail(res, '该微信已绑定其他账号，请刷新二维码重试', 409);
    }
    const username = usernameRaw.trim();
    const password = passwordRaw.trim();
    const user = await userService.findByUsername(username);
    if (!user) return fail(res, '账号或密码错误');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return fail(res, '账号或密码错误');
    await userService.update(user.id, { openid });
    await qrLoginSessionService.updateSession(sceneId, {
      status: 'confirmed',
      user_id: user.id,
    });
    return success(res, { status: 'confirmed' }, '绑定账号并确认PC登录成功');
  } catch (e) {
    console.error(e);
    return error(res, '绑定账号并确认PC登录失败');
  }
};

