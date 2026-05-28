// auth helper
const { get, post } = require('./request.js')
const app = getApp()

const TEXT = {
  wx_login_success: '\u6210\u529f',
  wx_login_failed: '\u5931\u8d25',
  get_code_failed: '\u83b7\u53d6 code \u5931\u8d25',
  get_openid_failed: '\u83b7\u53d6 openid \u5931\u8d25',
  user_not_bound: '\u7528\u6237\u672a\u7ed1\u5b9a',
  logout_success: '\u5df2\u9000\u51fa\u767b\u5f55',
  login_required_title: '\u63d0\u793a',
  login_required_content: '\u8be5\u64cd\u4f5c\u9700\u8981\u767b\u5f55\uff0c\u662f\u5426\u7acb\u5373\u767b\u5f55\uff1f',
  go_login: '\u53bb\u767b\u5f55',
  wx_login_timeout: '\u5fae\u4fe1\u767b\u5f55\u8d85\u65f6\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5'
}

function normalizeLoginError(err) {
  const message = err && (err.errMsg || err.message || String(err))
  if (message && message.includes('timeout')) {
    return new Error(TEXT.wx_login_timeout)
  }
  return err instanceof Error ? err : new Error(message || TEXT.wx_login_failed)
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('1. wx.login success, code:', res.code)
          getOpenId(res.code)
            .then(openid => {
              console.log('2. getOpenId success, openid:', openid)
              app.saveUserData({ openid })
              resolve(openid)
            })
            .catch(err => {
              console.error('2. getOpenId failed:', err)
              reject(normalizeLoginError(err))
            })
        } else {
          reject(new Error(TEXT.get_code_failed))
        }
      },
      fail: (err) => {
        console.error('wx.login failed:', err)
        reject(normalizeLoginError(err))
      }
    })
  })
}

function getOpenId(code) {
  console.log('getOpenId start, code:', code)
  return get(`/wechat/openid/${code}`)
    .then(res => {
      console.log('getOpenId response:', res)
      if (res && res.openid) {
        return res.openid
      }
      if (typeof res === 'string') {
        return res
      }
      throw new Error(TEXT.get_openid_failed)
    })
    .catch(err => {
      console.error('getOpenId request failed:', err)
      throw normalizeLoginError(err)
    })
}

function checkUserBind(openid) {
  return get(`/wechat/userinfo/${openid}`)
    .then(res => {
      if (res && res.code === 200 && res.token) {
        return res
      }
      return null
    })
    .catch(err => {
      console.log(TEXT.user_not_bound, err)
      return null
    })
}

function register(data) {
  return post('/users/register', data)
}

function login(data) {
  return post('/users/login', data)
}

function getUserInfo() {
  return get('/users/me', {}, { needAuth: true })
}

function refreshToken() {
  return post('/users/refresh', {
    refreshToken: app.globalData.refreshToken
  })
}

function logout() {
  app.clearUserData()
  wx.showToast({
    title: TEXT.logout_success,
    icon: 'success',
    duration: 2000
  })
  setTimeout(() => {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  }, 2000)
}

function isLoggedIn() {
  return app.isLoggedIn()
}

function requireLogin() {
  if (!isLoggedIn()) {
    wx.showModal({
      title: TEXT.login_required_title,
      content: TEXT.login_required_content,
      confirmText: TEXT.go_login,
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
