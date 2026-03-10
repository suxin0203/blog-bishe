const articleLikeService = require('../services/articleLikeService');
const { success, fail, error } = require('../common/response');

exports.toggleLike = async (req, res) => {
  try {
    const articleId = req.params.articleId;
    const userId = req.user?.id;
    if (!userId) return fail(res, '请先登录', 401);
    const result = await articleLikeService.toggle(articleId, userId);
    return success(res, result, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.checkLiked = async (req, res) => {
  try {
    const articleId = req.params.articleId;
    const userId = req.user?.id;
    const liked = userId ? await articleLikeService.checkLiked(articleId, userId) : false;
    return success(res, { liked }, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
