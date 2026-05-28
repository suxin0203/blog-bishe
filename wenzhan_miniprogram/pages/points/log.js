// pages/points/log.js
const api = require('../../api/index.js')
const util = require('../../utils/util.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    logs: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad() {
    if (!auth.requireLogin()) {
      return
    }
    this.loadLogs(true)
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.loadLogs(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreLogs()
    }
  },

  // 加载积分流水
  async loadLogs(reset = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const page = reset ? 1 : this.data.page
      const res = await api.points.getLog({
        page,
        pageSize: this.data.pageSize
      })

      const logList = res.list || res || []
      
      // 处理积分流水，添加格式化后的文本
      const logs = logList.map(item => {
        return {
          ...item,
          reasonText: this.parseReason(item)
        }
      })
      
      const hasMore = logs.length >= this.data.pageSize

      this.setData({
        logs: reset ? logs : [...this.data.logs, ...logs],
        page: page,
        hasMore,
        loading: false
      })
    } catch (error) {
      console.error('加载积分流水失败', error)
      this.setData({ loading: false })
    }
  },

  // 加载更多
  loadMoreLogs() {
    this.setData({
      page: this.data.page + 1
    })
    this.loadLogs()
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
    return util.formatTime(time, 'YYYY-MM-DD HH:mm')
  }
})
