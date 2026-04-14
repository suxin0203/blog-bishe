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
    `SELECT DATE(created_at) AS date, COUNT(*) AS count FROM wz_users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY DATE(created_at) ORDER BY date`,
    [days]
  );
  return rows;
}

/** 文章发布趋势（按日） */
async function getArticleTrend(days = 7) {
  const rows = await runQuery(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count FROM wz_articles WHERE status IN (0, 1) AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY DATE(created_at) ORDER BY date`,
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

module.exports = { getStats, getArticleRank, getUserTrend, getArticleTrend, getTrafficSource };
