// pages/points/rules.js
Page({
  data: {
    rules: [
      {
        title: '获取积分',
        icon: '💰',
        items: [
          { action: '每日登录', points: '+5', limit: '每日1次', color: '#52c41a' },
          { action: '发布文章', points: '+10', limit: '每日最多100分', color: '#52c41a' },
          { action: '评论审核通过', points: '+5', limit: '每日最多50分', color: '#52c41a' },
          { action: '文章被点赞', points: '+1', limit: '无限制', color: '#52c41a' }
        ]
      },
      {
        title: '消耗积分',
        icon: '💸',
        items: [
          { action: '兑换实物商品', points: '根据商品', limit: '积分充足', color: '#ff4d4f' },
          { action: '兑换虚拟商品', points: '根据商品', limit: '积分充足', color: '#ff4d4f' },
          { action: '兑换称号', points: '根据称号', limit: '积分充足', color: '#ff4d4f' }
        ]
      },
      {
        title: '扣除积分',
        icon: '⚠️',
        items: [
          { action: '删除已发布文章', points: '-10', limit: '对应获得的积分', color: '#faad14' },
          { action: '删除已通过评论', points: '-5', limit: '对应获得的积分', color: '#faad14' },
          { action: '文章被取消点赞', points: '-1', limit: '对应获得的积分', color: '#faad14' }
        ]
      }
    ],
    tips: [
      '积分每日0点刷新获取次数限制',
      '积分可用于兑换商城商品和称号',
      '兑换的商品不支持退换，请谨慎选择',
      '管理员可能会根据情况调整用户积分',
      '恶意刷分行为将被封禁账号'
    ]
  }
})
