// pages/points/goods-detail.js
const api = require('../../api/index.js')
const util = require('../../utils/util.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    id: null,
    goods: null,
    userInfo: null,
    quantity: 1,
    loading: true,
    // 收货信息（实物商品需要）
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    userRemark: '',
    showAddressForm: false
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({
        title: '商品不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({ id })
    
    if (!auth.requireLogin()) {
      return
    }

    this.loadData()
  },

  // 加载数据
  async loadData() {
    try {
      const [goods, userInfo] = await Promise.all([
        api.points.getGoodsDetail(this.data.id),
        api.user.getMe()
      ])

      // 转换图片 URL
      const convertedGoods = util.convertObjectImageUrls(goods, ['image_url'])

      this.setData({
        goods: convertedGoods,
        userInfo,
        loading: false
      })
    } catch (error) {
      console.error('加载数据失败', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 数量减少
  decreaseQuantity() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      })
    }
  },

  // 数量增加
  increaseQuantity() {
    const { goods, quantity } = this.data
    
    // 检查库存
    if (goods.stock !== null && quantity >= goods.stock) {
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      })
      return
    }

    this.setData({
      quantity: quantity + 1
    })
  },

  // 输入数量
  onQuantityInput(e) {
    const value = parseInt(e.detail.value) || 1
    const { goods } = this.data
    
    if (value < 1) {
      this.setData({ quantity: 1 })
      return
    }

    if (goods.stock !== null && value > goods.stock) {
      wx.showToast({
        title: '超出库存',
        icon: 'none'
      })
      this.setData({ quantity: goods.stock })
      return
    }

    this.setData({ quantity: value })
  },

  // 收货信息输入
  onReceiverNameInput(e) {
    this.setData({ receiverName: e.detail.value })
  },

  onReceiverPhoneInput(e) {
    this.setData({ receiverPhone: e.detail.value })
  },

  onReceiverAddressInput(e) {
    this.setData({ receiverAddress: e.detail.value })
  },

  onUserRemarkInput(e) {
    this.setData({ userRemark: e.detail.value })
  },

  // 立即兑换
  handleRedeem() {
    const { goods, userInfo, quantity } = this.data

    // 检查库存
    if (goods.stock !== null && goods.stock < quantity) {
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      })
      return
    }

    // 计算总积分
    const totalPoints = goods.points_cost * quantity

    // 检查积分是否足够
    if (userInfo.points < totalPoints) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      })
      return
    }

    // 如果是实物商品，需要填写收货信息
    if (goods.type === 'physical') {
      this.setData({ showAddressForm: true })
    } else {
      // 虚拟商品或称号直接兑换
      this.confirmRedeem()
    }
  },

  // 取消填写地址
  cancelAddress() {
    this.setData({ showAddressForm: false })
  },

  // 确认兑换
  async confirmRedeem() {
    const { goods, quantity, receiverName, receiverPhone, receiverAddress, userRemark } = this.data

    // 实物商品验证收货信息
    if (goods.type === 'physical') {
      if (!receiverName || !receiverPhone || !receiverAddress) {
        wx.showToast({
          title: '请填写完整收货信息',
          icon: 'none'
        })
        return
      }

      // 验证手机号
      if (!/^1[3-9]\d{9}$/.test(receiverPhone)) {
        wx.showToast({
          title: '手机号格式不正确',
          icon: 'none'
        })
        return
      }
    }

    // 二次确认
    const totalPoints = goods.points_cost * quantity
    const confirmRes = await new Promise(resolve => {
      wx.showModal({
        title: '确认兑换',
        content: `将消耗 ${totalPoints} 积分兑换 ${quantity} 个「${goods.name}」`,
        success: res => resolve(res.confirm)
      })
    })

    if (!confirmRes) return

    // 显示加载
    wx.showLoading({
      title: '兑换中...',
      mask: true
    })

    try {
      const orderData = {
        goods_id: this.data.id,
        quantity
      }

      // 实物商品添加收货信息
      if (goods.type === 'physical') {
        orderData.receiver_name = receiverName
        orderData.receiver_phone = receiverPhone
        orderData.receiver_address = receiverAddress
      }

      // 添加备注
      if (userRemark) {
        orderData.user_remark = userRemark
      }

      const result = await api.points.createOrder(orderData)

      wx.hideLoading()

      // 兑换成功
      wx.showToast({
        title: result.completed ? '兑换成功，称号已生效' : '兑换成功',
        icon: 'success',
        duration: 2000
      })

      // 延迟跳转
      setTimeout(() => {
        // 跳转到订单列表
        wx.redirectTo({
          url: '/pages/points/orders'
        })
      }, 2000)

    } catch (error) {
      wx.hideLoading()
      console.error('兑换失败', error)
      wx.showToast({
        title: error.message || '兑换失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 图片预览
  previewImage() {
    if (this.data.goods && this.data.goods.image_url) {
      util.previewImage(this.data.goods.image_url)
    }
  },

  // 格式化商品类型
  formatGoodsType(type) {
    const typeMap = {
      'physical': '实物商品',
      'virtual': '虚拟商品',
      'title': '称号'
    }
    return typeMap[type] || type
  },

  // 格式化库存
  formatStock(stock) {
    if (stock === null || stock === undefined) {
      return '不限'
    }
    return stock
  }
})
