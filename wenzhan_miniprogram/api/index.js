// API ????
const { get, post, put, del } = require('../utils/request.js')

/**
 * ??????
 */
const article = {
  // ??????
  getList(params = {}) {
    return get('/articles', params)
  },

  // ??????
  getTop(params = {}) {
    return get('/articles/top', params)
  },

  // ??????
  getArchive(params = {}) {
    return get('/articles/archive', params)
  },

  // ??????
  getDetail(id) {
    return get(`/articles/${id}`)
  },

  // ?????
  addView(id) {
    return post(`/articles/${id}/view`)
  },

  // ??????
  getAdminList(params = {}) {
    return get('/articles/token/list', params, { needAuth: true })
  },

  // ????
  create(data) {
    return post('/articles/token/', data, { needAuth: true })
  },

  // ????
  update(id, data) {
    return put(`/articles/token/${id}`, data, { needAuth: true })
  },

  // ????
  delete(id) {
    return del(`/articles/token/${id}`, {}, { needAuth: true })
  },

  // ????
  restore(id) {
    return put(`/articles/token/${id}/restore`, {}, { needAuth: true })
  }
}

/**
 * ??????
 */
const category = {
  // ??????
  getList() {
    return get('/categories')
  },

  // ????
  create(data) {
    return post('/categories/token/', data, { needAuth: true })
  },

  // ????
  update(id, data) {
    return put(`/categories/token/${id}`, data, { needAuth: true })
  },

  // ????
  delete(id) {
    return del(`/categories/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * ??????
 */
const tag = {
  // ??????
  getList() {
    return get('/tags')
  },

  // ????
  create(data) {
    return post('/tags/token/', data, { needAuth: true })
  },

  // ????
  update(id, data) {
    return put(`/tags/token/${id}`, data, { needAuth: true })
  },

  // ????
  delete(id) {
    return del(`/tags/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * ???????
 */
const swiper = {
  // ???????
  getList() {
    return get('/swiper')
  },

  // ?????
  create(data) {
    return post('/swiper/token/', data, { needAuth: true })
  },

  // ?????
  update(id, data) {
    return put(`/swiper/token/${id}`, data, { needAuth: true })
  },

  // ?????
  delete(id) {
    return del(`/swiper/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * ??????
 */
const comment = {
  // ??????
  getByArticle(articleId, params = {}) {
    return get(`/comments/article/${articleId}`, params)
  },

  // ????
  create(data) {
    return post('/comments', data, { needAuth: true })
  },

  // ??????
  getAdminList(params = {}) {
    return get('/comments/token/', params, { needAuth: true })
  },

  // ????
  update(id, data) {
    return put(`/comments/token/${id}`, data, { needAuth: true })
  },

  // ????
  delete(id) {
    return del(`/comments/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * ??????
 */
const like = {
  // ??/????
  toggle(articleId) {
    return post(`/likes/token/article/${articleId}/toggle`, {}, { needAuth: true })
  },

  // ??????
  check(articleId) {
    return get(`/likes/article/${articleId}/check`, {}, { needAuth: true })
  }
}

/**
 * ??????
 */
const favorite = {
  // ??/????
  toggle(articleId) {
    return post(`/favorites/token/article/${articleId}/toggle`, {}, { needAuth: true })
  },

  // ??????
  check(articleId) {
    return get(`/favorites/article/${articleId}/check`, {}, { needAuth: true })
  },

  // ????????
  getMyList(params = {}) {
    return get('/favorites/token/list', params, { needAuth: true })
  }
}

/**
 * ??????
 */
const message = {
  // ??????
  getList(params = {}) {
    return get('/messages', params)
  },

  // ????
  create(data) {
    return post('/messages', data)
  },

  // ????
  update(id, data) {
    return put(`/messages/token/${id}`, data, { needAuth: true })
  },

  // ????
  delete(id) {
    return del(`/messages/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * ??????
 */
const points = {
  // ??????
  getLog(params = {}) {
    return get('/points/token/log', params, { needAuth: true })
  },

  // ??????
  getGoodsList(params = {}) {
    return get('/points/goods', params)
  },

  // ??????
  getGoodsDetail(id) {
    return get(`/points/goods/${id}`)
  },

  // ????
  createGoods(data) {
    return post('/points/token/goods', data, { needAuth: true })
  },

  // ????
  updateGoods(id, data) {
    return put(`/points/token/goods/${id}`, data, { needAuth: true })
  },

  // ????
  deleteGoods(id) {
    return del(`/points/token/goods/${id}`, {}, { needAuth: true })
  },

  // ??????
  createOrder(data) {
    return post('/points/orders', data, { needAuth: true })
  },

  // ??????
  getOrderList(params = {}) {
    return get('/points/orders', params, { needAuth: true })
  },

  // ??????
  getOrderDetail(id) {
    return get(`/points/orders/${id}`, {}, { needAuth: true })
  },

  // ??????
  updateOrder(id, data) {
    return put(`/points/token/orders/${id}`, data, { needAuth: true })
  }
}

/**
 * ??????
 */
const user = {
  // ????????
  getMe() {
    return get('/users/me', {}, { needAuth: true })
  },

  // ??
  register(data) {
    return post('/users/register', data)
  },

  // ??
  login(data) {
    return post('/users/login', data)
  },

  // ?? Token
  refreshToken(refreshToken) {
    return post('/users/refresh', { refreshToken })
  },

  // ????
  updatePassword(data) {
    return post('/users/token/updatePassword', data, { needAuth: true })
  },

  // ???? - ????
  forgotEmail(username) {
    return get(`/users/forgot-email`, { username })
  },

  // ???? - ????
  forgotVerify(data) {
    return post('/users/forgot-verify', data)
  },

  // ???? - ????
  forgotReset(data) {
    return post('/users/forgot-reset', data)
  },

  // ???????????
  getList(params = {}) {
    return get('/users/token/', params, { needAuth: true })
  },

  // ???????????
  getDetail(id) {
    return get(`/users/token/${id}`, {}, { needAuth: true })
  },

  // ?????????
  update(id, data) {
    return put(`/users/token/${id}`, data, { needAuth: true })
  },

  // ?????????
  delete(id) {
    return del(`/users/token/${id}`, {}, { needAuth: true })
  },

  // ???????
  adminAddUser(data) {
    return post('/users/token/admin-add-user', data, { needAuth: true })
  }
}

/**
 * ??????
 */
const wechat = {
  // ?? code ?? openid
  getOpenId(code) {
    return get(`/wechat/openid/${code}`)
  },

  // ?? openid ??????
  getUserInfo(openid) {
    return get(`/wechat/userinfo/${openid}`)
  },

  // ?? openid ?????
  bindOpenId(userId, openid) {
    return put(`/wechat/token/bind/${userId}`, { openid }, { needAuth: true })
  }
}

/**
 * ????????
 */
const qrLogin = {
  // ???????PC??
  createSession(data) {
    return post('/qr-login/session', data)
  },

  // ?????????PC??
  getSession(sceneId) {
    return get(`/qr-login/session/${sceneId}`)
  },

  // ????????????
  miniappEntry(data) {
    return post('/miniapp/qr-login/entry', data)
  },

  // ???????????
  registerAndConfirm(data) {
    return post('/miniapp/qr-login/register-and-confirm', data)
  },

  // ???????????
  bindAndConfirm(data) {
    return post('/miniapp/qr-login/bind-and-confirm', data)
  }
}

/**
 * ????????
 */
const dashboard = {
  // ??????
  getStats() {
    return get('/dashboard/token/stats', {}, { needAuth: true })
  },

  // ??????
  getArticleRank(params = {}) {
    return get('/dashboard/token/article-rank', params, { needAuth: true })
  },

  // ??????
  getUserTrend(params = {}) {
    return get('/dashboard/token/user-trend', params, { needAuth: true })
  },

  // ??????
  getArticleTrend(params = {}) {
    return get('/dashboard/token/article-trend', params, { needAuth: true })
  },

  // ??????
  getTrafficSource(params = {}) {
    return get('/dashboard/token/traffic-source', params, { needAuth: true })
  }
}

/**
 * ????????
 */
const system = {
  // ??????
  getConfig() {
    return get('/otherswitch')
  },

  // ????
  createConfig(data) {
    return post('/otherswitch/token/', data, { needAuth: true })
  },

  // ????
  updateConfig(id, data) {
    return put(`/otherswitch/token/${id}`, data, { needAuth: true })
  },

  // ????
  deleteConfig(id) {
    return del(`/otherswitch/token/${id}`, {}, { needAuth: true })
  }
}

/**
 * ????????
 */
const friendLink = {
  // ??????
  getList() {
    return get('/friendslink')
  },

  // ????
  create(data) {
    return post('/friendslink/token/', data, { needAuth: true })
  },

  // ????
  update(linkId, data) {
    return put(`/friendslink/token/${linkId}`, data, { needAuth: true })
  },

  // ????
  delete(linkId) {
    return del(`/friendslink/token/${linkId}`, {}, { needAuth: true })
  }
}

/**
 * ????????
 */
const upload = {
  // ???????
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

  // ?????
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

  // ??????
  getImageList(params = {}) {
    return get('/upload/imglist', params)
  },

  // ????
  deleteImage(data) {
    return del('/upload/token/delimg', data, { needAuth: true })
  }
}

/**
 * ????????
 */
const activity = {
  // ??????
  getList(params = {}) {
    return get('/activity/token/', params, { needAuth: true })
  },

  // ????
  create(data) {
    return post('/activity/time', data, { needAuth: true })
  },

  // ??????
  getSignOptions(params = {}) {
    return get('/activity/sign/select', params)
  },

  // ????
  submitSign(data) {
    return post('/activity/sign', data)
  }
}

/**
 * ????
 */
const utils = {
  // ?????????????
  getUtils(params = {}) {
    return get('/utils', params)
  }
}

/**
 * ?????
 */
const captcha = {
  // ?????
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
