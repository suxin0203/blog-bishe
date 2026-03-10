const articleFavoriteService = require('../services/articleFavoriteService');
const { success, fail, error } = require('../common/response');

exports.toggleFavorite = async (req, res) => {
  try {
    const articleId = req.params.articleId;
    const userId = req.user?.id;
    if (!userId) return fail(res, '请先登录', 401);
    const result = await articleFavoriteService.toggle(articleId, userId);
    return success(res, result, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.checkFavorited = async (req, res) => {
  try {
    const articleId = req.params.articleId;
    const userId = req.user?.id;
    const favorited = userId ? await articleFavoriteService.checkFavorited(articleId, userId) : false;
    return success(res, { favorited }, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

/** 当前用户收藏列表（需登录，支持 keyword 模糊搜索标题/摘要） */
exports.getMyFavorites = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return fail(res, '请先登录', 401);
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;
    const keyword = req.query.keyword;
    const result = await articleFavoriteService.getUserFavorites(userId, { page, pageSize, keyword });
    return success(res, result, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
