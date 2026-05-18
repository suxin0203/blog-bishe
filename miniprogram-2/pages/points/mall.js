// pages/points/mall.js
const api = require('../../api/index.js')
const util = require('../../utils/util.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    goodsList: [],
    userInfo: null,
    activeTab: 'all', // all, physical, virtual, title
    loading: true,
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad() {
    if (!auth.requireLogin()) {
      return
    }
    this.loadData()
  },

  onShow() {
    // 每次显示时刷新用户信息
    if (auth.isLoggedIn()) {
      this.loadUserInfo()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreGoods()
    }
  },

  // 加载数据
  async loadData() {
    try {
      const [userInfo] = await Promise.all([
        api.user.getMe(),
        this.loadGoods(true)
      ])

      this.setData({
        userInfo,
        loading: false
      })
    } catch (error) {
      console.error('加载数据失败', error)
      this.setData({ loading: false })
    }
  },

  // 加载商品列表
  async loadGoods(reset = false) {
    if (this.data.loading && !reset) return

    this.setData({ loading: true })

    try {
      const page = reset ? 1 : this.data.page
      const params = {
        page,
        pageSize: this.data.pageSize
      }

      // 根据分类筛选（使用后端的 type 字段）
      if (this.data.activeTab !== 'all') {
        params.type = this.data.activeTab
      }

      const res = await api.points.getGoodsList(params)
      const goodsList = res.list || res || []
      
      // 转换图片 URL
      const convertedGoods = util.convertArrayImageUrls(goodsList, ['image_url'])
      const hasMore = goodsList.length >= this.data.pageSize

      this.setData({
        goodsList: reset ? convertedGoods : [...this.data.goodsList, ...convertedGoods],
        page: page,
        hasMore,
        loading: false
      })
    } catch (error) {
      console.error('加载商品列表失败', error)
      this.setData({ loading: false })
    }
  },

  // 加载更多
  loadMoreGoods() {
    this.setData({
      page: this.data.page + 1
    })
    this.loadGoods()
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = await api.user.getMe()
      this.setData({ userInfo })
      getApp().saveUserData({ userInfo })
    } catch (error) {
      console.error('加载用户信息失败', error)
    }
  },

  // 切换分类
  switchTab(e) {
    const { type } = e.currentTarget.dataset
    if (type === this.data.activeTab) return

    this.setData({
      activeTab: type,
      page: 1,
      hasMore: true
    })
    this.loadGoods(true)
  },

  // 跳转到商品详情
  goToGoodsDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/points/goods-detail?id=${id}`
    })
  },

  // 跳转到我的订单
  goToOrders() {
    wx.navigateTo({
      url: '/pages/points/orders'
    })
  },

  // 格式化商品类型
  formatGoodsType(type) {
    const typeMap = {
      'physical': '实物',
      'virtual': '虚拟',
      'title': '称号'
    }
    return typeMap[type] || type
  },

  // 格式化库存
  formatStock(stock) {
    if (stock === null || stock === undefined) {
      return '不限'
    }
    if (stock === 0) {
      return '已售罄'
    }
    return `剩余 ${stock}`
  }
})
