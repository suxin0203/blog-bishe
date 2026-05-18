// pages/pc-qr-login/index.js
const api = require('../../api/index.js')

Page({
  data: {
    sceneId: null,
    loading: false,
    needBind: false,
    bindToken: null,
    autoAuth: false, // 自动授权开关
    showSuccess: false, // 显示成功页面
    retrying: false
  },

  onLoad(options) {
    console.log('PC 扫码登录页面加载，options:', options)
    
    // 从扫码参数中获取 sceneId
    const { scene, sceneId, q } = options
    
    let finalSceneId = null
    
    if (scene) {
      finalSceneId = decodeURIComponent(scene)
      console.log('从 scene 获取 sceneId:', finalSceneId)
    } else if (sceneId) {
      finalSceneId = sceneId
      console.log('从 sceneId 获取:', finalSceneId)
    } else if (q) {
      const url = decodeURIComponent(q)
      console.log('从 q 参数获取 URL:', url)
      const match = url.match(/scene=([^&]+)/)
      if (match) {
        finalSceneId = match[1]
        console.log('从 URL 提取 sceneId:', finalSceneId)
      }
    }

    if (!finalSceneId) {
      wx.showModal({
        title: '参数错误',
        content: '未获取到有效的场景值',
        showCancel: false,
        success: () => {
          wx.navigateBack({
            fail: () => {
              wx.switchTab({ url: '/pages/index/index' })
            }
          })
        }
      })
      return
    }

    this.setData({ sceneId: finalSceneId })

    // 检查是否开启了自动授权
    const autoAuth = wx.getStorageSync('pc_qr_auto_auth') || false
    this.setData({ autoAuth })

    if (autoAuth) {
      // 自动授权，直接调用接口
      this.handleMiniappEntry()
    }
    // 否则显示确认页面，等待用户点击确认按钮
  },

  // 切换自动授权
  toggleAutoAuth(e) {
    const autoAuth = e.detail.value
    this.setData({ autoAuth })
    wx.setStorageSync('pc_qr_auto_auth', autoAuth)
    
    wx.showToast({
      title: autoAuth ? '已开启自动授权' : '已关闭自动授权',
      icon: 'none',
      duration: 1500
    })
  },

  // 调用小程序入口接口
  async handleMiniappEntry() {
    try {
      this.setData({ loading: true })
      
      const loginRes = await wx.login()
      const code = loginRes.code
      
      console.log('调用小程序入口接口，sceneId:', this.data.sceneId, 'code:', code)

      const res = await api.qrLogin.miniappEntry({
        sceneId: this.data.sceneId,
        code
      })

      console.log('小程序入口返回:', res)

      if (res.action === 'login_ok') {
        // 显示成功页面
        this.setData({
          showSuccess: true,
          loading: false
        })
        
        // 2秒后自动关闭
        setTimeout(() => {
          wx.navigateBack({
            fail: () => {
              wx.switchTab({ url: '/pages/index/index' })
            }
          })
        }, 2000)
      } else if (res.action === 'need_register_or_bind') {
        this.setData({
          needBind: true,
          bindToken: res.bindToken,
          loading: false
        })
        this.showBindPrompt()
      }
    } catch (error) {
      console.error('小程序入口失败', error)
      this.setData({ loading: false })
      
      if (error.code === 410) {
        wx.showModal({
          title: '二维码已过期',
          content: '请在 PC 端刷新二维码后重新扫码',
          showCancel: false,
          success: () => {
            wx.navigateBack({
              fail: () => {
                wx.switchTab({ url: '/pages/index/index' })
              }
            })
          }
        })
      } else {
        wx.showModal({
          title: '操作失败',
          content: error.message || '请稍后重试',
          showCancel: false
        })
      }
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
          wx.redirectTo({
            url: `/pages/auth/login?mode=bind&sceneId=${this.data.sceneId}&bindToken=${this.data.bindToken}`
          })
        } else {
          wx.navigateBack({
            fail: () => {
              wx.switchTab({ url: '/pages/index/index' })
            }
          })
        }
      }
    })
  },

  // 确认登录
  async handleConfirm() {
    if (this.data.needBind) {
      this.showBindPrompt()
      return
    }
    
    this.handleMiniappEntry()
  },

  // 取消登录
  handleCancel() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
  }
})
