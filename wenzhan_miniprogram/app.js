// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    refreshToken: null,
    openid: null
  },

  onLaunch() {
    // 初始化时从本地存储读取登录态
    this.loadUserData()
  },

  // 加载用户数据
  loadUserData() {
    try {
      const token = wx.getStorageSync('token')
      const refreshToken = wx.getStorageSync('refreshToken')
      const userInfo = wx.getStorageSync('userInfo')
      const openid = wx.getStorageSync('openid')

      if (token) {
        this.globalData.token = token
        this.globalData.refreshToken = refreshToken
        this.globalData.userInfo = userInfo
        this.globalData.openid = openid
      }
    } catch (e) {
      console.error('加载用户数据失败', e)
    }
  },

  // 保存用户数据
  saveUserData(data) {
    try {
      if (data.token) {
        this.globalData.token = data.token
        wx.setStorageSync('token', data.token)
      }
      if (data.refreshToken) {
        this.globalData.refreshToken = data.refreshToken
        wx.setStorageSync('refreshToken', data.refreshToken)
      }
      if (data.userInfo) {
        this.globalData.userInfo = data.userInfo
        wx.setStorageSync('userInfo', data.userInfo)
      }
      if (data.openid) {
        this.globalData.openid = data.openid
        wx.setStorageSync('openid', data.openid)
      }
    } catch (e) {
      console.error('保存用户数据失败', e)
    }
  },

  // 清除用户数据
  clearUserData() {
    this.globalData.token = null
    this.globalData.refreshToken = null
    this.globalData.userInfo = null
    this.globalData.openid = null
    
    try {
      wx.removeStorageSync('token')
      wx.removeStorageSync('refreshToken')
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('openid')
    } catch (e) {
      console.error('清除用户数据失败', e)
    }
  },

  // 检查是否已登录
  isLoggedIn() {
    return !!this.globalData.token
  }
})
