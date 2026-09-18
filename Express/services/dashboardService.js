const runQuery = require('../common/utils');

async function getStats() {
  const [userCount, articleCount, commentCount, messageCount] = await Promise.all([
    runQuery('SELECT COUNT(*) AS total FROM wz_users'),
    runQuery('SELECT COUNT(*) AS total FROM wz_articles WHERE status IN (0, 1)'),
    runQuery('SELECT COUNT(*) AS total FROM wz_comments WHERE status = 1'),
    runQuery('SELECT COUNT(*) AS total FROM wz_messages WHERE status = 1'),
  ]);
  return {
    userTotal: userCount[0].total,
    articleTotal: articleCount[0].total,
    commentTotal: commentCount[0].total,
    messageTotal: messageCount[0].total,
  };
}

/** 热门文章排行：按阅读量、点赞、评论、收藏 */
async function getArticleRank({ type = 'view_count', limit = 10 } = {}) {
  const col = ['view_count', 'like_count', 'comment_count', 'favorite_count'].includes(type) ? type : 'view_count';
  const rows = await runQuery(
    `SELECT id, title, view_count, like_count, comment_count, favorite_count, created_at,
            COALESCE((SELECT nickname FROM wz_users WHERE id = wz_articles.author_id), '用户已注销') AS author_name
     FROM wz_articles
     WHERE status IN (0, 1)
     ORDER BY ${col} DESC LIMIT ?`,
    [Number(limit)]
  );
  rows.forEach((r) => {
    r.created_at = r.created_at?.toLocaleString?.() ?? r.created_at;
  });
  return rows;
}

/** 用户增长（按日统计最近 N 天） */
async function getUserTrend(days = 7) {
  const rows = await runQuery(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COUNT(*) AS count FROM wz_users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY DATE(created_at) ORDER BY date`,
    [days]
  );
  return rows;
}

/** 文章发布趋势（按日） */
async function getArticleTrend(days = 7) {
  const rows = await runQuery(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COUNT(*) AS count FROM wz_articles WHERE status IN (0, 1) AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY DATE(created_at) ORDER BY date`,
    [days]
  );
  return rows;
}

/** 流量来源统计：站内/站外阅读数汇总（需文章表有 view_internal_count、view_external_count 列） */
async function getTrafficSource() {
  try {
    const rows = await runQuery(
      'SELECT COALESCE(SUM(view_internal_count), 0) AS internal, COALESCE(SUM(view_external_count), 0) AS external FROM wz_articles WHERE status IN (0, 1)'
    );
    return rows[0] || { internal: 0, external: 0 };
  } catch (_) {
    return { internal: 0, external: 0 };
  }
}

/** AI 使用统计：总提问数、今日提问数、近 7 日提问趋势、工具调用 Top（数据来自 wz_ai_messages） */
async function getAiStats() {
  const [totalRows, todayRows, trendRows, toolRows] = await Promise.all([
    runQuery("SELECT COUNT(*) AS total FROM wz_ai_messages WHERE role = 'user'"),
    runQuery("SELECT COUNT(*) AS total FROM wz_ai_messages WHERE role = 'user' AND DATE(created_at) = CURDATE()"),
    runQuery(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COUNT(*) AS count FROM wz_ai_messages
       WHERE role = 'user' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(created_at) ORDER BY date`
    ),
    runQuery(
      `SELECT tool_name AS name, COUNT(*) AS count FROM wz_ai_messages
       WHERE role = 'tool' AND tool_name IS NOT NULL
       GROUP BY tool_name ORDER BY count DESC LIMIT 5`
    ),
  ]);
  return {
    totalQuestions: totalRows[0].total,
    todayQuestions: todayRows[0].total,
    weekTrend: trendRows,
    toolTop: toolRows,
  };
}

module.exports = { getStats, getArticleRank, getUserTrend, getArticleTrend, getTrafficSource, getAiStats };
