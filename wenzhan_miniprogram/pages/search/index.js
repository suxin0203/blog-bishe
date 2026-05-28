// pages/search/index.js
const api = require('../../api/index.js')
const util = require('../../utils/util.js')

Page({
  data: {
    keyword: '',
    searchHistory: [],
    hotKeywords: ['Vue', 'React', 'Node.js', '微信小程序', 'TypeScript'],
    searchResults: [],
    searching: false,
    searched: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    // 状态栏高度
    statusBarHeight: 0,
    // 导航栏高度
    navBarHeight: 44
  },

  onLoad() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    })

    // 加载搜索历史
    this.loadSearchHistory()
  },

  // 加载搜索历史
  loadSearchHistory() {
    try {
      const history = wx.getStorageSync('searchHistory') || []
      this.setData({
        searchHistory: history.slice(0, 10) // 最多显示10条
      })
    } catch (error) {
      console.error('加载搜索历史失败', error)
    }
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    try {
      let history = wx.getStorageSync('searchHistory') || []
      
      // 移除重复项
      history = history.filter(item => item !== keyword)
      
      // 添加到开头
      history.unshift(keyword)
      
      // 最多保存20条
      history = history.slice(0, 20)
      
      wx.setStorageSync('searchHistory', history)
      
      this.setData({
        searchHistory: history.slice(0, 10)
      })
    } catch (error) {
      console.error('保存搜索历史失败', error)
    }
  },

  // 清空搜索历史
  clearSearchHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('searchHistory')
            this.setData({
              searchHistory: []
            })
            wx.showToast({
              title: '已清空',
              icon: 'success'
            })
          } catch (error) {
            console.error('清空搜索历史失败', error)
          }
        }
      }
    })
  },

  // 输入关键词
  onKeywordInput(e) {
    this.setData({
      keyword: e.detail.value
    })
  },

  // 点击搜索
  handleSearch() {
    const keyword = this.data.keyword.trim()
    
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      })
      return
    }

    this.performSearch(keyword)
  },

  // 点击历史记录或热门搜索
  selectKeyword(e) {
    const { keyword } = e.currentTarget.dataset
    this.setData({
      keyword
    })
    this.performSearch(keyword)
  },

  // 执行搜索
  async performSearch(keyword) {
    // 保存搜索历史
    this.saveSearchHistory(keyword)

    this.setData({
      searching: true,
      searched: false,
      page: 1,
      hasMore: true
    })

    try {
      const res = await api.article.getList({
        keyword,
        page: 1,
        pageSize: this.data.pageSize
      })

      const articles = res.list || res || []
      const convertedArticles = util.convertArrayImageUrls(articles, ['cover_image'])
      const hasMore = articles.length >= this.data.pageSize

      this.setData({
        searchResults: convertedArticles,
        searching: false,
        searched: true,
        hasMore
      })
    } catch (error) {
      console.error('搜索失败', error)
      this.setData({
        searching: false,
        searched: true
      })
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      })
    }
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.searching && this.data.searched) {
      this.loadMoreResults()
    }
  },

  // 加载更多结果
  async loadMoreResults() {
    this.setData({
      searching: true,
      page: this.data.page + 1
    })

    try {
      const res = await api.article.getList({
        keyword: this.data.keyword,
        page: this.data.page,
        pageSize: this.data.pageSize
      })

      const articles = res.list || res || []
      const convertedArticles = util.convertArrayImageUrls(articles, ['cover_image'])
      const hasMore = articles.length >= this.data.pageSize

      this.setData({
        searchResults: [...this.data.searchResults, ...convertedArticles],
        searching: false,
        hasMore
      })
    } catch (error) {
      console.error('加载更多失败', error)
      this.setData({
        searching: false
      })
    }
  },

  // 清空输入
  clearInput() {
    this.setData({
      keyword: '',
      searchResults: [],
      searched: false
    })
  },

  // 返回
  goBack() {
    wx.navigateBack()
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
  }
})
