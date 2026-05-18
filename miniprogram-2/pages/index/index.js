// pages/index/index.js
const api = require('../../api/index.js')
const util = require('../../utils/util.js')

Page({
  data: {
    // 轮播图
    swiperList: [],
    // 热门文章
    hotArticles: [],
    // 最新文章
    articles: [],
    // 分类和标签
    categories: [],
    tags: [],
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    // 加载状态
    loading: false,
    refreshing: false,
    // 全局配置
    carouselNotice: '',
    carouselNoticeContent: ''
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    // 每次显示时刷新用户信息
    if (getApp().isLoggedIn()) {
      this.loadUserInfo()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      refreshing: true
    })
    this.loadData().then(() => {
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

  // 加载数据
  async loadData() {
    try {
      // 使用 Promise.allSettled 并发加载，即使某个失败也不影响其他
      const results = await Promise.allSettled([
        this.loadSwiper(),
        this.loadHotArticles(),
        this.loadArticles(true),
        this.loadCategories(),
        this.loadTags(),
        this.loadGlobalConfig()
      ])
      
      // 检查是否有失败的请求
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const names = ['轮播图', '热门文章', '文章列表', '分类', '标签', '全局配置']
          console.error(`${names[index]}加载失败:`, result.reason)
        }
      })
    } catch (error) {
      console.error('加载数据失败', error)
    }
  },

  // 加载轮播图
  async loadSwiper() {
    try {
      const res = await api.swiper.getList()
      // 转换图片 URL
      const swiperList = util.convertArrayImageUrls(res || [], ['image_url'])
      this.setData({
        swiperList
      })
    } catch (error) {
      console.error('加载轮播图失败', error)
      // 轮播图加载失败不影响其他功能，静默处理
      this.setData({
        swiperList: []
      })
    }
  },

  // 加载热门文章
  async loadHotArticles() {
    try {
      const res = await api.article.getTop({ limit: 5 })
      // 转换图片 URL
      const hotArticles = util.convertArrayImageUrls(res || [], ['cover_image'])
      this.setData({
        hotArticles
      })
    } catch (error) {
      console.error('加载热门文章失败', error)
    }
  },

  // 加载文章列表
  async loadArticles(reset = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const page = reset ? 1 : this.data.page
      const res = await api.article.getList({
        page,
        pageSize: this.data.pageSize
      })

      const articles = res.list || res || []
      // 转换图片 URL
      const convertedArticles = util.convertArrayImageUrls(articles, ['cover_image'])
      const hasMore = articles.length >= this.data.pageSize

      this.setData({
        articles: reset ? convertedArticles : [...this.data.articles, ...convertedArticles],
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

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = await api.user.getMe()
      getApp().saveUserData({ userInfo })
    } catch (error) {
      console.error('加载用户信息失败', error)
    }
  },

  // 加载分类
  async loadCategories() {
    try {
      const categories = await api.category.getList()
      this.setData({
        categories: (categories || []).slice(0, 8) // 只显示前8个
      })
    } catch (error) {
      console.error('加载分类失败', error)
    }
  },

  // 加载标签
  async loadTags() {
    try {
      const tags = await api.tag.getList()
      this.setData({
        tags: (tags || []).slice(0, 10) // 只显示前10个
      })
    } catch (error) {
      console.error('加载标签失败', error)
    }
  },

  // 加载全局配置
  async loadGlobalConfig() {
    try {
      const config = await api.system.getConfig()
      const carouselNotice = config.find(item => item.key === 'carousel_notice')
      const carouselNoticeContent = config.find(item => item.key === 'carousel_noticecontent')
      
      this.setData({
        carouselNotice: carouselNotice?.value || '欢迎来到文栈博客',
        carouselNoticeContent: carouselNoticeContent?.value || '分享技术，记录生活'
      })
    } catch (error) {
      console.error('加载全局配置失败', error)
    }
  },

  // 跳转到搜索页
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/index'
    })
  },

  // 跳转到文章详情
  goToArticle(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/article/detail?id=${id}`
    })
  },

  // 跳转到文章列表
  goToArticleList(e) {
    const { type, id, name } = e.currentTarget.dataset
    let url = '/pages/article/list'
    
    if (type === 'category') {
      url += `?type=category&categoryId=${id}&categoryName=${name}`
    } else if (type === 'tag') {
      url += `?type=tag&tagId=${id}&tagName=${name}`
    }
    
    wx.navigateTo({ url })
  },

  // 查看所有分类
  goToAllCategories() {
    wx.navigateTo({
      url: '/pages/category/index'
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
      title: '文栈博客 - 技术分享平台',
      path: '/pages/index/index'
    })
  }
})
