const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const jwt = require('jsonwebtoken');
// 添加跨域模块
const cors = require('cors');
const multer = require('multer');
// 使用 multer 中间件处理文件上传
const update = multer({
  dest:"./public/upload/Filerelay/"
})





const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const categoryRouter = require('./routes/categories');
const acrticleRouter = require('./routes/articles');
const messageRouter = require('./routes/messages');
const otherswitchRouter = require('./routes/otherswitch');
const wechatloginRouter = require('./routes/wechatlogin');
const uploadJPGRouter = require('./routes/uploadJPG');
const friendslinkRouter = require('./routes/friendslink');
const utilsRouter = require('./routes/utils');
const ActivityRouter = require('./routes/activity');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 启用 CORS 中间件 并允许所有域名访问
app.use(cors());

app.use(update.any())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


const secretKey = 'suxin0203_Blog_mysql';

// 全局中间件，判断是否需要验证 Token
app.use((req, res, next) => {
  if (req.url.includes('/token')) {
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1]; // 获取token
        req.user = jwt.verify(token, secretKey); // 如果验证通过，在req中写入解密结果
        if (req.user.is_root === 1) {
          next(); // 如果有root权限，继续执行下一个中间件
        } else {
          res.json({ code: 403, message: '无权限进行此操作' });
        }
      } catch (error) {
        // 判断token是否过期
        if (error.name === 'TokenExpiredError') {
          res.json({ code: 401, message: 'Token过期，请重新登录' });
        } else {
          res.json({ code: 401, message: 'Token校验失败' });
        }
      }
    } else {
      res.json({ code: 401, message: 'Token不存在，请登录' });
    }
  } else {
    next(); // 如果不需要 Token 验证，直接继续执行下一个中间件或路由处理函数
  }
});


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/categories', categoryRouter);
app.use('/articles', acrticleRouter);
app.use('/messages', messageRouter);
app.use('/otherswitch', otherswitchRouter);
app.use('/wechat', wechatloginRouter);
app.use('/upload', uploadJPGRouter);
app.use('/friendslink', friendslinkRouter);
app.use('/utils', utilsRouter);
app.use('/activity', ActivityRouter);


app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

console.log("Server running at http://localhost:8020/");

module.exports = app;
