// pages/about/index.js
Page({
  data: {
    appInfo: {
      name: '文栈博客',
      version: 'v1.0.0',
      description: '基于微信小程序的技术博客平台',
      logo: '📚'
    },
    features: [
      { icon: '📖', title: '文章阅读', desc: '浏览最新技术文章' },
      { icon: '🔍', title: '智能搜索', desc: '快速找到想要的内容' },
      { icon: '💬', title: '评论互动', desc: '与作者和读者交流' },
      { icon: '⭐', title: '收藏点赞', desc: '收藏喜欢的文章' },
      { icon: '🎁', title: '积分系统', desc: '获取积分兑换奖励' },
      { icon: '🛒', title: '积分商城', desc: '兑换实物和虚拟商品' }
    ],
    contact: {
      website: 'https://wzapi.suxin23.cn',
      email: 'support@example.com',
      github: 'https://github.com/yourusername'
    },
    updateLog: [
      { version: 'v1.0.0', date: '2026-05-14', items: ['首次发布', '完整功能上线'] }
    ]
  },

  // 复制文本
  copyText(e) {
    const { text } = e.currentTarget.dataset
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        })
      }
    })
  },

  // 打开网页
  openWebsite(e) {
    const { url } = e.currentTarget.dataset
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        })
      }
    })
  }
})
