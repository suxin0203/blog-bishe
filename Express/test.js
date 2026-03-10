/**
 * 文栈博客接口自动化测试（全接口 + 权限）
 * 运行：node test.js（需先启动后端 npm run dev）
 * 环境变量：BASE_URL, TEST_PASS（默认 123456，用于 admin/editor/user1）
 * 若登录失败：先执行 scripts/reset-test-passwords.sql 将 admin/editor/user1 密码设为 123456 的 bcrypt 哈希
 */
const axios = require('axios');

const BASE = process.env.BASE_URL || 'http://localhost:8020';
const TEST_PASS = process.env.TEST_PASS || '123456';

const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
  validateStatus: () => true,
});

function ok(res) {
  return res && res.status >= 200 && res.status < 300 && (!res.data || !res.data.code || (res.data.code >= 200 && res.data.code < 300));
}

async function run(name, fn) {
  try {
    const res = await fn();
    if (ok(res)) {
      console.log('[成功] ' + name);
      return true;
    }
    const msg = res?.data?.message || res?.data?.error || res?.status?.toString() || '';
    const code = res?.data?.code != null ? ' code=' + res.data.code : '';
    console.log('[失败] ' + name + ' → ' + msg + code);
    return false;
  } catch (e) {
    const msg = e.response?.data?.message || e.response?.data?.error || e.message || '';
    console.log('[失败] ' + name + ' → ' + msg);
    return false;
  }
}

/** 期望返回指定 code（如 403 无权限） */
async function runExpect(name, fn, expectCode) {
  try {
    const res = await fn();
    const got = res?.data?.code ?? res?.status;
    if (got === expectCode) {
      console.log('[成功] ' + name + ' (符合预期 ' + expectCode + ')');
      return true;
    }
    console.log('[失败] ' + name + ' → 期望 code=' + expectCode + '，实际 ' + got);
    return false;
  } catch (e) {
    console.log('[失败] ' + name + ' → ' + (e.response?.data?.message || e.message));
    return false;
  }
}

let adminToken = '';
let editorToken = '';
let userToken = '';

async function login(username, password) {
  const res = await api.post('/users/login', { username, password: password || TEST_PASS });
  return res?.data?.token || '';
}

async function main() {
  console.log('========== 文栈博客接口测试 ==========');
  console.log('BASE_URL: ' + BASE + ' | 统一密码: TEST_PASS（默认 123456）\n');
  const results = [];
  let articleId;

  // 多账号登录（admin / editor / user1 用同一密码，至少一个成功即可跑全量）
  adminToken = await login('admin');
  editorToken = await login('editor');
  userToken = await login('user1');
  const token = adminToken || editorToken || userToken;
  if (token) {
    api.defaults.headers.common['Authorization'] = 'Bearer ' + (adminToken || token);
  }
  if (!token) {
    console.log('提示: admin/editor/user1 均登录失败。库中密码需为 bcrypt 加密，不能直接写明文。');
    console.log('请执行: mysql < scripts/reset-test-passwords.sql 或导入该 SQL，使三账号密码为 123456；或设置 TEST_PASS 与库中一致。\n');
  }

  // ========== 一、公开接口（无需登录）==========
  console.log('--- 公开接口 ---');
  results.push(await run('用户-注册', () => api.post('/users/register', { username: 'test_' + Date.now(), password: '123456' })));
  results.push(await run('用户-登录', () => api.post('/users/login', { username: 'admin', password: TEST_PASS })));
  results.push(await run('分类-列表', () => api.get('/categories')));
  results.push(await run('文章-列表', () => api.get('/articles?page=1&pageSize=5')));
  results.push(await run('文章-详情', () => api.get('/articles/1')));
  results.push(await run('文章-阅读量+1', () => api.post('/articles/1/view')));
  results.push(await run('标签-列表', () => api.get('/tags')));
  results.push(await run('评论-列表', () => api.get('/comments/article/1')));
  results.push(await run('评论-新增', () => api.post('/comments', { article_id: 1, content: '测试评论_' + Date.now() })));
  results.push(await run('点赞-是否已赞', () => api.get('/likes/article/1/check')));
  results.push(await run('留言-列表', () => api.get('/messages')));
  results.push(await run('留言-新增', () => api.post('/messages', { name: '测试', content: '留言_' + Date.now() })));
  results.push(await run('全局配置-列表', () => api.get('/otherswitch')));
  results.push(await run('友情链接-列表', () => api.get('/friendslink')));
  results.push(await run('轮播图-列表', () => api.get('/swiper')));
  results.push(await run('积分-商品列表', () => api.get('/points/goods')));
  results.push(await run('积分-商品详情', () => api.get('/points/goods/1')));
  results.push(await run('积分-订单列表', () => api.get('/points/orders')));
  results.push(await run('积分-订单详情', () => api.get('/points/orders/1')));
  results.push(await run('积分-流水', () => api.get('/points/log?userId=1')));

  // ========== 二、需登录接口（admin/editor 可访问）==========
  if (token) {
    console.log('\n--- 需登录接口（文章/分类/标签/评论/留言/配置/友链/轮播/积分/看板）---');
    api.defaults.headers.common['Authorization'] = 'Bearer ' + token;

    results.push(await run('用户-当前用户', () => api.get('/users/me')));
    results.push(await run('用户-列表', () => api.get('/users/token/')));
    results.push(await run('用户-详情', () => api.get('/users/token/1')));
    results.push(await run('用户-更新', () => api.put('/users/token/1', { nickname: '测试昵称' })));

    let categoryId;
    const addCat = await api.post('/categories/token/', { name: '测试分类_' + Date.now(), description: '测' });
    if (addCat.data?.data?.id) categoryId = addCat.data.data.id;
    results.push(await run('分类-新增', () => Promise.resolve(addCat)));
    if (categoryId) {
      results.push(await run('分类-修改', () => api.put('/categories/token/' + categoryId, { name: '测试分类改' })));
      results.push(await run('分类-删除', () => api.delete('/categories/token/' + categoryId)));
    }

    const listCat = await api.get('/categories');
    const cid = listCat.data?.data?.[0]?.id || 1;
    const addArt = await api.post('/articles/token/', {
      title: '测试文章_' + Date.now(),
      content: '<p>内容</p>',
      category_id: cid,
      status: 0,
    });
    articleId = addArt.data?.data?.id;
    results.push(await run('文章-新增', () => Promise.resolve(addArt)));
    if (articleId) {
      results.push(await run('文章-修改', () => api.put('/articles/token/' + articleId, { title: '测试文章改', content: '<p>内容</p>', category_id: cid, status: 0 })));
      results.push(await run('文章-删除(软删)', () => api.delete('/articles/token/' + articleId)));
      results.push(await run('文章-恢复', () => api.put('/articles/token/' + articleId + '/restore')));
      results.push(await run('文章-删除(软删) again', () => api.delete('/articles/token/' + articleId)));
    }

    let tagId;
    const addTag = await api.post('/tags/token/', { name: '测试标签_' + Date.now() });
    if (addTag.data?.data?.id) tagId = addTag.data.data.id;
    results.push(await run('标签-新增', () => Promise.resolve(addTag)));
    if (tagId) {
      results.push(await run('标签-修改', () => api.put('/tags/token/' + tagId, { name: '测试标签改' })));
      results.push(await run('标签-删除', () => api.delete('/tags/token/' + tagId)));
    }

    const addComment = await api.post('/comments', { article_id: 1, content: '测试评论2_' + Date.now() });
    const commentId = addComment.data?.data?.id;
    if (commentId) {
      results.push(await run('评论-修改', () => api.put('/comments/token/' + commentId, { content: '评论改' })));
      results.push(await run('评论-删除', () => api.delete('/comments/token/' + commentId)));
    }

    results.push(await run('点赞-切换', () => api.post('/likes/token/article/1/toggle')));

    const addMsg = await api.post('/messages', { name: '测试', content: '留言2_' + Date.now() });
    const msgId = addMsg.data?.data?.id;
    if (msgId) {
      results.push(await run('留言-修改', () => api.put('/messages/token/' + msgId, { content: '留言改' })));
      results.push(await run('留言-删除', () => api.delete('/messages/token/' + msgId)));
    }

    let switchId;
    const addSw = await api.post('/otherswitch/token/', { name: 'test_switch_' + Date.now(), content: '1', value: 0 });
    if (addSw.data?.data?.id) switchId = addSw.data.data.id;
    results.push(await run('全局配置-新增', () => Promise.resolve(addSw)));
    if (switchId) {
      results.push(await run('全局配置-修改', () => api.put('/otherswitch/token/' + switchId, { value: 1 })));
      results.push(await run('全局配置-删除', () => api.delete('/otherswitch/token/' + switchId)));
    }

    let linkId;
    const addLink = await api.post('/friendslink/token/', { blog_name: '测试站_' + Date.now(), blog_url: 'https://example.com' });
    if (addLink.data?.data?.link_id) linkId = addLink.data.data.link_id;
    results.push(await run('友情链接-新增', () => Promise.resolve(addLink)));
    if (linkId) {
      results.push(await run('友情链接-修改', () => api.put('/friendslink/token/' + linkId, { blog_name: '测试站改', blog_url: 'https://example.com' })));
      results.push(await run('友情链接-删除', () => api.delete('/friendslink/token/' + linkId)));
    }

    let swiperId;
    const addSwiper = await api.post('/swiper/token/', { image_url: 'https://picsum.photos/400/200', title: '测试', sort_order: 99, status: 1 });
    if (addSwiper.data?.data?.id) swiperId = addSwiper.data.data.id;
    results.push(await run('轮播图-新增', () => Promise.resolve(addSwiper)));
    if (swiperId) {
      results.push(await run('轮播图-修改', () => api.put('/swiper/token/' + swiperId, { title: '测试改' })));
      results.push(await run('轮播图-删除', () => api.delete('/swiper/token/' + swiperId)));
    }

    let goodsId;
    const addGoods = await api.post('/points/token/goods', { name: '测试商品_' + Date.now(), type: 'title', points_cost: 10, status: 1 });
    if (addGoods.data?.data?.id) goodsId = addGoods.data.data.id;
    results.push(await run('积分-商品新增', () => Promise.resolve(addGoods)));
    if (goodsId) {
      results.push(await run('积分-商品修改', () => api.put('/points/token/goods/' + goodsId, { name: '测试商品改' })));
      results.push(await run('积分-商品删除', () => api.delete('/points/token/goods/' + goodsId)));
    }

    const orderList = await api.get('/points/orders?page=1&pageSize=1');
    const firstOrderId = orderList.data?.data?.list?.[0]?.id;
    if (firstOrderId) {
      results.push(await run('积分-订单状态更新', () => api.put('/points/token/orders/' + firstOrderId, { status: 'approved', admin_remark: '测试' })));
    }

    const tempPass = 'temp_' + Date.now().toString(36);
    results.push(await run('用户-修改密码', () => api.post('/users/token/updatePassword', { id: 1, oldPassword: TEST_PASS, newPassword: tempPass })));
    results.push(await run('用户-改回密码', () => api.post('/users/token/updatePassword', { id: 1, oldPassword: tempPass, newPassword: TEST_PASS })));

    results.push(await run('看板-统计', () => api.get('/dashboard/token/stats')));
    results.push(await run('看板-文章排行', () => api.get('/dashboard/token/article-rank')));
    results.push(await run('看板-用户趋势', () => api.get('/dashboard/token/user-trend')));
    results.push(await run('看板-文章趋势', () => api.get('/dashboard/token/article-trend')));
  }

  // ========== 三、权限测试：普通用户访问后台应 403 ==========
  if (userToken && !adminToken && !editorToken) {
    api.defaults.headers.common['Authorization'] = 'Bearer ' + userToken;
    console.log('\n--- 权限：user 访问后台应 403 ---');
    results.push(await runExpect('权限-user访问用户列表→403', () => api.get('/users/token/'), 403));
    results.push(await runExpect('权限-user访问看板→403', () => api.get('/dashboard/token/stats'), 403));
    results.push(await runExpect('权限-user发布文章→403', () => api.post('/articles/token/', { title: 'x', content: 'x', category_id: 1 }), 403));
  }
  if (userToken) {
    api.defaults.headers.common['Authorization'] = 'Bearer ' + userToken;
    console.log('\n--- 权限：user 仅能访问 /me、点赞、兑换等 ---');
    results.push(await run('权限-user当前用户', () => api.get('/users/me')));
    results.push(await run('权限-user点赞', () => api.post('/likes/token/article/1/toggle')));
  }

  // ========== 四、权限测试：编辑改他人文章应 403 ==========
  if (editorToken) {
    api.defaults.headers.common['Authorization'] = 'Bearer ' + editorToken;
    const meRes = await api.get('/users/me');
    const editorId = meRes.data?.data?.id;
    const listRes = await api.get('/articles?page=1&pageSize=10');
    const others = (listRes.data?.data?.list || []).filter((a) => a.author_id !== editorId);
    if (others.length > 0) {
      const otherArticleId = others[0].id;
      console.log('\n--- 权限：editor 改他人文章应 403 ---');
      results.push(await runExpect('权限-editor改他人文章→403', () => api.put('/articles/token/' + otherArticleId, { title: 'x', content: 'x', category_id: others[0].category_id, status: 0 }), 403));
    }
  }

  const pass = results.filter(Boolean).length;
  const total = results.length;
  console.log('\n========== 结果 ==========');
  console.log('通过: ' + pass + ' / ' + total + (total > pass ? '，失败: ' + (total - pass) : ''));
  if (!token) console.log('提示: 未登录，需 token 的接口未执行。请保证 admin 或 editor 或 user1 密码为 ' + TEST_PASS + '（或设置 TEST_PASS）');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
