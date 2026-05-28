// pages/article/list.js
const api = require('../../api/index.js')
const util = require('../../utils/util.js')

Page({
  data: {
    // 筛选类型
    type: 'all', // all, category, tag, search
    categoryId: null,
    categoryName: '',
    tagId: null,
    tagName: '',
    keyword: '',
    
    // 文章列表
    articles: [],
    
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    
    // 加载状态
    loading: false,
    refreshing: false
  },

  onLoad(options) {
    const { type, categoryId, categoryName, tagId, tagName, keyword } = options
    
    this.setData({
      type: type || 'all',
      categoryId: categoryId || null,
      categoryName: categoryName || '',
      tagId: tagId || null,
      tagName: tagName || '',
      keyword: keyword || ''
    })

    // 设置标题
    this.setNavigationBarTitle()
    
    // 加载数据
    this.loadArticles(true)
  },

  // 设置导航栏标题
  setNavigationBarTitle() {
    let title = '文章列表'
    
    if (this.data.type === 'category' && this.data.categoryName) {
      title = this.data.categoryName
    } else if (this.data.type === 'tag' && this.data.tagName) {
      title = `#${this.data.tagName}`
    } else if (this.data.type === 'search') {
      title = '搜索结果'
    }
    
    wx.setNavigationBarTitle({ title })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      refreshing: true
    })
    this.loadArticles(true).then(() => {
      wx.stopPullDownRefresh()
      this.setData({ refreshing: false })
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreArticles()
    }
  },

  // 加载文章列表
  async loadArticles(reset = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const page = reset ? 1 : this.data.page
      const params = {
        page,
        pageSize: this.data.pageSize
      }

      // 根据类型添加筛选参数
      if (this.data.type === 'category' && this.data.categoryId) {
        params.category_id = this.data.categoryId
      } else if (this.data.type === 'tag' && this.data.tagId) {
        params.tag_id = this.data.tagId
      } else if (this.data.type === 'search' && this.data.keyword) {
        params.keyword = this.data.keyword
      }

      const res = await api.article.getList(params)
      const articles = res.list || res || []
      const hasMore = articles.length >= this.data.pageSize

      this.setData({
        articles: reset ? articles : [...this.data.articles, ...articles],
        page: page,
        hasMore,
        loading: false
      })
    } catch (error) {
      console.error('加载文章列表失败', error)
      this.setData({ loading: false })
    }
  },

  // 加载更多文章
  loadMoreArticles() {
    this.setData({
      page: this.data.page + 1
    })
    this.loadArticles()
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
  },

  // 格式化阅读量
  formatReadCount(count) {
    return util.formatReadCount(count)
  },

  // 分享配置
  onShareAppMessage() {
    return util.getShareConfig({
      title: '文栈博客 - 文章列表',
      path: '/pages/article/list'
    })
  }
})
