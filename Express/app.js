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

const app = express();

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

const secretKey = process.env.JWT_SECRET || 'suxin0203_Blog_mysql';

// 可选 Token：不带 /token 的请求若带 Authorization 则解析并写入 req.user，不强制登录
app.use((req, res, next) => {
  if (!req.url.includes('/token') && req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token) req.user = jwt.verify(token, secretKey);
    } catch (_) {}
  }
  next();
});

// 需登录的 /token 路由：校验 Token，仅 is_root=1（管理员）可访问后台
app.use((req, res, next) => {
  if (!req.url.includes('/token')) return next();
  if (!req.headers.authorization) {
    return res.status(401).json({ code: 401, message: 'Token不存在', data: null });
  }
  try {
    const token = req.headers.authorization.split(' ')[1];
    req.user = jwt.verify(token, secretKey);
    const isAdminOrEditor = req.user.is_root === 1 || req.user.role === 'editor';
    const isUserLike = req.user.role === 'user' && req.url.startsWith('/likes/token');
    const isUserFavorite = req.user.role === 'user' && req.url.startsWith('/favorites/token');
    const selfUserMatch = req.url.match(/^\/users\/token\/(\d+)$/);
    const isSelfUserUpdate = selfUserMatch && req.method === 'PUT' && Number(selfUserMatch[1]) === Number(req.user.id);
    if (!isAdminOrEditor && !isUserLike && !isUserFavorite && !isSelfUserUpdate) {
      return res.status(403).json({ code: 403, message: '当前角色无权限进行此操作', data: null });
    }
    if (req.user?.id) {
      userService.findById(req.user.id)
        .then((dbUser) => {
          if (!dbUser) {
            return res.status(401).json({ code: 401, message: '用户不存在', data: null });
          }
          if (Number(dbUser.status) === 1) {
            return res.status(403).json({ code: 403, message: '账号已停用，请联系管理员', data: null });
          }
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
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: 'Token过期', data: null });
    }
    return res.status(401).json({ code: 401, message: 'Token校验失败', data: null });
  }
});


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/categories', categoryRouter);
app.use('/articles', articleRouter);
app.use('/tags', tagRouter);
app.use('/comments', commentRouter);
app.use('/likes', articleLikeRouter);
app.use('/favorites', articleFavoriteRouter);
app.use('/messages', messageRouter);
app.use('/otherswitch', otherswitchRouter);
app.use('/wechat', wechatloginRouter);
app.use('/qr-login', qrLoginRouter);
app.use('/miniapp', miniappQrLoginRouter);
app.use('/upload', uploadJPGRouter);
app.use('/friendslink', friendslinkRouter);
app.use('/swiper', swiperRouter);
app.use('/points', pointsRouter);
app.use('/dashboard', dashboardRouter);
app.use('/utils', utilsRouter);
app.use('/activity', ActivityRouter);


app.use(function (req, res, next) {
  next(createError(404));
});

// error handler：统一返回 JSON
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  const message = status === 404 ? '接口不存在' : (err.message || '服务器错误');
  res.status(status).json({ code: status, message, data: null });
});

console.log("Server running at http://localhost:8020/");

module.exports = app;
