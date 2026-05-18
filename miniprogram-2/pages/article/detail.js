// pages/article/detail.js
const api = require('../../api/index.js')
const util = require('../../utils/util.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    id: null,
    article: null,
    comments: [],
    isLiked: false,
    isFavorited: false,
    loading: true,
    commentContent: '',
    showCommentInput: false
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.setData({ id })
      this.loadArticleDetail()
      this.loadComments()
      this.checkInteractionStatus()
    }
  },

  onShow() {
    // 每次显示时检查互动状态
    if (this.data.id && auth.isLoggedIn()) {
      this.checkInteractionStatus()
    }
  },

  // 加载文章详情
  async loadArticleDetail() {
    try {
      const article = await api.article.getDetail(this.data.id)
      // 转换图片 URL
      const convertedArticle = util.convertObjectImageUrls(article, ['cover_image'])
      this.setData({
        article: convertedArticle,
        loading: false
      })

      // 增加阅读量
      api.article.addView(this.data.id).catch(err => {
        console.error('增加阅读量失败', err)
      })

      // 设置分享信息
      wx.setNavigationBarTitle({
        title: article.title
      })
    } catch (error) {
      console.error('加载文章详情失败', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 加载评论列表
  async loadComments() {
    try {
      const comments = await api.comment.getByArticle(this.data.id)
      this.setData({
        comments: comments || []
      })
    } catch (error) {
      console.error('加载评论失败', error)
    }
  },

  // 检查互动状态
  async checkInteractionStatus() {
    if (!auth.isLoggedIn()) return

    try {
      const [likeRes, favoriteRes] = await Promise.all([
        api.like.check(this.data.id),
        api.favorite.check(this.data.id)
      ])

      this.setData({
        isLiked: likeRes.isLiked || false,
        isFavorited: favoriteRes.isFavorited || false
      })
    } catch (error) {
      console.error('检查互动状态失败', error)
    }
  },

  // 点赞/取消点赞
  async handleLike() {
    if (!auth.requireLogin()) return

    try {
      await api.like.toggle(this.data.id)
      const newLikeStatus = !this.data.isLiked
      
      this.setData({
        isLiked: newLikeStatus,
        'article.likes': this.data.article.likes + (newLikeStatus ? 1 : -1)
      })

      wx.showToast({
        title: newLikeStatus ? '已点赞' : '已取消',
        icon: 'success'
      })
    } catch (error) {
      console.error('点赞失败', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  // 收藏/取消收藏
  async handleFavorite() {
    if (!auth.requireLogin()) return

    try {
      await api.favorite.toggle(this.data.id)
      const newFavoriteStatus = !this.data.isFavorited
      
      this.setData({
        isFavorited: newFavoriteStatus
      })

      wx.showToast({
        title: newFavoriteStatus ? '已收藏' : '已取消',
        icon: 'success'
      })
    } catch (error) {
      console.error('收藏失败', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  // 显示评论输入框
  showCommentInput() {
    if (!auth.requireLogin()) return
    
    this.setData({
      showCommentInput: true
    })
  },

  // 输入评论内容
  onCommentInput(e) {
    this.setData({
      commentContent: e.detail.value
    })
  },

  // 提交评论
  async submitComment() {
    const content = this.data.commentContent.trim()
    
    if (!content) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      })
      return
    }

    try {
      await api.comment.create({
        article_id: this.data.id,
        content
      })

      wx.showToast({
        title: '评论成功，等待审核',
        icon: 'success'
      })

      this.setData({
        commentContent: '',
        showCommentInput: false
      })

      // 重新加载评论
      this.loadComments()
    } catch (error) {
      console.error('提交评论失败', error)
      wx.showToast({
        title: '评论失败',
        icon: 'none'
      })
    }
  },

  // 取消评论
  cancelComment() {
    this.setData({
      showCommentInput: false,
      commentContent: ''
    })
  },

  // 图片预览
  previewImage(e) {
    const { src } = e.currentTarget.dataset
    util.previewImage(src)
  },

  // 格式化时间
  formatTime(time) {
    return util.formatRelativeTime(time)
  },

  // 格式化阅读量
  formatReadCount(count) {
    return util.formatReadCount(count)
  },

  // 分享配置
  onShareAppMessage() {
    const { article } = this.data
    return util.getShareConfig({
      title: article ? article.title : '文章详情',
      path: `/pages/article/detail?id=${this.data.id}`,
      imageUrl: article ? article.cover_image : ''
    })
  }
})
