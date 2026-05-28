// pages/me/index.js
const api = require('../../api/index.js')
const auth = require('../../utils/auth.js')
const util = require('../../utils/util.js')

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    menuList: [
      {
        icon: '⭐',
        title: '我的收藏',
        url: '/pages/favorites/index'
      },
      {
        icon: '📋',
        title: '积分流水',
        url: '/pages/points/log'
      },
      {
        icon: '📖',
        title: '积分规则',
        url: '/pages/points/rules'
      },
      {
        icon: '🛒',
        title: '我的订单',
        url: '/pages/points/orders'
      },
      {
        icon: '❓',
        title: '关于系统',
        url: '/pages/about/index'
      }
    ]
  },

  onShow() {
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = auth.isLoggedIn()
    this.setData({ isLoggedIn })

    if (isLoggedIn) {
      this.loadUserInfo()
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = util.convertObjectImageUrls(await api.user.getMe(), ['avatar_url'])
      this.setData({ userInfo })
      getApp().saveUserData({ userInfo })
    } catch (error) {
      console.error('加载用户信息失败', error)
    }
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/auth/login'
    })
  },

  // 跳转到菜单页面
  goToMenu(e) {
    const { url } = e.currentTarget.dataset
    
    if (!url) {
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      })
      return
    }

    // 关于页面不需要登录
    if (url === '/pages/about/index') {
      wx.navigateTo({ url })
      return
    }

    if (!auth.requireLogin()) {
      return
    }

    wx.navigateTo({ url })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          auth.logout()
        }
      }
    })
  }
})
