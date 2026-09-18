const dashboardService = require('../services/dashboardService');
const { success, error } = require('../common/response');

exports.getStats = async (req, res) => {
  try {
    const data = await dashboardService.getStats();
    return success(res, data, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getArticleRank = async (req, res) => {
  try {
    const type = req.query.type || 'view_count';
    const limit = req.query.limit || 10;
    const list = await dashboardService.getArticleRank({ type, limit });
    return success(res, list, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getUserTrend = async (req, res) => {
  try {
    const days = req.query.days || 7;
    const list = await dashboardService.getUserTrend(days);
    return success(res, list, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getArticleTrend = async (req, res) => {
  try {
    const days = req.query.days || 7;
    const list = await dashboardService.getArticleTrend(days);
    return success(res, list, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getTrafficSource = async (req, res) => {
  try {
    const data = await dashboardService.getTrafficSource();
    return success(res, data, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getAiStats = async (req, res) => {
  try {
    const data = await dashboardService.getAiStats();
    return success(res, data, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
