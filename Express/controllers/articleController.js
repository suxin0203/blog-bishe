const axios = require('axios');
const articleService = require('../services/articleService');
const pointsService = require('../services/pointsService');
const { success, fail, error } = require('../common/response');

const ARTICLE_PUBLISH_POINTS = 10;
const ARTICLE_PUBLISH_DAILY_LIMIT = 100;
const ARTICLE_PUBLISH_REASON_PREFIX = 'article_publish:';
const ARTICLE_DELETE_REASON_PREFIX = 'article_delete:';

/** 时间归档：按年-月聚合列表，用于归档页 */
exports.getArchive = async (req, res) => {
  try {
    const groups = await articleService.getArchiveGroups();
    return success(res, groups, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

/** 排行榜：阅读 / 点赞 / 收藏 Top N，用于详情页侧栏 */
exports.getTopArticles = async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 5));
    const data = await articleService.getTopLists(limit);
    return success(res, data, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getArticles = async (req, res) => {
  try {
    const { page, pageSize, keyword, category_id, tag_id, status, year, month } = req.query;
    const author_id = req.user?.role === 'editor' ? req.user.id : undefined;
    const { list, total } = await articleService.getList({
      page,
      pageSize,
      keyword,
      category_id,
      tag_id,
      status,
      author_id,
      year,
      month,
    });
    const pageNum = Number(req.query.page) || 1;
    const size = Number(req.query.pageSize) || 8;
    return success(res, {
      list,
      pagination: {
        page: pageNum,
        pageSize: size,
        total,
        totalPages: Math.ceil(total / size),
      },
    }, '获取分页文章列表成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const id = req.params.id;
    const incrementView = req.query.incrementView === '1' || req.query.incrementView === 'true';
    const source = req.query.source === 'internal' ? 'internal' : req.query.source === 'external' ? 'external' : undefined;
    const article = await articleService.getById(id, { incrementView, source });
    if (!article) {
      try {
        const resp = await axios.get('https://api.uomg.com/api/rand.qinghua?format=json');
        return success(res, [{ title: '文章走丢了~', content: `<h2>----${resp.data?.content || ''}</h2>` }], '查询失败');
      } catch (_) {
        return fail(res, '文章不存在', 404);
      }
    }
    return success(res, [article], '查询成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.createArticle = async (req, res) => {
  try {
    const { title, summary, cover_url, content, category_id, status, tag_ids } = req.body;
    const author_id = req.user?.id;
    if (!author_id) return fail(res, '请先登录', 401);
    const id = await articleService.create({
      title,
      summary,
      cover_url,
      content,
      category_id,
      author_id,
      status,
      tag_ids: Array.isArray(tag_ids) ? tag_ids : undefined,
    });
    try {
      const articleTitle = String(title || '').trim() || `文章#${id}`;
      await pointsService.addDailyCappedPointsLog(
        author_id,
        ARTICLE_PUBLISH_POINTS,
        `${ARTICLE_PUBLISH_REASON_PREFIX}${id}:${articleTitle}`,
        ARTICLE_PUBLISH_REASON_PREFIX,
        ARTICLE_PUBLISH_DAILY_LIMIT
      );
    } catch (pointsErr) {
      console.error('points article_publish', pointsErr);
    }
    return success(res, { id, title }, '创建成功');
  } catch (e) {
    console.error(e);
    return error(res, e.message || '操作错误');
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const id = req.params.id;
    if (req.user?.role === 'editor') {
      const article = await articleService.getById(id);
      if (!article || article.author_id !== req.user.id) return fail(res, '无权限修改该文章', 403);
    }
    const { title, summary, cover_url, content, category_id, status, tag_ids } = req.body;
    const n = await articleService.update(id, {
      title,
      summary,
      cover_url,
      content,
      category_id,
      status,
      tag_ids: tag_ids !== undefined ? (Array.isArray(tag_ids) ? tag_ids : []) : undefined,
    });
    if (!n) return fail(res, '文章不存在或未变更');
    return success(res, { id }, '更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const id = req.params.id;
    const article = await articleService.getById(id);
    if (!article) return fail(res, '文章不存在');
    if (req.user?.role === 'editor') {
      if (article.author_id !== req.user.id) return fail(res, '无权限删除该文章', 403);
    }
    const soft = req.query.soft !== '0' && req.query.soft !== 'false';
    const n = soft
      ? await articleService.softDelete(id)
      : await articleService.remove(id);
    if (!n) return fail(res, '文章不存在');
    if (article.author_id) {
      try {
        const rewardLog = await pointsService.getLatestPointsLogByReasonPrefixes(
          article.author_id,
          [ARTICLE_PUBLISH_REASON_PREFIX],
          { positiveOnly: true }
        );
        const rewardTitle = String(article.title || '').trim() || `文章#${id}`;
        if (rewardLog && rewardLog.reason === `${ARTICLE_PUBLISH_REASON_PREFIX}${id}:${rewardTitle}`) {
          await pointsService.addPointsLog(article.author_id, -Math.abs(Number(rewardLog.change) || ARTICLE_PUBLISH_POINTS), `${ARTICLE_DELETE_REASON_PREFIX}${id}:${rewardTitle}`);
        }
      } catch (pointsErr) {
        console.error('points article_delete', pointsErr);
      }
    }
    return success(res, { id }, soft ? '已移入回收站' : '删除成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.restoreArticle = async (req, res) => {
  try {
    const id = req.params.id;
    if (req.user?.role === 'editor') {
      const article = await articleService.getById(id);
      if (!article || article.author_id !== req.user.id) return fail(res, '无权限恢复该文章', 403);
    }
    const n = await articleService.restore(id);
    if (!n) return fail(res, '文章不存在或未在回收站');
    return success(res, { id }, '恢复成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.incrementViewCount = async (req, res) => {
  try {
    const id = req.params.id;
    await articleService.incrementViewCount(id);
    return success(res, null, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
