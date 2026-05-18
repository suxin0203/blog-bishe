// 工具函数

/**
 * 格式化时间
 * @param {Date|String|Number} date 日期
 * @param {String} format 格式
 * @returns {String}
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

/**
 * 格式化相对时间
 * @param {Date|String|Number} date 日期
 * @returns {String}
 */
function formatRelativeTime(date) {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const now = new Date()
  const diff = now - d
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return formatTime(date, 'YYYY-MM-DD')
  }
}

/**
 * 格式化数字（添加千分位）
 * @param {Number} num 数字
 * @returns {String}
 */
function formatNumber(num) {
  if (num === null || num === undefined) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化阅读量
 * @param {Number} count 阅读量
 * @returns {String}
 */
function formatReadCount(count) {
  if (!count || count < 1000) return count || 0
  if (count < 10000) return (count / 1000).toFixed(1) + 'k'
  return (count / 10000).toFixed(1) + 'w'
}

/**
 * 转换图片 URL
 * 将后端返回的 localhost 地址转换为实际域名
 * @param {String} url 图片 URL
 * @returns {String}
 */
function convertImageUrl(url) {
  if (!url) return ''
  
  // 如果是 localhost 或本地地址，替换为实际域名
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return url.replace(/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://wzapi.suxin23.cn')
  }
  
  // 如果是 HTTP 协议，转换为 HTTPS
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://')
  }
  
  // 如果是相对路径，拼接完整域名
  if (url.startsWith('/')) {
    return 'https://wzapi.suxin23.cn' + url
  }
  
  return url
}

/**
 * 批量转换对象中的图片 URL
 * @param {Object} obj 对象
 * @param {Array} fields 需要转换的字段名数组
 * @returns {Object}
 */
function convertObjectImageUrls(obj, fields = ['image_url', 'cover_image', 'avatar', 'image']) {
  if (!obj) return obj
  
  const result = { ...obj }
  
  fields.forEach(field => {
    if (result[field]) {
      result[field] = convertImageUrl(result[field])
    }
  })
  
  return result
}

/**
 * 批量转换数组中的图片 URL
 * @param {Array} arr 数组
 * @param {Array} fields 需要转换的字段名数组
 * @returns {Array}
 */
function convertArrayImageUrls(arr, fields = ['image_url', 'cover_image', 'avatar', 'image']) {
  if (!Array.isArray(arr)) return arr
  
  return arr.map(item => convertObjectImageUrls(item, fields))
}

/**
 * 解析积分 reason
 * @param {String} reason 积分变动原因
 * @returns {String}
 */
function parsePointsReason(reason) {
  if (!reason) return '未知'

  // 每日登录
  if (reason === 'daily_login') {
    return '每日登录'
  }

  // 文章获赞
  if (reason.startsWith('article_liked:')) {
    const parts = reason.split(':')
    const title = parts[2] || '文章'
    return `文章获赞《${title}》`
  }

  // 文章取消获赞
  if (reason.startsWith('article_unliked:')) {
    const parts = reason.split(':')
    const title = parts[2] || '文章'
    return `文章取消获赞《${title}》`
  }

  // 发布文章
  if (reason.startsWith('article_publish:')) {
    const parts = reason.split(':')
    const title = parts[2] || '文章'
    return `发布文章《${title}》`
  }

  // 删除文章
  if (reason.startsWith('article_delete:')) {
    const parts = reason.split(':')
    const title = parts[2] || '文章'
    return `删除文章《${title}》`
  }

  // 评论审核通过
  if (reason.startsWith('comment_approved:')) {
    const parts = reason.split(':')
    const title = parts[2] || '文章'
    return `评论审核通过《${title}》`
  }

  // 删除已通过评论
  if (reason.startsWith('comment_removed:')) {
    const parts = reason.split(':')
    const title = parts[2] || '文章'
    return `删除已通过评论《${title}》`
  }

  // 积分兑换
  if (reason === 'redeem_goods') {
    return '积分兑换'
  }

  // 退款
  if (reason === 'refund') {
    return '退款'
  }

  // 管理员调整
  if (reason.startsWith('admin_adjust:')) {
    const note = reason.substring(13)
    return `管理员调整：${note}`
  }

  // 旧版兼容
  if (reason === 'comment') {
    return '评论'
  }
  if (reason === 'like') {
    return '点赞'
  }
  if (reason === 'like_cancel') {
    return '取消点赞'
  }

  return reason
}

/**
 * 防抖函数
 * @param {Function} fn 函数
 * @param {Number} delay 延迟时间
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn 函数
 * @param {Number} delay 延迟时间
 * @returns {Function}
 */
function throttle(fn, delay = 300) {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 深拷贝
 * @param {*} obj 对象
 * @returns {*}
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  
  const cloneObj = {}
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloneObj[key] = deepClone(obj[key])
    }
  }
  return cloneObj
}

/**
 * 图片预览
 * @param {String} current 当前图片
 * @param {Array} urls 图片列表
 */
function previewImage(current, urls = []) {
  // 转换图片 URL
  const convertedCurrent = convertImageUrl(current)
  const convertedUrls = urls.length > 0 ? urls.map(url => convertImageUrl(url)) : [convertedCurrent]
  
  wx.previewImage({
    current: convertedCurrent,
    urls: convertedUrls
  })
}

/**
 * 复制到剪贴板
 * @param {String} data 数据
 */
function copyToClipboard(data) {
  wx.setClipboardData({
    data: String(data),
    success: () => {
      wx.showToast({
        title: '已复制',
        icon: 'success'
      })
    }
  })
}

/**
 * 分享配置
 * @param {Object} options 分享配置
 * @returns {Object}
 */
function getShareConfig(options = {}) {
  return {
    title: options.title || '文栈博客',
    path: options.path || '/pages/index/index',
    imageUrl: options.imageUrl ? convertImageUrl(options.imageUrl) : ''
  }
}

module.exports = {
  formatTime,
  formatRelativeTime,
  formatNumber,
  formatReadCount,
  convertImageUrl,
  convertObjectImageUrls,
  convertArrayImageUrls,
  parsePointsReason,
  debounce,
  throttle,
  deepClone,
  previewImage,
  copyToClipboard,
  getShareConfig
}
