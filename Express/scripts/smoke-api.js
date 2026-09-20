/**
 * 全站接口冒烟测试（核心流程不能报错的自动化兜底）
 * 用法：先启动服务（npm start），再 node scripts/smoke-api.js
 * 覆盖：访客公开接口 + 管理端接口（自签超管 token）+ AI 向导三接口
 * 输出：分组通过率报告；任何 5xx/结构异常即失败
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const secretKey = require('../common/jwt');

const BASE = 'http://localhost:8021';
const rootToken = jwt.sign({ id: 1, username: 'admin', is_root: 1, role: 'admin' }, secretKey, { expiresIn: '10m' });

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail: detail || '' });
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ' — ' + (detail || '')}`);
}

async function getJson(path, token) {
  const headers = token ? { Authorization: 'Bearer ' + token } : {};
  const res = await fetch(BASE + path, { headers, signal: AbortSignal.timeout(20 * 1000) });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

// 公开接口：HTTP 200 且 body.code === 200
async function expectPublic(name, path, check) {
  try {
    const { res, body } = await getJson(path);
    const ok = res.status === 200 && body.code === 200 && (!check || check(body));
    record(name, ok, ok ? '' : `HTTP ${res.status} code=${body.code} ${JSON.stringify(body).slice(0, 120)}`);
  } catch (e) {
    record(name, false, e.message);
  }
}

// 管理接口：需超管 token
async function expectAdmin(name, path, check) {
  try {
    const { res, body } = await getJson(path, rootToken);
    const ok = res.status === 200 && body.code === 200 && (!check || check(body));
    record(name, ok, ok ? '' : `HTTP ${res.status} code=${body.code} ${JSON.stringify(body).slice(0, 120)}`);
  } catch (e) {
    record(name, false, e.message);
  }
}

(async () => {
  console.log('—— 访客公开接口 ——');
  await expectPublic('站点配置 /otherswitch', '/otherswitch', (b) => Array.isArray(b.data));
  await expectPublic('分类列表 /categories', '/categories', (b) => Array.isArray(b.data) && b.data.length > 0);
  await expectPublic('标签列表 /tags', '/tags', (b) => Array.isArray(b.data));
  await expectPublic('轮播图 /swiper', '/swiper', (b) => Array.isArray(b.data));
  await expectPublic('友情链接 /friendslink', '/friendslink/', (b) => Array.isArray(b.data));
  await expectPublic('文章列表 /articles', '/articles?page=1&pageSize=5', (b) => Array.isArray(b.data?.list) && b.data.list.length > 0);
  await expectPublic('文章归档 /articles/archive', '/articles/archive', (b) => Array.isArray(b.data));
  await expectPublic('热门排行 /articles/top', '/articles/top', (b) => Array.isArray(b.data?.view_top));
  await expectPublic('文章详情 /articles/1', '/articles/1', (b) => (Array.isArray(b.data) ? b.data[0] : b.data)?.id === 1);
  await expectPublic('积分商品 /points/goods', '/points/goods?page=1&pageSize=5', (b) => b.data && (b.data.list || b.data));

  console.log('—— AI 向导 ——');
  await expectPublic('AI 会话回放（无效id兜底）', '/ai/history?sessionId=not-exist', (b) => b.data && b.data.sessionId === '');
  await expectAdmin('AI 会话列表 /ai/token/sessions', '/ai/token/sessions?page=1&pageSize=5', (b) => b.data && Array.isArray(b.data.list));
  await expectAdmin('AI 统计 /dashboard/token/ai-stats', '/dashboard/token/ai-stats', (b) => typeof b.data.totalQuestions === 'number');

  console.log('—— 后台管理接口（超管） ——');
  await expectAdmin('看板统计 /dashboard/token/stats', '/dashboard/token/stats', (b) => typeof b.data.articleTotal === 'number');
  await expectAdmin('文章排行 /dashboard/token/article-rank', '/dashboard/token/article-rank?type=view_count&limit=5', (b) => Array.isArray(b.data));
  await expectAdmin('用户趋势 /dashboard/token/user-trend', '/dashboard/token/user-trend?days=7', (b) => Array.isArray(b.data));
  await expectAdmin('文章趋势 /dashboard/token/article-trend', '/dashboard/token/article-trend?days=7', (b) => Array.isArray(b.data));
  await expectAdmin('流量来源 /dashboard/token/traffic-source', '/dashboard/token/traffic-source', (b) => 'internal' in b.data);
  await expectAdmin('AI 使用统计 /dashboard/token/ai-stats', '/dashboard/token/ai-stats', (b) => Array.isArray(b.data.weekTrend));
  await expectAdmin('用户列表 /users/token/', '/users/token/', (b) => b.data);

  console.log('—— 越权与异常兜底 ——');
  // 编辑角色 403 单独验证（需要 editor token）
  try {
    const editorToken = jwt.sign({ id: 2, username: 'editor', is_root: 0, role: 'editor' }, secretKey, { expiresIn: '5m' });
    const res = await fetch(BASE + '/ai/token/sessions', { headers: { Authorization: 'Bearer ' + editorToken } });
    const body = await res.json();
    record('编辑角色访问 AI 会话列表（403）', body.code === 403, 'code=' + body.code);
  } catch (e) {
    record('编辑角色访问 AI 会话列表（403）', false, e.message);
  }
  // 无 token 访问管理接口 → 401
  try {
    const res = await fetch(BASE + '/dashboard/token/stats');
    record('无 token 访问看板（401）', res.status === 401, 'HTTP ' + res.status);
  } catch (e) {
    record('无 token 访问看板（401）', false, e.message);
  }

  const pass = results.filter((r) => r.ok).length;
  console.log(`\n===== 冒烟报告 =====`);
  console.log(`通过 ${pass}/${results.length}（${Math.round((pass / results.length) * 100)}%）`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log('失败清单:');
    failed.forEach((f) => console.log('  ✗', f.name, f.detail));
  }
  process.exit(pass === results.length ? 0 : 1);
})();
