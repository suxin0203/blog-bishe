// 配置文件
module.exports = {
  // API 基础地址
  baseURL: 'https://wzapi.suxin23.cn',
//   baseURL: 'http://localhost:8021',
  // 微信小程序 AppID（需要替换为实际 AppID）
  appId: 'wx15276ccd959c150c',
  
  // 微信小程序 AppSecret（后端使用）
  appSecret: 'your-appsecret',
  
  // 请求超时时间（毫秒）
  timeout: 15000,
  
  // Token 过期时间（毫秒）
  tokenExpireTime: 7 * 24 * 60 * 60 * 1000, // 7天
  
  // 是否启用时间戳防重放
  enableTimestamp: true,
  
  // 时间戳允许的最大偏差（秒）
  maxTimestampDiff: 30,
  
  // 分页配置
  pageSize: 10,
  
  // 图片上传配置
  uploadMaxSize: 5 * 1024 * 1024, // 5MB
  uploadAccept: ['image/jpeg', 'image/png', 'image/gif'],
  
  // 积分规则
  pointsRules: [
    { action: '每日登录', points: 5, limit: '每日1次' },
    { action: '发布文章', points: 10, limit: '每日最多100分' },
    { action: '评论审核通过', points: 5, limit: '每日最多50分' },
    { action: '文章被点赞', points: 1, limit: '无限制' },
    { action: '积分兑换', points: '扣除商品积分', limit: '积分充足' }
  ]
}
