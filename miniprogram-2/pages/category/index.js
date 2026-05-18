// pages/category/index.js
const api = require('../../api/index.js')

Page({
  data: {
    categories: [],
    tags: [],
    activeTab: 0, // 0: 分类, 1: 标签
    loading: true
  },

  onLoad() {
    this.loadData()
  },

  // 加载数据
  async loadData() {
    try {
      const [categories, tags] = await Promise.all([
        api.category.getList(),
        api.tag.getList()
      ])

      this.setData({
        categories: categories || [],
        tags: tags || [],
        loading: false
      })
    } catch (error) {
      console.error('加载数据失败', error)
      this.setData({ loading: false })
    }
  },

  // 切换标签页
  switchTab(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      activeTab: index
    })
  },

  // 跳转到分类文章列表
  goToCategoryArticles(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/article/list?type=category&categoryId=${id}&categoryName=${name}`
    })
  },

  // 跳转到标签文章列表
  goToTagArticles(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/article/list?type=tag&tagId=${id}&tagName=${name}`
    })
  }
})
