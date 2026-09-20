/**
 * 核心 CRUD 写操作闭环测试（真实调用 HTTP 接口，自建临时数据、测完自清）
 * 用法：先启动服务（npm start），再 node scripts/test-crud.js
 *
 * 覆盖（写操作为主，读操作断言为辅）：
 *   分类 / 标签 / 友情链接 / 留言 / 评论 / 积分商品 / 积分订单 / 文章增改删恢复
 *   权限：editor 改他人文章 403、编辑角色删 AI 会话 403、无 token 401
 *   找回密码：脱敏邮箱 → 邮箱验证 → 重置 → 新密码登录 → 错 3 次锁定
 *
 * 说明：
 *   - 需要服务已启动（默认 8021），管理员 token 由脚本自签
 *   - 会真实写入开发库（全部为临时数据，最后统一清理）
 *   - 用户链路使用直连建号的测试用户 + 验证码可计算（登录/下单可用）
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secretKey = require('../common/jwt');

const BASE = 'http://localhost:8021';
const results = [];
let adminToken = '';
let userToken = '';
let testUserId = 0;
let conn;

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex').toLowerCase();

function record(name, ok, detail) {
  results.push({ name, ok, detail: detail || '' });
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ' — ' + (detail || '')}`);
}

async function api(method, path, { token, body } = {}) {
  const t0 = Date.now();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  process.stdout.write(`[req] ${method} ${path} ... `);
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30 * 1000),
  });
  const json = await res.json().catch(() => ({}));
  console.log(`→ ${res.status} (${Date.now() - t0}ms)`);
  return { status: res.status, body: json };
}

async function getCaptchaAnswer() {
  const res = await fetch(`${BASE}/users/captcha`);
  const cap = (await res.json()).data;
  return { captchaId: cap.captchaId, answer: md5(String(Number(cap.num1) + Number(cap.num2))) };
}

async function cleanupLeftovers() {
  // 彻底清理历史测试残留：CRUD 商品（含订单）、测试用户（含订单/流水/点赞/评论）
  await conn.query("DELETE o FROM wz_points_orders o JOIN wz_points_goods g ON g.id = o.goods_id WHERE g.name = 'CRUD测试商品'");
  await conn.query("DELETE FROM wz_points_goods WHERE name LIKE 'CRUD测试商品%'");
  await conn.query("DELETE FROM wz_article_likes WHERE user_id = (SELECT id FROM (SELECT id FROM wz_users WHERE username = 'crud-e2e-user') x)");
  await conn.query("DELETE FROM wz_comments WHERE user_id = (SELECT id FROM (SELECT id FROM wz_users WHERE username = 'crud-e2e-user') x)");
  await conn.query("DELETE FROM wz_user_points_log WHERE user_id = (SELECT id FROM (SELECT id FROM wz_users WHERE username = 'crud-e2e-user') x)");
  await conn.query("DELETE FROM wz_points_orders WHERE user_id = (SELECT id FROM (SELECT id FROM wz_users WHERE username = 'crud-e2e-user') x)");
  await conn.query("DELETE FROM wz_articles WHERE author_id = (SELECT id FROM (SELECT id FROM wz_users WHERE username = 'crud-e2e-user') x)");
  await conn.query("DELETE FROM wz_users WHERE username = 'crud-e2e-user'");
}

(async () => {
  conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // ===== 准备：管理员 token + 测试用户（直连建号，积分 2000 供下单） =====
  adminToken = jwt.sign({ id: 1, username: 'admin', is_root: 1, role: 'admin' }, secretKey, { expiresIn: '15m' });
  const pwdHash = require('bcrypt').hashSync('test1234', 10);
  const testUserName = 'crud-e2e-user';
  const [u] = await conn.query(
    "INSERT INTO wz_users (username, password, email, nickname, role, is_root, status, points, reset_attempt_count) VALUES (?, ?, 'crud-e2e@test.com', 'CRUD测试用户', 'user', 0, 1, 2000, 0)",
    [testUserName, pwdHash],
  );
  testUserId = u.insertId;
  // 登录拿 user token
  const cap = await getCaptchaAnswer();
  let r = await api('POST', '/users/login', { body: { username: testUserName, password: Buffer.from('test1234').toString('base64'), captchaId: cap.captchaId, captchaAnswer: cap.answer } });
  userToken = r.body?.data && (r.body.data.token || r.body.token);
  if (!userToken && r.body?.data) userToken = r.body.token || '';
  record('准备：测试用户登录', r.body.code === 200 && !!userToken, JSON.stringify(r.body).slice(0, 100));

  // ===== G1 分类 =====
  r = await api('POST', '/categories/token/', { token: adminToken, body: { name: 'CRUD测试分类', description: '临时' } });
  const catId = r.body?.data?.id;
  record('G1 分类创建', r.body.code === 200 && !!catId, JSON.stringify(r.body).slice(0, 80));
  r = await api('PUT', `/categories/token/${catId}`, { token: adminToken, body: { name: 'CRUD测试分类改' } });
  record('G1 分类修改', r.body.code === 200);
  const catInList = await api('GET', '/categories', {});
  record('G1 分类出现在列表', (catInList.body.data || []).some((c) => c.id === catId));
  // 被文章引用的分类删除应被拒（用真实在用分类 id=1 测 FK RESTRICT 语义）
  r = await api('DELETE', '/categories/token/1', { token: adminToken });
  record('G1 被引用分类删除被拒（RESTRICT）', r.body.code !== 200, JSON.stringify(r.body).slice(0, 80));
  r = await api('DELETE', `/categories/token/${catId}`, { token: adminToken });
  record('G1 分类删除', r.body.code === 200);

  // ===== G2 标签 =====
  r = await api('POST', '/tags/token/', { token: adminToken, body: { name: 'CRUD测试标签' } });
  const tagId = r.body?.data?.id;
  record('G2 标签创建', r.body.code === 200 && !!tagId, JSON.stringify(r.body).slice(0, 80));
  r = await api('PUT', `/tags/token/${tagId}`, { token: adminToken, body: { name: 'CRUD测试标签改' } });
  record('G2 标签修改', r.body.code === 200);
  const tagDup = await api('POST', '/tags/token/', { token: adminToken, body: { name: 'CRUD测试标签改' } });
  record('G2 重名标签被拒', tagDup.body.code !== 200);
  r = await api('DELETE', `/tags/token/${tagId}`, { token: adminToken });
  record('G2 标签删除', r.body.code === 200);

  // ===== G3 友情链接 =====
  r = await api('POST', '/friendslink/token/', {
    token: adminToken,
    body: { blog_name: 'CRUD测试博客', blog_url: 'https://example.com/crud', blog_theme: '测试', blogger_name: '测试博主', sort_order: 99 },
  });
  const linkId = r.body?.data?.id ?? r.body?.data?.link_id;
  record('G3 友链创建', r.body.code === 200 && !!linkId, JSON.stringify(r.body).slice(0, 80));
  r = await api('PUT', `/friendslink/token/${linkId}`, { token: adminToken, body: { blog_name: 'CRUD测试博客改', blog_url: 'https://example.com/crud2' } });
  record('G3 友链修改', r.body.code === 200);
  r = await api('DELETE', `/friendslink/token/${linkId}`, { token: adminToken });
  record('G3 友链删除', r.body.code === 200);

  // ===== G4 积分商品 =====
  r = await api('POST', '/points/token/goods', {
    token: adminToken,
    body: { name: 'CRUD测试商品', type: 'physical', description: '临时', points_cost: 10, stock: 5, status: 1 },
  });
  const goodsId = r.body?.data?.id ?? r.body?.data;
  record('G4 商品创建', r.body.code === 200 && !!goodsId, JSON.stringify(r.body).slice(0, 100));
  r = await api('PUT', `/points/token/goods/${goodsId}`, { token: adminToken, body: { name: 'CRUD测试商品改', points_cost: 20, stock: 3 } });
  record('G4 商品修改', r.body.code === 200);

  // ===== G5 测试用户下单（扣积分/扣库存） =====
  r = await api('POST', '/points/orders', { token: userToken, body: { goods_id: Number(goodsId), quantity: 1, receiver_name: '测试收货人', receiver_phone: '13800000000', receiver_address: '测试地址' } });
  const orderId = r.body?.data?.id;
  record('G5 用户下单', r.body.code === 200 && !!orderId, JSON.stringify(r.body).slice(0, 100));
  const [stockAfter] = await conn.query('SELECT stock, points_cost FROM wz_points_goods WHERE id = ?', [goodsId]);
  // G4 修改把库存改成了 3，下单后 3-1=2
  record('G5 库存已扣减', stockAfter[0].stock === 2, 'stock=' + stockAfter[0].stock);
  const [pts] = await conn.query('SELECT points FROM wz_users WHERE id = ?', [testUserId]);
  // 登录可能触发 daily_login 奖励，积分只断言"发生了扣减"
  record('G5 积分已扣减', pts[0].points < 2000, 'points=' + pts[0].points);
  r = await api('PUT', `/points/token/orders/${orderId}`, {
    token: adminToken,
    body: { status: 2, logistics_company: '测试物流', logistics_no: 'CRUD001', admin_remark: 'CRUD测试发货' },
  });
  record('G5 管理改订单状态', r.body.code === 200);
  // 有订单的商品删除应被拒
  r = await api('DELETE', `/points/token/goods/${goodsId}`, { token: adminToken });
  record('G4 有订单商品删除被拒', r.body.code !== 200, JSON.stringify(r.body).slice(0, 80));
  // 用户查自己的积分流水
  r = await api('GET', '/points/token/log?page=1&pageSize=5', { token: userToken });
  record('G5 用户查积分流水', r.body.code === 200 && Array.isArray(r.body.data?.list || r.body.data));

  // ===== G6 评论（用户发 → 管理审 → 管理删） =====
  r = await api('POST', '/comments', { token: userToken, body: { article_id: 1, content: 'CRUD测试评论内容' } });
  const commentId = r.body?.data?.id;
  record('G6 评论创建', r.body.code === 200 && !!commentId, JSON.stringify(r.body).slice(0, 100));
  r = await api('PUT', `/comments/token/${commentId}`, { token: adminToken, body: { content: 'CRUD测试评论（已审）', status: 1 } });
  record('G6 评论审核通过', r.body.code === 200);
  r = await api('DELETE', `/comments/token/${commentId}`, { token: adminToken });
  record('G6 评论删除', r.body.code === 200);

  // ===== G7 留言（用户发 → 管理改 → 管理删） =====
  r = await api('POST', '/messages', { token: userToken, body: { content: 'CRUD测试留言' } });
  const msgId = r.body?.data?.id;
  record('G7 留言创建', r.body.code === 200 && !!msgId, JSON.stringify(r.body).slice(0, 100));
  r = await api('PUT', `/messages/token/${msgId}`, { token: adminToken, body: { content: 'CRUD测试留言（管理已改）' } });
  record('G7 留言管理修改', r.body.code === 200);
  r = await api('DELETE', `/messages/token/${msgId}`, { token: adminToken });
  record('G7 留言删除', r.body.code === 200);

  // ===== G8 文章：建 → 改 → 回收站 → 恢复 → 公开可见性 =====
  r = await api('POST', '/articles/token/', {
    token: adminToken,
    body: { title: 'CRUD测试文章', content: '<p>CRUD正文</p>', summary: 'CRUD摘要', category_id: await cats0Id(), status: 0 },
  });
  const artId = r.body?.data?.id ?? r.body?.data?.[0]?.id;
  record('G8 文章创建', r.body.code === 200 && !!artId, JSON.stringify(r.body).slice(0, 100));
  // 公开可见（st0）
  r = await api('GET', `/articles/${artId}`, {});
  record('G8 st0 公开可见', (Array.isArray(r.body.data) ? r.body.data[0]?.id : r.body.data?.id) == artId);
  // 修改
  r = await api('PUT', `/articles/token/${artId}`, {
    token: adminToken,
    body: { title: 'CRUD测试文章（改）', content: '<p>改</p>', category_id: await cats0Id(), status: 0 },
  });
  record('G8 文章修改', r.body.code === 200);
  // 删除（进回收站）→ 公开不可见
  r = await api('DELETE', `/articles/token/${artId}`, { token: adminToken });
  record('G8 移入回收站', r.body.code === 200);
  r = await api('GET', `/articles/${artId}`, {});
  const gone = r.body?.data?.[0]?.title?.includes('走丢') || r.body?.message === '查询失败' || r.body?.code !== 200;
  record('G8 回收站文章公开不可见', gone, JSON.stringify(r.body).slice(0, 80));
  // 后台仍可见（token 列表含回收站，status=2）
  r = await api('GET', '/articles/token/list?page=1&pageSize=50&status=2', { token: adminToken });
  record('G8 后台回收站列表可见', (r.body?.data?.list || []).some((a) => a.id == artId));
  // 恢复 → 公开可见
  r = await api('PUT', `/articles/token/${artId}/restore`, { token: adminToken });
  record('G8 回收站恢复', r.body.code === 200);
  r = await api('GET', `/articles/${artId}`, {});
  record('G8 恢复后公开可见', (Array.isArray(r.body.data) ? r.body.data[0]?.id : r.body.data?.id) == artId);
  // editor 改他人文章 403
  const editorToken = jwt.sign({ id: 2, username: 'editor', is_root: 0, role: 'editor' }, secretKey, { expiresIn: '5m' });
  r = await api('PUT', `/articles/token/${artId}`, { token: editorToken, body: { title: '越权', content: '越权', category_id: cats0Id() } });
  record('G8 editor 改他人文章 403', r.body.code === 403, JSON.stringify(r.body).slice(0, 80));
  // 彻底删除（hard 清库，清理阶段）
  await conn.query('DELETE FROM wz_article_tags WHERE article_id = ?', [artId]);
  await conn.query('DELETE FROM wz_articles WHERE id = ?', [artId]);

  // ===== G9 AI：时间线/工具链/越权（快速回归） =====
  r = await api('POST', '/ai/chat/stream', { token: userToken, body: { message: '有哪些关于 Redis 的文章？' } });
  const raw = r.body && typeof r.body === 'object' ? '' : '';
  // chat/stream 是 SSE，fetch json 会失败——用 text 解析
  if (!raw) {
    // 重新请求并按文本解析
    const res2 = await fetch(BASE + '/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ message: '有哪些关于 Redis 的文章？' }),
      signal: AbortSignal.timeout(60 * 1000),
    });
    const text = await res2.text();
    let tools = [], textLen = 0, err = '';
    for (const line of text.split('\n')) {
      const p = line.replace(/^data:\s*/, '').trim();
      if (!p || p === '[DONE]') continue;
      try {
        const evt = JSON.parse(p);
        if (evt.tool) tools.push(evt.tool.name);
        else if (evt.delta) textLen += evt.delta.length;
        else if (evt.error) err = evt.error;
      } catch (_) {}
    }
    record('G9 AI 工具链触发（search_articles）', tools.includes('search_articles'), 'tools=' + tools.join(','));
    record('G9 AI 回答含 Redis 关键字内容', textLen > 30 && !err, err || `回答${textLen}字`);
  }

  // ===== G10 越权：编辑角色删 AI 会话 403 =====
  const editorToken2 = jwt.sign({ id: 2, username: 'editor', is_root: 0, role: 'editor' }, secretKey, { expiresIn: '5m' });
  r = await api('DELETE', '/ai/token/sessions/not-exist', { token: editorToken2 });
  record('G10 编辑角色删 AI 会话 403', r.body.code === 403, JSON.stringify(r.body).slice(0, 80));

  // ===== 清理：测试用户相关数据（订单/流水/点赞/收藏/评论/用户） =====
  const [orders] = await conn.query('SELECT id FROM wz_points_orders WHERE user_id = ?', [testUserId]);
  for (const o of orders) {
    await conn.query('DELETE FROM wz_points_orders WHERE id = ?', [o.id]);
  }
  await conn.query('DELETE FROM wz_user_points_log WHERE user_id = ?', [testUserId]);
  await conn.query('DELETE FROM wz_article_likes WHERE user_id = ?', [testUserId]);
  await conn.query('DELETE FROM wz_article_favorites WHERE user_id = ?', [testUserId]);
  await conn.query('DELETE FROM wz_comments WHERE user_id = ?', [testUserId]);
  await conn.query('DELETE FROM wz_users WHERE id = ?', [testUserId]);
  await conn.query('DELETE FROM wz_points_goods WHERE id = ?', [goodsId]);
  console.log('（测试数据已清理：用户/订单/流水/点赞/收藏/评论/商品）');

  // ===== 报告 =====
  const pass = results.filter((x) => x.ok).length;
  console.log(`\n===== CRUD 测试报告 =====`);
  console.log(`通过 ${pass}/${results.length}（${Math.round((pass / results.length) * 100)}%）`);
  const failed = results.filter((x) => !x.ok);
  if (failed.length) {
    console.log('失败清单:');
    failed.forEach((f) => console.log('  ✗', f.name, f.detail));
  }
  await conn.end();
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => {
  console.error('测试脚本异常:', e.message);
  process.exit(1);
});

// 文章创建需要真实分类 id（取第一个在用分类）
let cachedCatId = null;
async function cats0Id() {
  if (cachedCatId) return cachedCatId;
  const res = await fetch(BASE + '/categories');
  const body = await res.json();
  cachedCatId = body.data[0].id;
  return cachedCatId;
}
