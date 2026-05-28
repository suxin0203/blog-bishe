// pages/auth/login.js
const auth = require('../../utils/auth.js')
const api = require('../../api/index.js')
const util = require('../../utils/util.js')

Page({
  data: {
    loginType: 'wechat', // wechat, register, bind
    username: '',
    password: '',
    email: '',
    loading: false,
    // 验证码相关
    captchaId: '',
    captchaNum1: 0,
    captchaNum2: 0,
    captchaAnswer: '',
    captchaLoading: false
  },

  onLoad(options) {
    // 如果有指定登录类型，则使用指定的类型
    if (options && options.type) {
      this.setData({ loginType: options.type })
      // 如果是注册类型，自动获取验证码
      if (options.type === 'register') {
        this.getCaptcha()
      }
    } else {
      // 否则自动尝试微信登录
      this.handleWechatLogin()
    }
  },

  // 微信登录
  async handleWechatLogin() {
    if (this.data.loading) return
    console.log('========== 开始微信登录 ==========')
    try {
      this.setData({ loading: true })
      wx.showLoading({ title: '登录中...', mask: true })
      
      // 获取 openid
      console.log('步骤1: 获取 openid')
      const openid = await auth.wxLogin()
      console.log('步骤1 完成: openid =', openid)
      
      // 检查是否已绑定
      console.log('步骤2: 检查绑定状态')
      const userInfo = await auth.checkUserBind(openid)
      console.log('步骤2 完成: userInfo =', userInfo)
      
      wx.hideLoading()
      
      if (userInfo && userInfo.token) {
        console.log('✅ 用户已绑定，直接登录')
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        // 保存登录信息
        getApp().saveUserData({
          token: userInfo.token,
          refreshToken: userInfo.data?.refresh_token,
          userInfo: userInfo.data,
          openid: openid
        })
        await this.refreshCurrentUser()
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        console.log('⚠️ 用户未绑定，显示注册/绑定选项')
        // 未绑定，显示注册/绑定选项
        this.showBindOptions()
      }
      console.log('========== 微信登录流程结束 ==========')
    } catch (error) {
      wx.hideLoading()
      console.error('========== 微信登录失败 ==========')
      console.error('错误详情:', error)
      console.error('错误类型:', typeof error)
      console.error('错误消息:', error.message)
      console.error('错误对象:', JSON.stringify(error))
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 登录成功后刷新当前用户信息
  async refreshCurrentUser() {
    try {
      const latestUserInfo = util.convertObjectImageUrls(await api.user.getMe(), ['avatar_url'])
      getApp().saveUserData({ userInfo: latestUserInfo })
      return latestUserInfo
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      return null
    }
  },

  // 输入用户名
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    })
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 输入邮箱
  onEmailInput(e) {
    this.setData({
      email: e.detail.value
    })
  },

  // 输入验证码答案
  onCaptchaInput(e) {
    this.setData({
      captchaAnswer: e.detail.value
    })
  },

  // 获取验证码
  async getCaptcha() {
    if (this.data.captchaLoading) return
    
    try {
      this.setData({ captchaLoading: true })
      const res = await api.captcha.getCaptcha()
      console.log('获取验证码:', res)
      
      this.setData({
        captchaId: res.captchaId,
        captchaNum1: res.num1,
        captchaNum2: res.num2,
        captchaAnswer: '' // 清空之前的答案
      })
    } catch (error) {
      console.error('获取验证码失败:', error)
      wx.showToast({
        title: '获取验证码失败',
        icon: 'none'
      })
    } finally {
      this.setData({ captchaLoading: false })
    }
  },

  // 注册新账号
  async handleRegister() {
    const { username, password, email, captchaId, captchaAnswer } = this.data
    
    // 验证用户名
    if (!username || username.trim().length < 4) {
      wx.showToast({
        title: '用户名至少4个字符',
        icon: 'none'
      })
      return
    }

    // 验证密码
    if (!password || password.trim().length < 4) {
      wx.showToast({
        title: '密码至少4个字符',
        icon: 'none'
      })
      return
    }

    // 验证邮箱（必填）
    if (!email || !email.trim()) {
      wx.showToast({
        title: '请填写邮箱（用于找回密码）',
        icon: 'none'
      })
      return
    }

    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailReg.test(email)) {
      wx.showToast({
        title: '邮箱格式不正确',
        icon: 'none'
      })
      return
    }

    // 验证验证码
    if (!captchaAnswer || captchaAnswer.trim() === '') {
      wx.showToast({
        title: '请输入验证码',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ loading: true })
      
      const openid = getApp().globalData.openid
      
      if (!openid) {
        throw new Error('未获取到微信授权信息，请重新登录')
      }

      console.log('开始注册，openid:', openid)
      
      // 计算验证码答案的 MD5
      const crypto = require('../../utils/crypto.js')
      const captchaAnswerHash = crypto.md5(captchaAnswer.trim())
      
      // 密码使用 Base64 编码
      const passwordBase64 = this.base64Encode(password.trim())
      
      const res = await auth.register({
        username: username.trim(),
        password: passwordBase64,  // Base64 编码
        email: email.trim(),
        openid,  // 注册时直接绑定 openid
        captchaId,
        captchaAnswer: captchaAnswerHash
      })

      console.log('注册成功:', res)

      wx.showToast({
        title: '注册成功',
        icon: 'success'
      })

      // 保存登录信息
      getApp().saveUserData({
        token: res.token,
        refreshToken: res.refreshToken,
        userInfo: res.userInfo || res,
        openid
      })
      await this.refreshCurrentUser()

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('注册失败', error)
      
      // 登录逻辑失败后，主动刷新验证码避免过期
      this.getCaptcha()
      
      const errorMsg = error.message || '注册失败'
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 绑定已有账号（需要验证码）
  async handleBind() {
    const { username, password, captchaId, captchaAnswer } = this.data
    
    // 验证用户名
    if (!username || username.trim().length < 4) {
      wx.showToast({
        title: '用户名至少4个字符',
        icon: 'none'
      })
      return
    }

    // 验证密码
    if (!password || password.trim().length < 4) {
      wx.showToast({
        title: '密码至少4个字符',
        icon: 'none'
      })
      return
    }

    // 验证验证码
    if (!captchaAnswer || captchaAnswer.trim() === '') {
      wx.showToast({
        title: '请输入验证码',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ loading: true })
      
      const openid = getApp().globalData.openid
      
      if (!openid) {
        throw new Error('未获取到微信授权信息，请重新登录')
      }

      console.log('开始绑定，openid:', openid)
      
      // 计算验证码答案的 MD5
      const crypto = require('../../utils/crypto.js')
      const captchaAnswerHash = crypto.md5(captchaAnswer.trim())
      
      // 密码使用 Base64 编码
      const passwordBase64 = this.base64Encode(password.trim())
      
      // 登录并绑定 openid
      const loginRes = await auth.login({
        username: username.trim(),
        password: passwordBase64,  // Base64 编码
        captchaId,
        captchaAnswer: captchaAnswerHash,
        openid  // 传 openid，后端会自动绑定
      })

      console.log('登录并绑定成功')
      
      wx.showToast({
        title: '绑定成功',
        icon: 'success'
      })

      // 保存登录信息
      getApp().saveUserData({
        token: loginRes.token,
        refreshToken: loginRes.refreshToken,
        userInfo: loginRes.data || loginRes.userInfo || loginRes,
        openid
      })
      await this.refreshCurrentUser()

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('绑定失败', error)
      
      // 登录逻辑失败后，主动刷新验证码避免过期
      this.getCaptcha()
      
      const errorMsg = error.message || '绑定失败'
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 显示绑定选项
  showBindOptions() {
    wx.showModal({
      title: '欢迎使用',
      content: '检测到您是新用户，请选择注册新账号或绑定已有账号',
      confirmText: '注册新账号',
      cancelText: '绑定账号',
      success: (res) => {
        if (res.confirm) {
          // 注册新账号，获取验证码
          this.setData({ loginType: 'register' })
          this.getCaptcha()
        } else if (res.cancel) {
          // 绑定已有账号，也需要获取验证码
          this.setData({ loginType: 'bind' })
          this.getCaptcha()
        }
      },
      fail: () => {
        // 用户关闭了弹窗，默认显示注册界面
        this.setData({ loginType: 'register' })
        this.getCaptcha()
      }
    })
  },

  // 切换登录方式
  switchLoginType(e) {
    const { type } = e.currentTarget.dataset
    this.setData({ 
      loginType: type,
      username: '',
      password: '',
      email: '',
      captchaAnswer: ''
    })
    
    // 切换到注册或绑定，都获取验证码
    if (type === 'register' || type === 'bind') {
      this.getCaptcha()
    }
  },

  // 返回微信登录
  backToWechat() {
    this.setData({ 
      loginType: 'wechat',
      username: '',
      password: '',
      email: '',
      captchaAnswer: '',
      captchaId: ''
    })
  },

  // Base64 编码工具函数
  base64Encode(str) {
    const base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    let out = '', i = 0, len = str.length
    let c1, c2, c3
    
    while (i < len) {
      c1 = str.charCodeAt(i++) & 0xff
      if (i == len) {
        out += base64EncodeChars.charAt(c1 >> 2)
        out += base64EncodeChars.charAt((c1 & 0x3) << 4)
        out += "=="
        break
      }
      c2 = str.charCodeAt(i++)
      if (i == len) {
        out += base64EncodeChars.charAt(c1 >> 2)
        out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4))
        out += base64EncodeChars.charAt((c2 & 0xF) << 2)
        out += "="
        break
      }
      c3 = str.charCodeAt(i++)
      out += base64EncodeChars.charAt(c1 >> 2)
      out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4))
      out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6))
      out += base64EncodeChars.charAt(c3 & 0x3F)
    }
    return out
  },

  // 字符串转 ArrayBuffer
  stringToArrayBuffer(str) {
    const buf = new ArrayBuffer(str.length)
    const bufView = new Uint8Array(buf)
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i)
    }
    return buf
  }
})
