const runQuery = require('../common/utils');
const pointsService = require('./pointsService');

async function toggle(articleId, userId) {
  const rows = await runQuery('SELECT id FROM wz_article_likes WHERE article_id = ? AND user_id = ?', [
    articleId,
    userId,
  ]);
  if (rows.length > 0) {
    await runQuery('DELETE FROM wz_article_likes WHERE article_id = ? AND user_id = ?', [articleId, userId]);
    await runQuery('UPDATE wz_articles SET like_count = GREATEST(0, like_count - 1) WHERE id = ?', [articleId]);
    try {
      await pointsService.addPointsLog(userId, -1, 'like_cancel');
    } catch (e) {
      console.error('points like_cancel', e);
    }
    return { liked: false };
  } else {
    await runQuery('INSERT INTO wz_article_likes (article_id, user_id) VALUES (?, ?)', [articleId, userId]);
    await runQuery('UPDATE wz_articles SET like_count = like_count + 1 WHERE id = ?', [articleId]);
    try {
      await pointsService.addPointsLog(userId, 1, 'like');
    } catch (e) {
      console.error('points like', e);
    }
    return { liked: true };
  }
}

async function checkLiked(articleId, userId) {
  const rows = await runQuery('SELECT 1 FROM wz_article_likes WHERE article_id = ? AND user_id = ?', [
    articleId,
    userId,
  ]);
  return rows.length > 0;
}

module.exports = { toggle, checkLiked };
