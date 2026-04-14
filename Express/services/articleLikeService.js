const runQuery = require('../common/utils');
const pointsService = require('./pointsService');

const ARTICLE_LIKE_REASON_PREFIX = 'article_liked:';
const ARTICLE_UNLIKE_REASON_PREFIX = 'article_unliked:';

async function toggle(articleId, userId) {
  const articleRows = await runQuery('SELECT id, title, author_id FROM wz_articles WHERE id = ? LIMIT 1', [articleId]);
  const article = articleRows[0];
  if (!article) throw new Error('文章不存在');

  const rows = await runQuery('SELECT id FROM wz_article_likes WHERE article_id = ? AND user_id = ?', [
    articleId,
    userId,
  ]);
  const authorId = article.author_id != null ? Number(article.author_id) : null;
  const shouldRewardAuthor = authorId && authorId !== Number(userId);
  const articleTitle = String(article.title || '').trim() || `文章#${articleId}`;

  if (rows.length > 0) {
    await runQuery('DELETE FROM wz_article_likes WHERE article_id = ? AND user_id = ?', [articleId, userId]);
    await runQuery('UPDATE wz_articles SET like_count = GREATEST(0, like_count - 1) WHERE id = ?', [articleId]);
    if (shouldRewardAuthor) {
      try {
        await pointsService.addPointsLog(authorId, -1, `${ARTICLE_UNLIKE_REASON_PREFIX}${articleId}:${articleTitle}`);
      } catch (e) {
        console.error('points article_unliked', e);
      }
    }
    return { liked: false };
  } else {
    await runQuery('INSERT INTO wz_article_likes (article_id, user_id) VALUES (?, ?)', [articleId, userId]);
    await runQuery('UPDATE wz_articles SET like_count = like_count + 1 WHERE id = ?', [articleId]);
    if (shouldRewardAuthor) {
      try {
        await pointsService.addPointsLog(authorId, 1, `${ARTICLE_LIKE_REASON_PREFIX}${articleId}:${articleTitle}`);
      } catch (e) {
        console.error('points article_liked', e);
      }
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
