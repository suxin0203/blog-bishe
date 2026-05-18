// 登录认证工具
const { get, post } = require('./request.js')
const app = getApp()

/**
 * 微信登录
 * @returns {Promise}
 */
function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('1. wx.login 成功，code:', res.code)
          // 通过 code 换取 openid
          getOpenId(res.code)
            .then(openid => {
              console.log('2. getOpenId 成功，openid:', openid)
              app.saveUserData({ openid })
              resolve(openid)
            })
            .catch(err => {
              console.error('2. getOpenId 失败:', err)
              reject(err)
            })
        } else {
          reject(new Error('获取 code 失败'))
        }
      },
      fail: reject
    })
  })
}

/**
 * 通过 code 获取 openid
 * @param {String} code 微信登录 code
 * @returns {Promise}
 */
function getOpenId(code) {
  console.log('getOpenId 开始，code:', code)
  return get(`/wechat/openid/${code}`)
    .then(res => {
      console.log('getOpenId 后端返回:', res)
      // 后端返回格式：{ session_key, openid }
      if (res && res.openid) {
        console.log('✅ 成功提取 openid:', res.openid)
        return res.openid
      }
      // 兼容其他格式
      if (typeof res === 'string') {
        console.log('✅ openid 是字符串:', res)
        return res
      }
      console.error('❌ 无法提取 openid，res:', res)
      throw new Error('获取 openid 失败')
    })
    .catch(err => {
      console.error('❌ getOpenId 请求失败:', err)
      throw err
    })
}

/**
 * 检查 openid 是否已绑定用户
 * @param {String} openid 
 * @returns {Promise}
 */
function checkUserBind(openid) {
  return get(`/wechat/userinfo/${openid}`)
    .then(res => {
      // 后端返回 { code: 200, token, data: {...} } 表示已绑定
      if (res && res.code === 200 && res.token) {
        return res
      }
      return null
    })
    .catch(err => {
      // 接口返回错误或 code: 0，说明未绑定
      console.log('用户未绑定', err)
      return null
    })
}

/**
 * 注册新账号
 * @param {Object} data 注册数据
 * @returns {Promise}
 */
function register(data) {
  return post('/users/register', data)
}

/**
 * 账号密码登录
 * @param {Object} data 登录数据
 * @returns {Promise}
 */
function login(data) {
  // 如果有 openid，说明是绑定操作，不需要验证码
  // 如果没有 openid，说明是普通登录，需要验证码
  return post('/users/login', data)
}

/**
 * 获取当前用户信息
 * @returns {Promise}
 */
function getUserInfo() {
  return get('/users/me', {}, { needAuth: true })
}

/**
 * 刷新 Token
 * @returns {Promise}
 */
function refreshToken() {
  return post('/users/refresh', {
    refreshToken: app.globalData.refreshToken
  })
}

/**
 * 退出登录
 */
function logout() {
  app.clearUserData()
  wx.showToast({
    title: '已退出登录',
    icon: 'success',
    duration: 2000
  })
  setTimeout(() => {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  }, 2000)
}

/**
 * 检查是否已登录
 * @returns {Boolean}
 */
function isLoggedIn() {
  return app.isLoggedIn()
}

/**
 * 要求登录（未登录则跳转到登录页）
 * @returns {Boolean} 是否已登录
 */
function requireLogin() {
  if (!isLoggedIn()) {
    wx.showModal({
      title: '提示',
      content: '该操作需要登录，是否立即登录？',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/auth/login'
          })
        }
      }
    })
    return false
  }
  return true
}

module.exports = {
  wxLogin,
  getOpenId,
  checkUserBind,
  register,
  login,
  getUserInfo,
  refreshToken,
  logout,
  isLoggedIn,
  requireLogin
}
