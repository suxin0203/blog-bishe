// pages/points/index.js
const api = require('../../api/index.js')
const util = require('../../utils/util.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    userInfo: null,
    recentLogs: [],
    loading: true,
    isLoggedIn: false
  },

  onLoad() {
    this.checkLoginAndLoad()
  },

  onShow() {
    this.checkLoginAndLoad()
  },

  // 检查登录状态并加载数据
  checkLoginAndLoad() {
    const isLoggedIn = auth.isLoggedIn()
    this.setData({ isLoggedIn, loading: false })
    
    if (isLoggedIn) {
      this.loadData()
    }
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/auth/login'
    })
  },

  // 加载数据
  async loadData() {
    try {
      const [userInfo, logs] = await Promise.all([
        api.user.getMe(),
        api.points.getLog({ page: 1, pageSize: 5 })
      ])

      // 处理积分流水，添加格式化后的文本
      const recentLogs = (logs.list || logs || []).map(item => {
        return {
          ...item,
          reasonText: this.parseReason(item)
        }
      })

      this.setData({
        userInfo,
        recentLogs,
        loading: false
      })

      // 更新全局用户信息
      getApp().saveUserData({ userInfo })
    } catch (error) {
      console.error('加载数据失败', error)
      this.setData({ loading: false })
    }
  },

  // 跳转到积分流水
  goToPointsLog() {
    wx.navigateTo({
      url: '/pages/points/log'
    })
  },

  // 跳转到积分规则
  goToPointsRules() {
    wx.navigateTo({
      url: '/pages/points/rules'
    })
  },

  // 跳转到积分商城
  goToPointsMall() {
    wx.navigateTo({
      url: '/pages/points/mall'
    })
  },

  // 格式化积分原因
  parseReason(item) {
    const reason = item.reason
    const remark = item.remark
    
    const reasonMap = {
      'daily_login': '每日登录',
      'comment': '评论通过',
      'like': '点赞',
      'like_cancel': '取消点赞',
      'article_liked': '文章获赞',
      'article_unliked': '文章取消获赞',
      'article_publish': '发布文章',
      'article_delete': '删除文章',
      'comment_approved': '评论审核通过',
      'comment_removed': '删除已通过评论',
      'redeem': '兑换',
      'redeem_goods': '积分兑换',
      'refund': '退款',
      'admin_adjust': '管理员调整'
    }
    
    const base = reasonMap[reason] || reason || '未知原因'
    
    // 文章相关操作，显示文章标题
    const actionReasons = ['article_liked', 'article_unliked', 'article_publish', 'article_delete', 'comment_approved', 'comment_removed']
    if (remark && actionReasons.includes(reason)) {
      return `${base}《${remark}》`
    }
    
    // 其他有备注的情况
    return remark ? `${base}：${remark}` : base
  },

  // 格式化时间
  formatTime(time) {
    return util.formatRelativeTime(time)
  }
})
