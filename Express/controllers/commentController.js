const commentService = require('../services/commentService');
const otherswitchService = require('../services/otherswitchService');
const { success, fail, error } = require('../common/response');

/** 从配置读取敏感词列表（JSON 数组），并对内容做替换（敏感词替换为 ***） */
async function filterSensitiveWords(content) {
  if (!content || typeof content !== 'string') return content;
  let words = [];
  try {
    const row = await otherswitchService.getByKey('sensitive_words');
    if (row?.content) {
      const parsed = JSON.parse(row.content);
      words = Array.isArray(parsed) ? parsed.filter((w) => typeof w === 'string' && w.trim()) : [];
    }
  } catch (_) {}
  let text = content;
  for (const w of words) {
    const term = w.trim();
    if (term) {
      const reg = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      text = text.replace(reg, '***');
    }
  }
  return text;
}

/** 后台评论列表：仅管理员，支持 status(0待审核/1已通过/2屏蔽)、分页、关键词模糊搜索 */
exports.getCommentList = async (req, res) => {
  try {
    const { status, keyword, page, pageSize } = req.query;
    const { list, total } = await commentService.getList({
      status: status !== undefined && status !== '' ? Number(status) : undefined,
      keyword: keyword || undefined,
      page: page || 1,
      pageSize: pageSize || 20,
    });
    return success(res, { list, total }, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getCommentsByArticleId = async (req, res) => {
  try {
    const articleId = req.params.articleId;
    const status = req.query.status !== undefined ? Number(req.query.status) : 1;
    const list = await commentService.getListByArticleId(articleId, { status });
    return success(res, list, '获取评论列表成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.createComment = async (req, res) => {
  try {
    if (!req.user?.id) return fail(res, '请先登录后评论', 401);
    const { article_id, parent_id, content, status } = req.body;
    const user_id = req.user.id;
    const rawContent = typeof content === 'string' ? content : '';
    const filteredContent = await filterSensitiveWords(rawContent);
    const id = await commentService.create({
      article_id,
      user_id,
      parent_id,
      content: filteredContent,
      status: status ?? 0,
    });
    return success(res, { id }, '评论已提交，通过审核后显示');
  } catch (e) {
    console.error(e);
    return error(res, e.message || '操作错误');
  }
};

exports.updateComment = async (req, res) => {
  try {
    const id = req.params.id;
    const { content, status } = req.body;
    const comment = await commentService.getById(id);
    if (!comment) return fail(res, '评论不存在');
    if (status !== undefined) {
      const articleService = require('../services/articleService');
      const article = await articleService.getById(comment.article_id);
      const isAdmin = req.user?.is_root === 1;
      const isAuthor = article && Number(article.author_id) === Number(req.user?.id);
      if (!isAdmin && !isAuthor) return fail(res, '无权限审核该评论', 403);
    }
    const n = await commentService.update(id, { content, status });
    if (!n) return fail(res, '更新失败或无变更');
    return success(res, { id }, '更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const id = req.params.id;
    const n = await commentService.remove(id);
    if (!n) return fail(res, '评论不存在');
    return success(res, { id }, '删除成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
