// 请求封装
const config = require('./config.js')
const app = getApp()

// 是否正在刷新 token
let isRefreshing = false
// 等待刷新的请求队列
let requestQueue = []

/**
 * 封装的请求方法
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      data = {},
      header = {},
      needAuth = false,
      showLoading = false,
      loadingText = '加载中...',
      timeout = config.timeout
    } = options

    // 显示加载提示
    if (showLoading) {
      wx.showLoading({
        title: loadingText,
        mask: true
      })
    }

    // 构建完整 URL
    const fullUrl = url.startsWith('http') ? url : config.baseURL + url

    // 构建请求头
    const requestHeader = {
      'Content-Type': 'application/json',
      ...header
    }

    // 添加 Token
    if (needAuth && app.globalData.token) {
      requestHeader['Authorization'] = `Bearer ${app.globalData.token}`
    }

    // 添加时间戳防重放
    if (config.enableTimestamp) {
      requestHeader['X-Request-Time'] = Date.now().toString()
    }

    // 发起请求
    wx.request({
      url: fullUrl,
      method,
      data,
      header: requestHeader,
      timeout,
      success: (res) => {
        if (showLoading) {
          wx.hideLoading()
        }

        // 处理响应
        if (res.statusCode === 200) {
          const responseData = res.data
          
          // 后端返回格式多样，统一处理
          // 1. 标准格式：{ code: 200, data, message }
          if (responseData.code === 200) {
            // 如果有 token，返回完整响应
            if (responseData.token) {
              resolve(responseData)
            } else {
              resolve(responseData.data !== undefined ? responseData.data : responseData)
            }
          }
          // 2. 失败：{ code: 0, message }（微信登录用户不存在）
          else if (responseData.code === 0) {
            console.log('业务失败:', responseData.message)
            reject(responseData)
          }
          // 3. 无 code 字段，直接返回 data：{ data, message, pagination }
          else if (!responseData.code && responseData.data !== undefined) {
            // 如果有 pagination，返回完整对象
            if (responseData.pagination) {
              resolve({
                list: responseData.data,
                total: responseData.pagination.total,
                page: responseData.pagination.page,
                pageSize: responseData.pagination.pageSize
              })
            } else {
              resolve(responseData.data)
            }
          }
          // 4. 只有 data 字段
          else if (responseData.data && Object.keys(responseData).length === 1) {
            resolve(responseData.data)
          }
          // 5. 未知格式
          else {
            console.error('未知响应格式:', responseData)
            reject(responseData)
          }
        } else if (res.statusCode === 401) {
          // Token 过期，尝试刷新（有 refreshToken 就进队列等刷新结果，不再直接踢回登录页）
          if (needAuth && app.globalData.refreshToken) {
            handleTokenExpired(options).then(resolve).catch(reject)
          } else {
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none',
              duration: 2000
            })
            // 跳转到登录页
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/auth/login'
              })
            }, 2000)
            reject(res.data)
          }
        } else if (res.statusCode === 403) {
          wx.showToast({
            title: '没有权限访问',
            icon: 'none',
            duration: 2000
          })
          reject(res.data)
        } else {
          wx.showToast({
            title: res.data.message || '请求失败',
            icon: 'none',
            duration: 2000
          })
          reject(res.data)
        }
      },
      fail: (err) => {
        if (showLoading) {
          wx.hideLoading()
        }
        
        const errorMessage = err && err.errMsg ? err.errMsg : String(err || '')
        const isTimeout = errorMessage.includes('timeout')
        const isNetworkFail = errorMessage.includes('fail')
        const normalizedError = {
          ...err,
          url: fullUrl,
          method,
          message: isTimeout ? '请求超时，请检查网络后重试' : (isNetworkFail ? '网络请求失败，请检查网络连接' : '网络异常，请稍后重试')
        }

        console.error('请求失败:', normalizedError.message)
        console.error('请求 URL:', fullUrl)
        console.error('请求方法:', method)
        console.error('错误信息:', errorMessage)
        
        reject(normalizedError)
      }
    })
  })
}

/**
 * 处理 Token 过期
 */
function handleTokenExpired(originalRequest) {
  return new Promise((resolve, reject) => {
    // 将请求加入队列
    requestQueue.push({ resolve, reject, request: originalRequest })

    if (!isRefreshing) {
      isRefreshing = true

      // 调用刷新 Token 接口
      wx.request({
        url: config.baseURL + '/users/refresh',
        method: 'POST',
        data: {
          refreshToken: app.globalData.refreshToken
        },
        header: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
          // 后端 /users/refresh 成功返回 { code: 200, token, data: userInfo }（不返回新 refreshToken，沿用旧的）
          if (res.statusCode === 200 && res.data.code === 200 && res.data.token) {
            // 保存新的 Token（refreshToken 不轮换，保留原值）
            const { token } = res.data
            app.saveUserData({ token, userInfo: res.data.data })

            // 重新发起队列中的请求
            requestQueue.forEach(item => {
              request(item.request).then(item.resolve).catch(item.reject)
            })
            requestQueue = []
          } else {
            // 刷新失败，清除登录态
            app.clearUserData()
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none',
              duration: 2000
            })
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/auth/login'
              })
            }, 2000)

            // 拒绝队列中的请求
            requestQueue.forEach(item => {
              item.reject(res.data)
            })
            requestQueue = []
          }
        },
        fail: (err) => {
          // 刷新失败
          app.clearUserData()
          requestQueue.forEach(item => {
            item.reject(err)
          })
          requestQueue = []
        },
        complete: () => {
          isRefreshing = false
        }
      })
    }
  })
}

/**
 * GET 请求
 */
function get(url, data = {}, options = {}) {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  })
}

/**
 * POST 请求
 */
function post(url, data = {}, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT 请求
 */
function put(url, data = {}, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE 请求
 */
function del(url, data = {}, options = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

module.exports = {
  request,
  get,
  post,
  put,
  del
}
