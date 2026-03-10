const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const pointsService = require('../services/pointsService');
const { success, fail, error } = require('../common/response');

const POINTS_DAILY_LOGIN = 5;
const CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 分钟
const captchaStore = new Map();

const secretKey = process.env.JWT_SECRET || 'suxin0203_Blog_mysql';
const saltRounds = 10;

/** 账号/密码统一校验：不能为空，长度大于等于 4 即可 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') return '账号不能为空';
  const s = username.trim();
  if (s.length < 4) return '账号至少 4 个字符';
  return null;
}

function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') return '密码不能为空';
  const p = password.trim();
  if (p.length < 4) return '密码至少 4 个字符';
  return null;
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

function formatUser(u) {
  if (!u) return null;
  u.created_at = u.created_at?.toLocaleString?.() ?? u.created_at;
  u.updated_at = u.updated_at?.toLocaleString?.() ?? u.updated_at;
  u.last_login_at = u.last_login_at?.toLocaleString?.() ?? u.last_login_at;
  return sanitizeUser(u);
}

/** 前端传参为 Base64 时解码，否则返回原值（兼容） */
function decodePassword(str) {
  if (str == null || typeof str !== 'string') return str;
  try {
    const decoded = Buffer.from(str, 'base64').toString('utf8');
    if (decoded && /[\x20-\x7e\u4e00-\u9fa5]/.test(decoded)) return decoded;
  } catch (_) {}
  return str;
}

/** 清理过期的验证码 */
function pruneCaptchaStore() {
  const now = Date.now();
  for (const [id, entry] of captchaStore.entries()) {
    if (entry.exp < now) captchaStore.delete(id);
  }
}

/** 校验验证码（前端传 MD5 哈希）并一次性删除，返回 null 表示通过，否则返回错误信息 */
function validateAndConsumeCaptcha(captchaId, captchaAnswerHash) {
  if (!captchaId || captchaAnswerHash === undefined || captchaAnswerHash === null) return '验证码不能为空';
  const entry = captchaStore.get(String(captchaId).trim());
  captchaStore.delete(String(captchaId).trim());
  if (!entry) return '验证码已过期，请刷新';
  if (entry.exp < Date.now()) return '验证码已过期，请刷新';
  const expectedHash = crypto.createHash('md5').update(String(entry.answer)).digest('hex').toLowerCase();
  const receivedHash = String(captchaAnswerHash || '').trim().toLowerCase();
  if (receivedHash !== expectedHash) return '验证码错误';
  return null;
}

exports.getCaptcha = async (req, res) => {
  try {
    pruneCaptchaStore();
    const captchaId = crypto.randomUUID();
    const num1 = Math.floor(Math.random() * 20);
    const num2 = Math.floor(Math.random() * 20);
    const answer = num1 + num2;
    captchaStore.set(captchaId, { answer, exp: Date.now() + CAPTCHA_TTL_MS });
    return success(res, { captchaId, num1, num2 }, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user?.id) return fail(res, '请登录', 401);
    const user = await userService.findById(req.user.id);
    if (!user) return fail(res, '用户不存在', 404);
    return success(res, formatUser(user), 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const sort = req.query.sort === 'points' ? 'points' : undefined;
    const keyword = req.query.keyword;
    const list = await userService.findAll({ sort, keyword });
    list.forEach(formatUser);
    return success(res, list, '获取用户列表成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) return fail(res, '用户不存在', 404);
    return success(res, [formatUser(user)], '查询成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { nickname, avatar_url, email, status, role, title } = req.body;
    const id = Number(req.params.id);
    const isSelf = req.user && Number(req.user.id) === id;
    // 自己改自己：允许昵称、头像、邮箱、称号（如积分订单完成后自动写入）；不允许改角色/状态
    const payload = isSelf
      ? { nickname, avatar_url, email, title }
      : { nickname, avatar_url, email, status, role, title };
    const n = await userService.update(id, payload);
    if (!n) return fail(res, '更新失败或无变更');
    return success(res, { id }, '更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.user?.id)) return fail(res, '无法删除自己');
    const n = await userService.remove(req.params.id);
    if (!n) return fail(res, '用户不存在');
    return success(res, { id: req.params.id }, '删除成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.loginUser = async (req, res) => {
  try {
    const captchaErr = validateAndConsumeCaptcha(req.body.captchaId, req.body.captchaAnswer);
    if (captchaErr) return fail(res, captchaErr, 400);
    const username = req.body.username != null ? String(req.body.username).trim() : '';
    const password = decodePassword(req.body.password);
    if (!username) return fail(res, '用户名不能为空');
    const user = await userService.findByUsername(username);
    if (!user) return fail(res, '用户名或密码错误');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return fail(res, '用户名或密码错误');

    if (req.body.openid) {
      await userService.update(user.id, { openid: req.body.openid });
    }
    await userService.updateLastLogin(user.id);
    // 每日首次登录加分
    try {
      const hadToday = await pointsService.hasPointsLogToday(user.id, 'daily_login');
      if (!hadToday) {
        await pointsService.addPointsLog(user.id, POINTS_DAILY_LOGIN, 'daily_login');
      }
    } catch (e) {
      console.error('points daily_login', e);
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, is_root: user.is_root, role: user.role },
      secretKey,
      { expiresIn: '2h' }
    );
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      secretKey,
      { expiresIn: '7d' }
    );
    const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await userService.update(user.id, {
      refresh_token: refreshToken,
      refresh_token_expires_at: refreshExpires,
    });
    const data = formatUser(await userService.findById(user.id));
    return res.status(200).json({ code: 200, message: '登录成功', token, refreshToken, data });
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.registerUser = async (req, res) => {
  try {
    const captchaErr = validateAndConsumeCaptcha(req.body.captchaId, req.body.captchaAnswer);
    if (captchaErr) return fail(res, captchaErr, 400);
    const { username, email } = req.body;
    const password = decodePassword(req.body.password);
    if (!username || !password) return fail(res, '用户名或密码不能为空');
    const nameTrim = String(username).trim();
    const usernameErr = validateUsername(username);
    if (usernameErr) return fail(res, usernameErr);
    let emailStr = null;
    if (email != null && String(email).trim()) {
      emailStr = String(email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailStr)) return fail(res, '邮箱格式不正确');
      const existEmail = await userService.findByEmail(emailStr);
      if (existEmail) return fail(res, '该邮箱已被注册');
    }
    const pwErr = validatePasswordStrength(password);
    if (pwErr) return fail(res, pwErr);
    const exist = await userService.findByUsername(nameTrim);
    if (exist) return fail(res, '用户名已存在');
    const hashed = await bcrypt.hash(password.trim(), saltRounds);
    const nickname = req.body.nickname ? String(req.body.nickname).trim() : nameTrim;
    await userService.create({ username: nameTrim, password: hashed, email: emailStr, nickname, role: 'user' });
    return success(res, { username: nameTrim }, '注册成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

/** 管理员添加用户（无需验证码，可设置角色：仅 editor / user，不能设为 admin） */
exports.adminAddUser = async (req, res) => {
  try {
    if (req.user?.is_root !== 1) return fail(res, '仅管理员可添加用户', 403);
    const { username, email } = req.body;
    const password = decodePassword(req.body.password);
    if (!username || !password) return fail(res, '用户名或密码不能为空');
    const nameTrim = String(username).trim();
    const usernameErr = validateUsername(username);
    if (usernameErr) return fail(res, usernameErr);
    const pwErr = validatePasswordStrength(password);
    if (pwErr) return fail(res, pwErr);
    let role = (req.body.role && String(req.body.role).toLowerCase()) || 'user';
    if (role !== 'editor' && role !== 'user') role = 'user';
    let emailStr = null;
    if (email != null && String(email).trim()) {
      emailStr = String(email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailStr)) return fail(res, '邮箱格式不正确');
      const existEmail = await userService.findByEmail(emailStr);
      if (existEmail) return fail(res, '该邮箱已被注册');
    }
    const exist = await userService.findByUsername(nameTrim);
    if (exist) return fail(res, '用户名已存在');
    const hashed = await bcrypt.hash(password.trim(), saltRounds);
    const nickname = req.body.nickname ? String(req.body.nickname).trim() : nameTrim;
    await userService.create({ username: nameTrim, password: hashed, email: emailStr, nickname, role });
    return success(res, { username: nameTrim, role }, '添加成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

/** 使用 refreshToken 换取新的 access token（无感刷新） */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return fail(res, '缺少 refreshToken', 401);
    let payload;
    try {
      payload = jwt.verify(refreshToken, secretKey);
    } catch (_) {
      return fail(res, 'refreshToken 无效或已过期', 401);
    }
    if (payload.type !== 'refresh') return fail(res, '无效的 refreshToken', 401);
    const user = await userService.findById(payload.id);
    if (!user) return fail(res, '用户不存在', 401);
    if (user.refresh_token !== refreshToken) return fail(res, 'refreshToken 已失效', 401);
    const token = jwt.sign(
      { id: user.id, username: user.username, is_root: user.is_root, role: user.role },
      secretKey,
      { expiresIn: '2h' }
    );
    const data = formatUser(await userService.findById(user.id));
    return res.status(200).json({ code: 200, message: 'ok', token, data });
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.body;
    const oldPassword = decodePassword(req.body.oldPassword);
    const newPassword = decodePassword(req.body.newPassword);
    if (oldPassword === newPassword) return fail(res, '新密码不能与原密码相同');
    const pwErr = validatePasswordStrength(newPassword);
    if (pwErr) return fail(res, pwErr);
    const user = await userService.findById(id);
    if (!user) return fail(res, '用户不存在');
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return fail(res, '原密码错误');
    const hashed = await bcrypt.hash(newPassword, saltRounds);
    await userService.updatePassword(id, hashed);
    return success(res, null, '更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

/** 脱敏邮箱：前2字符 + *** + @前最后2字符 + @ + 域名 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const s = email.trim();
  const at = s.indexOf('@');
  if (at <= 0) return '***';
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (local.length <= 4) return local[0] + '***@' + domain;
  return local.slice(0, 2) + '***' + local.slice(-2) + '@' + domain;
}

/** 找回密码 - 根据用户名返回脱敏邮箱 */
exports.getForgotEmail = async (req, res) => {
  try {
    const username = (req.query.username || req.body?.username || '').trim();
    if (!username) return fail(res, '请输入用户名');
    const user = await userService.findByUsername(username);
    if (!user) return fail(res, '用户不存在');
    if (!user.email) return fail(res, '该账号未绑定邮箱，无法通过邮箱找回');
    return success(res, { maskEmail: maskEmail(user.email) }, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

/** 找回密码 - 验证完整邮箱，通过则返回重置用 resetToken（5 分钟有效）；当日错误超过 3 次拒绝 */
exports.forgotVerify = async (req, res) => {
  try {
    const { username, email } = req.body || {};
    const name = (username || '').trim();
    const emailStr = (email || '').trim().toLowerCase();
    if (!name || !emailStr) return fail(res, '请输入用户名和完整邮箱');
    const user = await userService.findByUsername(name);
    if (!user) return fail(res, '用户不存在');
    const today = new Date().toISOString().slice(0, 10);
    const attemptDate = user.reset_attempt_date ? String(user.reset_attempt_date).slice(0, 10) : '';
    const count = Number(user.reset_attempt_count) || 0;
    if (attemptDate === today && count >= 3) return fail(res, '今日验证次数已达上限，请明天再试', 400);
    const realEmail = (user.email || '').trim().toLowerCase();
    if (realEmail !== emailStr) {
      const newCount = attemptDate === today ? count + 1 : 1;
      await userService.update(user.id, {
        reset_attempt_count: newCount,
        reset_attempt_date: today,
      });
      return fail(res, '邮箱与注册信息不一致', 400);
    }
    const resetToken = jwt.sign(
      { id: user.id, type: 'forgot_reset' },
      secretKey,
      { expiresIn: '5m' }
    );
    return success(res, { resetToken }, '验证成功，请设置新密码');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

/** 找回密码 - 使用 resetToken 设置新密码 */
exports.forgotReset = async (req, res) => {
  try {
    const { resetToken } = req.body || {};
    const newPassword = decodePassword(req.body?.newPassword);
    if (!resetToken) return fail(res, '缺少重置凭证', 400);
    const pwErr = validatePasswordStrength(newPassword);
    if (pwErr) return fail(res, pwErr, 400);
    let payload;
    try {
      payload = jwt.verify(resetToken, secretKey);
    } catch (_) {
      return fail(res, '重置链接已过期，请重新验证邮箱', 401);
    }
    if (payload.type !== 'forgot_reset') return fail(res, '无效的重置凭证', 400);
    const user = await userService.findById(payload.id);
    if (!user) return fail(res, '用户不存在', 400);
    const hashed = await bcrypt.hash(newPassword, saltRounds);
    await userService.updatePassword(user.id, hashed);
    return success(res, null, '密码已重置，请使用新密码登录');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
