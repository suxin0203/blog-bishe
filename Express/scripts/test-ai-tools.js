/**
 * AI 工具注册表单测（不经过 HTTP，直接调用 service）
 * 用法：node scripts/test-ai-tools.js
 * 验证：6 个工具逐个调用，断言返回结构与关键字段
 */
require('dotenv').config();
const aiTools = require('../services/aiTools');

let pass = 0;
let fail = 0;

function check(name, condition, detail) {
  if (condition) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

(async () => {
  console.log('—— search_articles：关键词搜索 ——');
  const s1 = await aiTools.executeTool('search_articles', { keyword: 'Express' });
  check('返回 ok', s1.ok === true, JSON.stringify(s1).slice(0, 150));
  check('articles 是数组', Array.isArray(s1.articles));
  if (s1.articles && s1.articles.length) {
    const a = s1.articles[0];
    check('文章含 id/title/url', !!(a.id && a.title && a.url));
    check('url 含 /detail?id=', String(a.url).includes('/detail?id='), a.url);
  }

  console.log('—— search_articles：分类名过滤 ——');
  const s2 = await aiTools.executeTool('search_articles', { category_name: '前端开发' });
  check('返回 ok 且有结果', s2.ok === true && s2.total >= 1, `total=${s2.total}`);

  console.log('—— search_articles：不存在的分类（应空而非报错）——');
  const s3 = await aiTools.executeTool('search_articles', { category_name: '不存在的分类' });
  check('返回 ok 且 total=0', s3.ok === true && s3.total === 0);

  console.log('—— list_categories ——');
  const c = await aiTools.executeTool('list_categories');
  check('返回 ok 且分类数>0', c.ok === true && Array.isArray(c.categories) && c.categories.length > 0);
  if (c.categories && c.categories[0]) {
    check('分类含名称与计数', !!(c.categories[0].name && typeof c.categories[0].articleCount === 'number'));
  }

  console.log('—— list_tags ——');
  const t = await aiTools.executeTool('list_tags');
  check('返回 ok 且标签数>0', t.ok === true && Array.isArray(t.tags) && t.tags.length > 0);

  console.log('—— get_hot_articles ——');
  const h = await aiTools.executeTool('get_hot_articles', { type: 'view', limit: 3 });
  check('返回 ok 且文章数<=3', h.ok === true && Array.isArray(h.articles) && h.articles.length <= 3);

  console.log('—— get_article_detail：存在与不存在 ——');
  const d1 = await aiTools.executeTool('get_article_detail', { id: s1.articles[0] ? s1.articles[0].id : 3 });
  check('详情含标题与正文摘录', d1.ok === true && !!d1.title && d1.contentExcerpt.length > 0);
  const d2 = await aiTools.executeTool('get_article_detail', { id: 999999 });
  check('不存在的文章返回 ok:false', d2.ok === false);

  console.log('—— get_site_overview ——');
  const o = await aiTools.executeTool('get_site_overview');
  check('返回 ok 且含文章总数', o.ok === true && typeof o.articleTotal === 'number' && o.articleTotal > 0);

  console.log('—— 未知工具 ——');
  const u = await aiTools.executeTool('no_such_tool', {});
  check('返回 ok:false', u.ok === false);

  console.log(`\n结果：通过 ${pass} / 失败 ${fail}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('测试脚本异常:', e.message);
  process.exit(1);
});
