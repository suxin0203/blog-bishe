// API 接口封装
const { get, post, put, del } = require('../utils/request.js')

/**
 * 文章相关接口
 */
const article = {
  // 获取文章列表
  getList(params = {}) {
    return get('/articles', params)
  },

  // 获取热门文章
  getTop(params = {}) {
    return get('/articles/top', params)
  },

  // 获取文章归档
  getArchive(params = {}) {
    return get('/articles/archive', params)
  },

  // 获取文章详情
  getDetail(id) {
    return get(`/articles/${id}`)
  },

  // 增加阅读量
  addView(id) {
    return post(`/articles/${id}/view`)
  },

  // 后台文章列表
  getAdminList(params = {}) {
    return get('/articles/token/list', params, { needAuth: true })
  },

  // 创建文章
  create(data) {
    return post('/articles/token/', data, { needAuth: true })
  },

  // 更新文章
  update(id, data) {
    return put(`/articles/token/${id}`, data, { needAuth: true })
  },

  // 删除文章
  delete(id) {
    return del(`/articles/token/${id}`, {}, { needAuth: true })
  },

  // 恢复文章
  restore(id) {
    return put(`/articles/token/${id}/restore`, {}, { needAuth: true })
  }
}

/**
 * 分类相关接口
 */
const category = {
  // 获取分类列表
  getList() {
    return get('/categories')
  },

  // 创建分类
  create(data) {
    return post('/categories/token/', data, { needAuth: true })
  },

  // 更新分类
  update(id, data) {
    return put(`/categories/token/${id}`, data, { needAuth: true })
  },

  // 删除分类
  delete(id) {
    return del(`/categories/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * 标签相关接口
 */
const tag = {
  // 获取标签列表
  getList() {
    return get('/tags')
  },

  // 创建标签
  create(data) {
    return post('/tags/token/', data, { needAuth: true })
  },

  // 更新标签
  update(id, data) {
    return put(`/tags/token/${id}`, data, { needAuth: true })
  },

  // 删除标签
  delete(id) {
    return del(`/tags/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * 轮播图相关接口
 */
const swiper = {
  // 获取轮播图列表
  getList() {
    return get('/swiper')
  },

  // 创建轮播图
  create(data) {
    return post('/swiper/token/', data, { needAuth: true })
  },

  // 更新轮播图
  update(id, data) {
    return put(`/swiper/token/${id}`, data, { needAuth: true })
  },

  // 删除轮播图
  delete(id) {
    return del(`/swiper/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * 评论相关接口
 */
const comment = {
  // 获取文章评论
  getByArticle(articleId, params = {}) {
    return get(`/comments/article/${articleId}`, params)
  },

  // 发表评论
  create(data) {
    return post('/comments', data, { needAuth: true })
  },

  // 后台评论列表
  getAdminList(params = {}) {
    return get('/comments/token/', params, { needAuth: true })
  },

  // 更新评论
  update(id, data) {
    return put(`/comments/token/${id}`, data, { needAuth: true })
  },

  // 删除评论
  delete(id) {
    return del(`/comments/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * 点赞相关接口
 */
const like = {
  // 点赞/取消点赞
  toggle(articleId) {
    return post(`/likes/token/article/${articleId}/toggle`, {}, { needAuth: true })
  },

  // 检查点赞状态
  check(articleId) {
    return get(`/likes/article/${articleId}/check`, {}, { needAuth: true })
  }
}

/**
 * 收藏相关接口
 */
const favorite = {
  // 收藏/取消收藏
  toggle(articleId) {
    return post(`/favorites/token/article/${articleId}/toggle`, {}, { needAuth: true })
  },

  // 检查收藏状态
  check(articleId) {
    return get(`/favorites/article/${articleId}/check`, {}, { needAuth: true })
  },

  // 获取我的收藏列表
  getMyList(params = {}) {
    return get('/favorites/token/list', params, { needAuth: true })
  }
}

/**
 * 留言相关接口
 */
const message = {
  // 获取留言列表
  getList(params = {}) {
    return get('/messages', params)
  },

  // 发表留言
  create(data) {
    return post('/messages', data)
  },

  // 更新留言
  update(id, data) {
    return put(`/messages/token/${id}`, data, { needAuth: true })
  },

  // 删除留言
  delete(id) {
    return del(`/messages/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * 积分相关接口
 */
const points = {
  // 获取积分流水
  getLog(params = {}) {
    return get('/points/token/log', params, { needAuth: true })
  },

  // 获取商品列表
  getGoodsList(params = {}) {
    return get('/points/goods', params)
  },

  // 获取商品详情
  getGoodsDetail(id) {
    return get(`/points/goods/${id}`)
  },

  // 创建商品
  createGoods(data) {
    return post('/points/token/goods', data, { needAuth: true })
  },

  // 更新商品
  updateGoods(id, data) {
    return put(`/points/token/goods/${id}`, data, { needAuth: true })
  },

  // 删除商品
  deleteGoods(id) {
    return del(`/points/token/goods/${id}`, {}, { needAuth: true })
  },

  // 创建兑换订单
  createOrder(data) {
    return post('/points/orders', data, { needAuth: true })
  },

  // 获取订单列表
  getOrderList(params = {}) {
    return get('/points/orders', params, { needAuth: true })
  },

  // 获取订单详情
  getOrderDetail(id) {
    return get(`/points/orders/${id}`, {}, { needAuth: true })
  },

  // 更新订单状态
  updateOrder(id, data) {
    return put(`/points/token/orders/${id}`, data, { needAuth: true })
  }
}

/**
 * 用户相关接口
 */
const user = {
  // 获取当前用户信息
  getMe() {
    return get('/users/me', {}, { needAuth: true })
  },

  // 注册
  register(data) {
    return post('/users/register', data)
  },

  // 登录
  login(data) {
    return post('/users/login', data)
  },

  // 刷新 Token
  refreshToken(refreshToken) {
    return post('/users/refresh', { refreshToken })
  },

  // 修改密码
  updatePassword(data) {
    return post('/users/token/updatePassword', data, { needAuth: true })
  },

  // 找回密码 - 查询邮箱
  forgotEmail(username) {
    return get(`/users/forgot-email`, { username })
  },

  // 找回密码 - 验证邮箱
  forgotVerify(data) {
    return post('/users/forgot-verify', data)
  },

  // 找回密码 - 重置密码
  forgotReset(data) {
    return post('/users/forgot-reset', data)
  },

  // 获取用户列表（管理员）
  getList(params = {}) {
    return get('/users/token/', params, { needAuth: true })
  },

  // 获取用户详情（管理员）
  getDetail(id) {
    return get(`/users/token/${id}`, {}, { needAuth: true })
  },

  // 更新用户（管理员）
  update(id, data) {
    return put(`/users/token/${id}`, data, { needAuth: true })
  },

  // 删除用户（管理员）
  delete(id) {
    return del(`/users/token/${id}`, {}, { needAuth: true })
  },

  // 管理员添加用户
  adminAddUser(data) {
    return post('/users/token/admin-add-user', data, { needAuth: true })
  }
}

/**
 * 微信相关接口
 */
const wechat = {
  // 通过 code 获取 openid
  getOpenId(code) {
    return get(`/wechat/openid/${code}`)
  },

  // 通过 openid 获取用户信息
  getUserInfo(openid) {
    return get(`/wechat/userinfo/${openid}`)
  },

  // 绑定 openid 到用户账号
  bindOpenId(userId, openid) {
    return put(`/wechat/token/bind/${userId}`, { openid }, { needAuth: true })
  }
}

/**
 * 扫码登录相关接口
 */
const qrLogin = {
  // 创建扫码会话（PC端）
  createSession(data) {
    return post('/qr-login/session', data)
  },

  // 查询扫码会话状态（PC端）
  getSession(sceneId) {
    return get(`/qr-login/session/${sceneId}`)
  },

  // 小程序入口（扫码后调用）
  miniappEntry(data) {
    return post('/miniapp/qr-login/entry', data)
  },

  // 注册并确认（小程序端）
  registerAndConfirm(data) {
    return post('/miniapp/qr-login/register-and-confirm', data)
  },

  // 绑定并确认（小程序端）
  bindAndConfirm(data) {
    return post('/miniapp/qr-login/bind-and-confirm', data)
  }
}

/**
 * 数据看板相关接口
 */
const dashboard = {
  // 获取统计概览
  getStats() {
    return get('/dashboard/token/stats', {}, { needAuth: true })
  },

  // 获取文章排行
  getArticleRank(params = {}) {
    return get('/dashboard/token/article-rank', params, { needAuth: true })
  },

  // 获取用户趋势
  getUserTrend(params = {}) {
    return get('/dashboard/token/user-trend', params, { needAuth: true })
  },

  // 获取文章趋势
  getArticleTrend(params = {}) {
    return get('/dashboard/token/article-trend', params, { needAuth: true })
  },

  // 获取流量来源
  getTrafficSource(params = {}) {
    return get('/dashboard/token/traffic-source', params, { needAuth: true })
  }
}

/**
 * 系统设置相关接口
 */
const system = {
  // 获取系统配置
  getConfig() {
    return get('/otherswitch')
  },

  // 创建配置
  createConfig(data) {
    return post('/otherswitch/token/', data, { needAuth: true })
  },

  // 更新配置
  updateConfig(id, data) {
    return put(`/otherswitch/token/${id}`, data, { needAuth: true })
  },

  // 删除配置
  deleteConfig(id) {
    return del(`/otherswitch/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * 友情链接相关接口
 */
const friendLink = {
  // 获取友链列表
  getList() {
    return get('/friendslink')
  },

  // 创建友链
  create(data) {
    return post('/friendslink/token/', data, { needAuth: true })
  },

  // 更新友链
  update(linkId, data) {
    return put(`/friendslink/token/${linkId}`, data, { needAuth: true })
  },

  // 删除友链
  delete(linkId) {
    return del(`/friendslink/token/${linkId}`, {}, { needAuth: true })
  }
}

/**
 * 文件上传相关接口
 */
const upload = {
  // 富文本图片上传
  uploadRichEditor(filePath) {
    return new Promise((resolve, reject) => {
      const app = getApp()
      wx.uploadFile({
        url: 'https://wzapi.suxin23.cn/upload/token/rich_editor_upload',
        filePath,
        name: 'image',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            resolve(data.data)
          } else {
            reject(data)
          }
        },
        fail: reject
      })
    })
  },

  // 轮播图上传
  uploadSwiper(filePath) {
    return new Promise((resolve, reject) => {
      const app = getApp()
      wx.uploadFile({
        url: 'https://wzapi.suxin23.cn/upload/token/lbt_upload',
        filePath,
        name: 'image',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            resolve(data.data)
          } else {
            reject(data)
          }
        },
        fail: reject
      })
    })
  },

  // 获取图片列表
  getImageList(params = {}) {
    return get('/upload/imglist', params)
  },

  // 删除图片
  deleteImage(data) {
    return del('/upload/token/delimg', data, { needAuth: true })
  }
}

/**
 * 活动签到相关接口
 */
const activity = {
  // 获取活动列表
  getList(params = {}) {
    return get('/activity/token/', params, { needAuth: true })
  },

  // 创建活动
  create(data) {
    return post('/activity/time', data, { needAuth: true })
  },

  // 获取签到选项
  getSignOptions(params = {}) {
    return get('/activity/sign/select', params)
  },

  // 提交签到
  submitSign(data) {
    return post('/activity/sign', data)
  }
}

/**
 * 工具接口
 */
const utils = {
  // 获取工具结果（如二维码等）
  getUtils(params = {}) {
    return get('/utils', params)
  }
}

/**
 * 验证码接口
 */
const captcha = {
  // 获取验证码
  getCaptcha() {
    return get('/users/captcha')
  }
}

module.exports = {
  article,
  category,
  tag,
  swiper,
  comment,
  like,
  favorite,
  message,
  points,
  user,
  wechat,
  qrLogin,
  dashboard,
  system,
  friendLink,
  upload,
  activity,
  utils,
  captcha
}
