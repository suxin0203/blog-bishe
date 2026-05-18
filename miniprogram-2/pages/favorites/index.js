// pages/favorites/index.js
const api = require('../../api/index.js')
const util = require('../../utils/util.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    articles: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    if (!auth.requireLogin()) {
      return
    }
    this.loadFavorites(true)
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.loadFavorites(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreFavorites()
    }
  },

  // 加载收藏列表
  async loadFavorites(reset = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const page = reset ? 1 : this.data.page
      const res = await api.favorite.getMyList({
        page,
        pageSize: this.data.pageSize
      })

      const articles = res.list || res || []
      const hasMore = articles.length >= this.data.pageSize

      this.setData({
        articles: reset ? articles : [...this.data.articles, ...articles],
        page: page,
        hasMore,
        loading: false
      })
    } catch (error) {
      console.error('加载收藏列表失败', error)
      this.setData({ loading: false })
    }
  },

  // 加载更多
  loadMoreFavorites() {
    this.setData({
      page: this.data.page + 1
    })
    this.loadFavorites()
  },

  // 跳转到文章详情
  goToArticle(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/article/detail?id=${id}`
    })
  },

  // 格式化时间
  formatTime(time) {
    return util.formatRelativeTime(time)
  }
})
