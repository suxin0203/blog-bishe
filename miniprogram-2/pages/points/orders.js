// pages/points/orders.js
const api = require('../../api/index.js')
const util = require('../../utils/util.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    orders: [],
    activeTab: 'all', // all, pending, shipped, completed
    loading: true,
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad() {
    if (!auth.requireLogin()) {
      return
    }
    this.loadOrders(true)
  },

  onShow() {
    // 每次显示时刷新订单列表
    if (auth.isLoggedIn()) {
      this.loadOrders(true)
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.loadOrders(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreOrders()
    }
  },

  // 加载订单列表
  async loadOrders(reset = false) {
    if (this.data.loading && !reset) return

    this.setData({ loading: true })

    try {
      const page = reset ? 1 : this.data.page
      const params = {
        page,
        pageSize: this.data.pageSize
      }

      // 根据状态筛选
      if (this.data.activeTab !== 'all') {
        params.status = this.data.activeTab
      }

      const res = await api.points.getOrderList(params)
      const orders = res.list || res || []
      
      // 转换图片 URL
      const convertedOrders = orders.map(order => ({
        ...order,
        goods_image_url: util.convertImageUrl(order.goods_image_url)
      }))
      
      const hasMore = orders.length >= this.data.pageSize

      this.setData({
        orders: reset ? convertedOrders : [...this.data.orders, ...convertedOrders],
        page: page,
        hasMore,
        loading: false
      })
    } catch (error) {
      console.error('加载订单列表失败', error)
      this.setData({ loading: false })
    }
  },

  // 加载更多
  loadMoreOrders() {
    this.setData({
      page: this.data.page + 1
    })
    this.loadOrders()
  },

  // 切换状态
  switchTab(e) {
    const { status } = e.currentTarget.dataset
    if (status === this.data.activeTab) return

    this.setData({
      activeTab: status,
      page: 1,
      hasMore: true
    })
    this.loadOrders(true)
  },

  // 跳转到订单详情
  goToOrderDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/points/order-detail?id=${id}`
    })
  },

  // 格式化订单状态
  formatOrderStatus(status) {
    const statusMap = {
      'pending': '待发货',
      'shipped': '已发货',
      'completed': '已完成',
      'cancelled': '已取消'
    }
    return statusMap[status] || status
  },

  // 获取状态样式类
  getStatusClass(status) {
    const classMap = {
      'pending': 'status-pending',
      'shipped': 'status-shipped',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    }
    return classMap[status] || ''
  },

  // 格式化时间
  formatTime(time) {
    return util.formatTime(time, 'YYYY-MM-DD HH:mm')
  }
})
