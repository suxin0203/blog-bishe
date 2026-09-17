const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const userService = require('./services/userService');
const cors = require('cors');
const multer = require('multer');
// 使用 multer 中间件处理文件上传
const update = multer({
  dest:"./public/upload/Filerelay/"
})





const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const categoryRouter = require('./routes/categories');
const articleRouter = require('./routes/articles');
const tagRouter = require('./routes/tags');
const commentRouter = require('./routes/comments');
const articleLikeRouter = require('./routes/articleLikes');
const articleFavoriteRouter = require('./routes/articleFavorites');
const messageRouter = require('./routes/messages');
const otherswitchRouter = require('./routes/otherswitch');
const wechatloginRouter = require('./routes/wechatlogin');
const qrLoginRouter = require('./routes/qrLogin');
const miniappQrLoginRouter = require('./routes/miniappQrLogin');
const uploadJPGRouter = require('./routes/uploadJPG');
const friendslinkRouter = require('./routes/friendslink');
const swiperRouter = require('./routes/swiper');
const pointsRouter = require('./routes/points');
const dashboardRouter = require('./routes/dashboard');
const utilsRouter = require('./routes/utils');
const ActivityRouter = require('./routes/activity');
const aiRouter = require('./routes/ai');

const app = express();
app.set('trust proxy', true);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 启用 CORS 中间件 并允许所有域名访问
app.use(cors());

// 时间戳防重放：请求头 X-Request-Time 为客户端时间戳（毫秒），与服务器时间差超过 30 秒则拒绝（仅当带该头时校验）
app.use((req, res, next) => {
  const clientTime = req.headers['x-request-time'];
  if (clientTime !== undefined && clientTime !== '') {
    const t = parseInt(String(clientTime), 10);
    const now = Date.now();
    if (Number.isNaN(t) || Math.abs(now - t) > 30000) {
      return res.status(200).json({ code: 400, message: '请求已过期或时间偏差过大，请同步系统时间后重试', data: null });
    }
  }
  next();
});

app.use(update.any())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Swagger API 文档（无需登录）
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '文栈博客 API 文档',
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

const secretKey = require('./common/jwt');

// 可选 Token 中间件：
// 1. 只要请求头里带了 Authorization，就尝试解析 JWT
// 2. 对不带 /token 的接口，不强制要求登录
// 3. 解析成功后把用户信息挂到 req.user，后续接口可按需使用
// 4. 如果 token 无效，这里直接忽略，不拦截请求
app.use((req, res, next) => {
  if (!req.url.includes('/token') && req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token) req.user = jwt.verify(token, secretKey);
    } catch (_) {}
  }
  next();
});

// 必须登录的 /token 路由鉴权中间件：
// 1. 只有路径中包含 /token 的接口才会进入这里
// 2. 先校验 Authorization 和 JWT 是否有效
// 3. 再根据角色判断是否有权限访问当前接口
// 4. 最后去数据库确认当前用户仍然存在且没有被停用
app.use((req, res, next) => {
  if (!req.url.includes('/token')) return next();
  if (!req.headers.authorization) {
    return res.status(401).json({ code: 401, message: 'Token不存在', data: null });
  }
  try {
    const token = req.headers.authorization.split(' ')[1];
    req.user = jwt.verify(token, secretKey);
    // 管理员或编辑默认可以访问后台接口
    const isAdminOrEditor = req.user.is_root === 1 || req.user.role === 'editor';
    // 普通用户只允许访问自己的点赞接口
    const isUserLike = req.user.role === 'user' && req.url.startsWith('/likes/token');
    // 普通用户只允许访问自己的收藏接口
    const isUserFavorite = req.user.role === 'user' && req.url.startsWith('/favorites/token');
    // 普通用户允许查看自己的积分流水
    const isUserPointsLog = req.user.role === 'user' && req.url.startsWith('/points/token/log');
    // 普通用户允许修改自己的用户资料
    const selfUserMatch = req.url.match(/^\/users\/token\/(\d+)$/);
    const isSelfUserUpdate = selfUserMatch && req.method === 'PUT' && Number(selfUserMatch[1]) === Number(req.user.id);
    if (!isAdminOrEditor && !isUserLike && !isUserFavorite && !isUserPointsLog && !isSelfUserUpdate) {
      return res.status(403).json({ code: 403, message: '当前角色无权限进行此操作', data: null });
    }
    if (req.user?.id) {
      // 再查一次数据库，避免 token 合法但用户已被删除或停用的情况
      userService.findById(req.user.id)
        .then((dbUser) => {
          if (!dbUser) {
            return res.status(401).json({ code: 401, message: '用户不存在', data: null });
          }
          if (Number(dbUser.status) === 0) {
            return res.status(403).json({ code: 403, message: '账号已停用，请联系管理员', data: null });
          }
          // 以数据库最新角色和状态为准，覆盖 token 中的旧信息
          req.user = {
            ...req.user,
            role: dbUser.role,
            is_root: dbUser.is_root,
            status: dbUser.status,
          };
          next();
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ code: 500, message: '服务器错误', data: null });
        });
      return;
    }
    next();
  } catch (err) {
    // token 过期和 token 非法分别返回不同提示
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: 'Token过期', data: null });
    }
    return res.status(401).json({ code: 401, message: 'Token校验失败', data: null });
  }
});

// 挂载首页路由
app.use('/', indexRouter);
// 挂载用户相关接口（登录、注册、用户管理）
app.use('/users', usersRouter);
// 挂载分类管理接口
app.use('/categories', categoryRouter);
// 挂载文章相关接口
app.use('/articles', articleRouter);
// 挂载标签管理接口
app.use('/tags', tagRouter);
// 挂载评论相关接口
app.use('/comments', commentRouter);
// 挂载文章点赞接口
app.use('/likes', articleLikeRouter);
// 挂载文章收藏接口
app.use('/favorites', articleFavoriteRouter);
// 挂载留言板接口
app.use('/messages', messageRouter);
// 挂载站点开关配置接口
app.use('/otherswitch', otherswitchRouter);
// 挂载微信登录相关接口
app.use('/wechat', wechatloginRouter);
// 挂载 PC 扫码登录接口
app.use('/qr-login', qrLoginRouter);
// 挂载小程序扫码确认登录接口
app.use('/miniapp', miniappQrLoginRouter);
// 挂载图片上传与图片管理接口
app.use('/upload', uploadJPGRouter);
// 挂载友情链接接口
app.use('/friendslink', friendslinkRouter);
// 挂载轮播图管理接口
app.use('/swiper', swiperRouter);
// 挂载积分商城接口（商品、订单、积分流水）
app.use('/points', pointsRouter);
// 挂载后台数据看板接口
app.use('/dashboard', dashboardRouter);
// 挂载工具类接口（如二维码生成）
app.use('/utils', utilsRouter);
// 挂载活动与签到接口
app.use('/activity', ActivityRouter);
// 挂载 AI 向导接口（SSE 流式聊天）
app.use('/ai', aiRouter);

// 404 处理中间件：当前面所有路由都没有匹配到时，主动创建一个 404 错误
app.use(function (req, res, next) {
  next(createError(404));
});

// 全局错误处理中间件：
// 1. 统一接收前面中间件或路由抛出的错误
// 2. 如果是 404，则返回“接口不存在”
// 3. 其他错误默认按服务器错误处理
// 4. 最终统一输出 JSON，便于前端统一处理
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  const message = status === 404 ? '接口不存在' : (err.message || '服务器错误');
  res.status(status).json({ code: status, message, data: null });
});

console.log("Server running at http://localhost:8021/");

module.exports = app;
