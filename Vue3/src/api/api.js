// 遵循restful风格
import request from './request';

// 获取文章列表（前台用，不鉴权；返回 data: { list, pagination }）
export function getArticleList(data) {
  return request({
    url: '/articles',
    method: 'get',
    params: data,
  })
}

// 时间归档：按年-月聚合，返回 data 为 [{ year, month, count }]
export function getArticleArchive() {
  return request({
    url: '/articles/archive',
    method: 'get',
  })
}

// 排行榜：阅读/点赞/收藏 Top N，用于详情页侧栏
export function getArticleTop(params = {}) {
  return request({
    url: '/articles/top',
    method: 'get',
    params: { limit: 5, ...params },
  })
}

// 后台文章列表（需登录；编辑仅看自己，管理员看全部）
export function getArticleListForDashboard(data) {
  return request({
    url: '/articles/token/list',
    method: 'get',
    params: data,
  })
}
// 获取文章详情（对接 Express：GET /articles/:id，返回 data: [article]；可选 params.incrementView=1 与 source=internal|external 用于流量统计）
export function getArticleDetail(id, options = {}) {
  const params = {};
  if (options.incrementView) params.incrementView = '1';
  if (options.source) params.source = options.source;
  return request({
    url: `/articles/${id}`,
    method: 'get',
    params: Object.keys(params).length ? params : undefined,
  })
}
// 获取分类列表（对接 Express：GET /categories，返回 data 为数组）
export function getCategoryList() {
  return request({
    url: '/categories',
    method: 'get',
  })
}

// 验证码（后端生成，用于登录/注册）
export function getCaptcha() {
  return request({
    url: '/users/captcha',
    method: 'get',
  })
}

// 创建 PC 扫码登录会话，返回 sceneId + expiresAt + miniProgramCode
export function createQrLoginSession(data) {
  return request({
    url: '/qr-login/session',
    method: 'post',
    data: data || { channel: 'pc' },
    // 生成小程序码涉及外网请求，适当放宽超时时间
    timeout: 10000,
  })
}

// 查询 PC 扫码登录会话状态
export function getQrLoginSessionStatus(sceneId) {
  return request({
    url: `/qr-login/session/${sceneId}`,
    method: 'get',
  })
}

// 登录（对接 Express：POST /users/login，返回 { code, message, token, data }）
export function userLogin(data) {
  return request({
    url: '/users/login',
    method: 'post',
    data,
  })
}

// 找回密码：根据用户名获取脱敏邮箱
export function getForgotEmail(username) {
  return request({
    url: '/users/forgot-email',
    method: 'get',
    params: { username },
  })
}

// 找回密码：验证完整邮箱，返回 resetToken
export function forgotVerify(data) {
  return request({
    url: '/users/forgot-verify',
    method: 'post',
    data,
  })
}

// 找回密码：用 resetToken 设置新密码
export function forgotReset(data) {
  return request({
    url: '/users/forgot-reset',
    method: 'post',
    data,
  })
}

// 注册（对接 Express：POST /users/register，返回 { code, message, data: { username } }）
export function userRegister(data) {
  return request({
    url: '/users/register',
    method: 'post',
    data,
  })
}

// 管理员添加用户（需登录，仅管理员；无需验证码；可设角色 editor/user；密码需 Base64 编码）
export function adminAddUser(data) {
  return request({
    url: '/users/token/admin-add-user',
    method: 'post',
    data,
  })
}

// 新增文章
export function addArticle(data) {
  return request({
    url: '/articles/token/',
    method: 'post',
    data,
  })
}

// 根据 id 获取文章（后台编辑用，同 getArticleDetail）
export function getArticleById(id) {
  return request({
    url: `/articles/${id}`,
    method: 'get',
  })
}

// 修改文章（对接 Express：PUT /articles/token/:id，body 含 title, summary, cover_url, content, category_id, status, tag_ids）
export function updateArticleById(id, data) {
  return request({
    url: `/articles/token/${id}`,
    method: 'put',
    data,
  })
}

// 删除文章（对接 Express：DELETE /articles/token/:id 默认软删除；params.soft=0 彻底删除）
export function deleteArticleById(id, soft = true) {
  return request({
    url: `/articles/token/${id}`,
    method: 'delete',
    params: soft ? undefined : { soft: '0' },
  })
}

// 恢复文章（对接 Express：PUT /articles/token/:id/restore）
export function restoreArticle(id) {
  return request({
    url: `/articles/token/${id}/restore`,
    method: 'put',
  })
}

// 文章阅读量 +1（对接 Express：POST /articles/:id/view）
export function incrementArticleView(id) {
  return request({
    url: `/articles/${id}/view`,
    method: 'post',
  })
}

// // 根据id获取分类
// export function getCategoryById(id) {
//   return request({
//     url: `/categories/${id}`,
//     method: 'get',
//   })
// }

// 新增分类
export function addCategory(data) {
  return request({
    url: '/categories/token/',
    method: 'post',
    data,
  })
}

// 修改分类
export function updateCategoryById(id, data) {
  return request({
    url: `/categories/token/${id}`,
    method: 'put',
    data,
  })
}

// 删除分类
export function deleteCategoryById(id) {
  return request({
    url: `/categories/token/${id}`,
    method: 'delete',
  })
}

// 标签（对接 Express：GET /tags、POST/PUT/DELETE /tags/token/:id）
export function getTagList() {
  return request({
    url: '/tags',
    method: 'get',
  })
}
export function addTag(data) {
  return request({
    url: '/tags/token/',
    method: 'post',
    data,
  })
}
export function updateTagById(id, data) {
  return request({
    url: `/tags/token/${id}`,
    method: 'put',
    data,
  })
}
export function deleteTagById(id) {
  return request({
    url: `/tags/token/${id}`,
    method: 'delete',
  })
}

// 全局配置（对接 Express：GET /otherswitch，返回 data 为数组，每项 { id, name, content, value }）
export function getOtherswitch() {
  return request({
    url: '/otherswitch',
    method: 'get',
  })
}

export function updateOtherswitch(id, data) {
  return request({
    url: `/otherswitch/token/${id}`,
    method: 'put',
    data,
  })
}

export function createOtherswitch(data) {
  return request({
    url: '/otherswitch/token/',
    method: 'post',
    data,
  })
}
// 获取所有用户
export function getAllUsers(params) {
  return request({
    url: '/users/token/',
    method: 'get',
    params: params || {},
  })
}

// 获取用户信息
export function getUserInfo(id) {
  return request({
    url: `/users/token/${id}`,
    method: 'get',
  })
}

// 当前登录用户信息（用于刷新积分等）
export function getCurrentUser() {
  return request({
    url: '/users/me',
    method: 'get',
  })
}

//  修改用户信息
export function updateUserInfo(id, data) {
  return request({
    url: `/users/token/${id}`,
    method: 'put',
    data,
  })
}

// 修改用户密码（对接 Express：POST /users/token/updatePassword，body: { id, oldPassword, newPassword }）
export function updateUserPassword(data) {
  return request({
    url: '/users/token/updatePassword',
    method: 'post',
    data,
  })
}

// 删除用户（默认停用；传 hard=1 时彻底删除）
export function deleteUserById(id, params) {
  return request({
    url: `/users/token/${id}`,
    method: 'delete',
    params: params || {},
  })
}

// 文章评论（对接 Express）
// 按文章获取评论列表 GET /comments/article/:articleId，返回 data 为数组，含 user_name、user_avatar
export function getCommentsByArticleId(articleId, params) {
  return request({
    url: `/comments/article/${articleId}`,
    method: 'get',
    params: params || {},
  })
}
// 发表评论 POST /comments，body: { article_id, content, parent_id? }，登录则带 token
export function createComment(data) {
  return request({
    url: '/comments',
    method: 'post',
    data,
  })
}

// 文章点赞（对接 Express）
// 是否已点赞 GET /likes/article/:articleId/check，可选带 token，返回 data: { liked }
export function checkArticleLiked(articleId) {
  return request({
    url: `/likes/article/${articleId}/check`,
    method: 'get',
  })
}
// 点赞/取消点赞 POST /likes/token/article/:articleId/toggle，需登录，返回 data: { liked }
export function toggleArticleLike(articleId) {
  return request({
    url: `/likes/token/article/${articleId}/toggle`,
    method: 'post',
  })
}

// 文章收藏（对接 Express）
// 是否已收藏 GET /favorites/article/:articleId/check，可选带 token，返回 data: { favorited }
export function checkArticleFavorited(articleId) {
  return request({
    url: `/favorites/article/${articleId}/check`,
    method: 'get',
  })
}
// 收藏/取消收藏 POST /favorites/token/article/:articleId/toggle，需登录，返回 data: { favorited }
export function toggleArticleFavorite(articleId) {
  return request({
    url: `/favorites/token/article/${articleId}/toggle`,
    method: 'post',
  })
}
// 我的收藏列表 GET /favorites/token/list，params: page, pageSize，返回 data: { list, total }
export function getMyFavorites(params) {
  return request({
    url: '/favorites/token/list',
    method: 'get',
    params: params || {},
  })
}
// 修改评论 PUT /comments/token/:id
export function updateCommentById(id, data) {
  return request({
    url: `/comments/token/${id}`,
    method: 'put',
    data,
  })
}
// 删除评论 DELETE /comments/token/:id
export function deleteCommentById(id) {
  return request({
    url: `/comments/token/${id}`,
    method: 'delete',
  })
}

// 后台评论列表（仅管理员）GET /comments/token/，params: status(0待审核/1已通过/2屏蔽)、page、pageSize
export function getCommentList(params) {
  return request({
    url: '/comments/token/',
    method: 'get',
    params: params || {},
  })
}

// 留言列表/messages/
export function getMessagesList() {
  return request({
    url: '/messages/',
    method: 'get',
  })
}

// 删除留言/messages/token/1
export function deleteMessageById(id) {
  return request({
    url: `/messages/token/${id}`,
    method: 'delete',
  })
}

// 新增留言/messages/token/
export function addMessage(data) {
  return request({
    url: '/messages/',
    method: 'post',
    data,
  })
}

// 修改留言/messages/token/1
export function updateMessageById(id, data) {
  return request({
    url: `/messages/token/${id}`,
    method: 'put',
    data,
  })
}

// 轮播图（对接 Express：wz_swiper 表）
export function getSwiperList(params) {
  return request({
    url: '/swiper',
    method: 'get',
    params: params || {},
  })
}

export function addSwiper(data) {
  return request({
    url: '/swiper/token/',
    method: 'post',
    data,
  })
}

export function updateSwiperById(id, data) {
  return request({
    url: `/swiper/token/${id}`,
    method: 'put',
    data,
  })
}

export function deleteSwiperById(id) {
  return request({
    url: `/swiper/token/${id}`,
    method: 'delete',
  })
}

// 获取友情链接列表
export function getLinksList() {
  return request({
    url: '/friendslink/',
    method: 'get',
  })
}

// 新增友情链接
export function addLink(data) {
  return request({
    url: '/friendslink/token/',
    method: 'post',
    data,
  })
}

// 修改友情链接
export function updateLinkById(id, data) {
  return request({
    url: `/friendslink/token/${id}`,
    method: 'put',
    data,
  })
}

// 删除友情链接
export function deleteLinkById(id) {
  return request({
    url: `/friendslink/token/${id}`,
    method: 'delete',
  })
}

// 数据看板（需登录，GET /dashboard/token/...）- 超时略长，避免首请求/冷启动超时
const DASHBOARD_TIMEOUT = 12000;
export function getDashboardStats() {
  return request({
    url: '/dashboard/token/stats',
    method: 'get',
    timeout: DASHBOARD_TIMEOUT,
  })
}

export function getDashboardArticleRank(params) {
  return request({
    url: '/dashboard/token/article-rank',
    method: 'get',
    params: params || {},
    timeout: DASHBOARD_TIMEOUT,
  })
}

export function getDashboardUserTrend(params) {
  return request({
    url: '/dashboard/token/user-trend',
    method: 'get',
    params: params || {},
    timeout: DASHBOARD_TIMEOUT,
  })
}

export function getDashboardArticleTrend(params) {
  return request({
    url: '/dashboard/token/article-trend',
    method: 'get',
    params: params || {},
    timeout: DASHBOARD_TIMEOUT,
  })
}

export function getDashboardTrafficSource() {
  return request({
    url: '/dashboard/token/traffic-source',
    method: 'get',
    timeout: DASHBOARD_TIMEOUT,
  })
}

// 积分流水（当前用户：不传 userId；管理员查他人：传 userId）
export function getPointsLog(params) {
  return request({
    url: '/points/token/log',
    method: 'get',
    params: params || {},
  })
}

// ---------- 积分商城 ----------
// 商品列表（前台 onlyOnSale 默认 true；后台可传 all=1）
export function getPointsGoodsList(params) {
  return request({
    url: '/points/goods',
    method: 'get',
    params: params || {},
    timeout: 10000,
  })
}

export function getPointsGoodsById(id) {
  return request({
    url: `/points/goods/${id}`,
    method: 'get',
  })
}

// 用户兑换（需登录，扣积分）
export function createPointsOrder(data) {
  return request({
    url: '/points/orders',
    method: 'post',
    data,
  })
}

// 订单列表（管理员可传 userId、status、page、pageSize）
export function getPointsOrderList(params) {
  return request({
    url: '/points/orders',
    method: 'get',
    params: params || {},
  })
}

export function getPointsOrderById(id) {
  return request({
    url: `/points/orders/${id}`,
    method: 'get',
  })
}

// 后台：商品 CRUD
export function addPointsGoods(data) {
  return request({
    url: '/points/token/goods',
    method: 'post',
    data,
  })
}

export function updatePointsGoods(id, data) {
  return request({
    url: `/points/token/goods/${id}`,
    method: 'put',
    data,
  })
}

export function deletePointsGoods(id) {
  return request({
    url: `/points/token/goods/${id}`,
    method: 'delete',
  })
}

// 后台：订单状态更新
export function updatePointsOrderStatus(id, data) {
  return request({
    url: `/points/token/orders/${id}`,
    method: 'put',
    data,
  })
}

// 活动列表/activity/
export function getActivityList(params) {
  return request({
    timeout: 10000,
    url: '/activity/token/',
    method: 'get',
    params
  })
}

// 新增活动项目 （临时）
export function addActivity(data) {
  return request({
    url: '/activity/sign/',
    method: 'post',
    data,
  })
}

// 活动签到列表/activity/
export function getActivityListSign(params) {
  return request({
    timeout: 10000,
    url: '/activity/sign/select',
    method: 'get',
    params
  })
}

// 获取蜜雪冰城type （临时）
export function type1286(data) {
  return request({
    baseURL: 'https://script.suxin23.cn',
    url: '/mxbc/type1286',
    method: 'post',
    data,
  })
}