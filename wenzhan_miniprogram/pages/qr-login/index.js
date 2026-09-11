// pages/qr-login/index.js
const api = require('../../api/index.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    sceneId: null,
    loading: false,
    needBind: false,
    bindToken: null,
    // 扫码来源端的真实信息（后端解析 UA 返回），无数据时回退到通用文案
    clientInfo: null
  },

  onLoad(options) {
    // 从扫码参数中获取 sceneId
    const { scene, sceneId } = options
    
    let finalSceneId = null
    if (scene) {
      // 解码场景值
      finalSceneId = decodeURIComponent(scene)
    } else if (sceneId) {
      finalSceneId = sceneId
    }

    console.log('二维码登录页面加载，sceneId:', finalSceneId)
    this.setData({ sceneId: finalSceneId })

    // 检查登录状态
    if (!auth.isLoggedIn()) {
      this.showLoginPrompt()
      return
    }

    // 已登录，调用小程序入口接口
    this.handleMiniappEntry()
  },

  // 提示登录
  showLoginPrompt() {
    wx.showModal({
      title: '提示',
      content: '请先登录后再确认扫码登录',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.redirectTo({
            url: '/pages/auth/login'
          })
        } else {
          wx.navigateBack()
        }
      }
    })
  },

  // 调用小程序入口接口
  async handleMiniappEntry() {
    try {
      // 获取微信登录 code
      const loginRes = await wx.login()
      const code = loginRes.code

      // 调用后端接口
      const res = await api.qrLogin.miniappEntry({
        sceneId: this.data.sceneId,
        code
      })

      console.log('小程序入口返回:', res)

      // 展示真实的扫码来源端信息（设备/通道/IP 脱敏），替代页面上写死的假数据
      if (res.client) {
        this.setData({ clientInfo: res.client })
      }

      if (res.action === 'login_ok') {
        // 已绑定，直接确认登录成功
        wx.showToast({
          title: '确认成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else if (res.action === 'need_register_or_bind') {
        // 需要绑定账号
        this.setData({
          needBind: true,
          bindToken: res.bindToken
        })
        this.showBindPrompt()
      }
    } catch (error) {
      console.error('小程序入口失败', error)
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      })
    }
  },

  // 提示绑定账号
  showBindPrompt() {
    wx.showModal({
      title: '需要绑定账号',
      content: '当前微信未绑定账号，请选择注册新账号或绑定已有账号',
      confirmText: '去绑定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到登录页面，携带绑定参数
          wx.redirectTo({
            url: `/pages/auth/login?mode=bind&sceneId=${this.data.sceneId}&bindToken=${this.data.bindToken}`
          })
        } else {
          wx.navigateBack()
        }
      }
    })
  },

  // 确认登录（已绑定用户直接确认）
  async handleConfirm() {
    if (this.data.needBind) {
      this.showBindPrompt()
      return
    }

    // 这个按钮在已绑定的情况下不应该显示，因为 handleMiniappEntry 已经自动确认了
    wx.showToast({
      title: '已自动确认',
      icon: 'success'
    })
  },

  // 取消登录
  handleCancel() {
    wx.showModal({
      title: '提示',
      content: '确定要取消登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  }
})
