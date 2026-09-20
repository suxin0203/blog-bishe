// AI 向导工具注册表（二期 Tool Calling）
// 设计：schema（给模型的 function 定义）与 handler（复用现有 services 的查询）分离，
// 新增工具 = 在 toolDefinitions 里加一项；executeTool 永不 throw，错误以 {ok:false} 返回给模型
const articleService = require('./articleService');
const categoryService = require('./categoryService');
const tagService = require('./tagService');
const dashboardService = require('./dashboardService');
const aiConfig = require('../common/aiConfig');

const detailUrl = (id) => `${aiConfig.siteUrl}/#/detail?id=${id}`;

// 字符串截断：控制工具结果体积，防止撑爆上下文
function clamp(text, n) {
  const s = String(text || '').trim();
  return s.length > n ? s.slice(0, n) + '…' : s;
}

const toolDefinitions = [
  {
    name: 'search_articles',
    description: '按关键词、分类或标签搜索博客文章，返回匹配的文章列表（标题、摘要、分类、日期、链接）',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '标题或摘要关键词，可选' },
        category_name: { type: 'string', description: '分类名称（如"前端开发"），可选' },
        tag_name: { type: 'string', description: '标签名称（如"Vue"），可选' },
        page: { type: 'integer', description: '页码，默认 1', minimum: 1 },
      },
    },
    async handler(args = {}) {
      let categoryId = null;
      let tagId = null;
      if (args.category_name) {
        // categoryService 没有 findByName，从全量分类里按名称精确匹配
        const cats = await categoryService.findAll();
        const c = cats.find((x) => x.name === String(args.category_name).trim());
        if (!c) return { ok: true, total: 0, articles: [], note: `没有名为"${args.category_name}"的分类` };
        categoryId = c.id;
      }
      if (args.tag_name) {
        const t = await tagService.findByName(String(args.tag_name).trim());
        if (!t) return { ok: true, total: 0, articles: [], note: `没有名为"${args.tag_name}"的标签` };
        tagId = t.id;
      }
      const { list, total } = await articleService.getList({
        page: Number(args.page) || 1,
        pageSize: 5,
        keyword: String(args.keyword || '').trim(),
        category_id: categoryId,
        tag_id: tagId,
      });
      // 附正文摘录：让模型能回答"这些文章大概讲了什么"，不必再逐篇查详情
      const articles = await Promise.all(
        list.map(async (a) => {
          let contentExcerpt = '';
          try {
            // publicOnly：回收站文章不进入 AI 摘录
            const full = await articleService.getById(a.id, { publicOnly: true });
            contentExcerpt = clamp(articleService.stripHtml(full && full.content), 120);
          } catch (_) { /* 拿不到正文就只给摘要 */ }
          return {
            id: a.id,
            title: a.title,
            summary: clamp(a.summary, 80),
            contentExcerpt,
            category: a.category_name,
            date: String(a.created_at || '').slice(0, 10),
            url: detailUrl(a.id),
          };
        }),
      );
      return { ok: true, total, page: Number(args.page) || 1, articles };
    },
  },
  {
    name: 'list_categories',
    description: '获取博客的全部分类及每个分类下的文章数量',
    parameters: { type: 'object', properties: {} },
    async handler() {
      const cats = await categoryService.findAll();
      const withCount = await Promise.all(
        cats.map(async (c) => ({
          id: c.id,
          name: c.name,
          articleCount: await categoryService.countArticlesByCategoryId(c.id),
        })),
      );
      return { ok: true, categories: withCount };
    },
  },
  {
    name: 'list_tags',
    description: '获取博客的全部标签及关联文章数量',
    parameters: { type: 'object', properties: {} },
    async handler() {
      const tags = await tagService.findAll();
      const withCount = await Promise.all(
        tags.map(async (t) => ({
          id: t.id,
          name: t.name,
          articleCount: await tagService.countArticlesByTagId(t.id),
        })),
      );
      return { ok: true, tags: withCount };
    },
  },
  {
    name: 'get_hot_articles',
    description: '获取热门文章排行（按阅读/点赞/收藏）',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['view', 'like', 'favorite'], description: '排行依据，默认 view' },
        limit: { type: 'integer', description: '条数，默认 5，最大 5' },
      },
    },
    async handler(args = {}) {
      const column = { view: 'view_count', like: 'like_count', favorite: 'favorite_count' }[args.type] || 'view_count';
      const limit = Math.min(Number(args.limit) || 5, 5);
      const rows = await articleService.getTopBy(column, limit);
      return {
        ok: true,
        metric: column,
        articles: rows.map((r) => ({
          id: r.id,
          title: r.title,
          value: r[column],
          url: detailUrl(r.id),
        })),
      };
    },
  },
  {
    name: 'get_article_detail',
    description: '按 id 获取某篇文章的详情：摘要、分类与正文摘录',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: '文章 id' },
      },
      required: ['id'],
    },
    async handler(args = {}) {
      const id = Number(args.id);
      if (!id) return { ok: false, error: '缺少文章 id' };
      let a = null;
      try {
        // AI 向导面向访客：回收站文章同样不可见
        a = await articleService.getById(id, { publicOnly: true });
      } catch (_) {
        a = null;
      }
      if (!a) return { ok: false, error: `文章 id=${id} 不存在` };
      return {
        ok: true,
        id: a.id,
        title: a.title,
        category: a.category_name,
        summary: clamp(a.summary, 120),
        contentExcerpt: clamp(articleService.stripHtml(a.content), 800),
        url: detailUrl(a.id),
      };
    },
  },
  {
    name: 'get_site_overview',
    description: '获取站点整体统计：文章/用户/评论/留言总数与分类、标签数量',
    parameters: { type: 'object', properties: {} },
    async handler() {
      const [stats, cats, tags] = await Promise.all([
        dashboardService.getStats(),
        categoryService.findAll(),
        tagService.findAll(),
      ]);
      return {
        ok: true,
        articleTotal: stats.articleTotal,
        userTotal: stats.userTotal,
        commentTotal: stats.commentTotal,
        messageTotal: stats.messageTotal,
        categoryCount: cats.length,
        tagCount: tags.length,
      };
    },
  },
];

// 转成 OpenAI function calling 格式，随请求下发给模型
const toolSchemas = toolDefinitions.map((t) => ({
  type: 'function',
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  },
}));

// 给前端的状态提示文案
const toolBrief = {
  search_articles: '正在查询文章…',
  list_categories: '正在获取分类…',
  list_tags: '正在获取标签…',
  get_hot_articles: '正在查询热门文章…',
  get_article_detail: '正在阅读文章内容…',
  get_site_overview: '正在统计站点数据…',
};

function describeTool(name) {
  return toolBrief[name] || '正在查询…';
}

// 执行工具：永不 throw，错误以 {ok:false, error} 返回（模型可读并自行向用户解释）
async function executeTool(name, args = {}) {
  const def = toolDefinitions.find((t) => t.name === name);
  if (!def) return { ok: false, error: `未知工具: ${name}` };
  const t0 = Date.now();
  try {
    const result = await def.handler(args);
    console.log(`[ai] 工具=${name} 耗时=${Date.now() - t0}ms`);
    return result;
  } catch (e) {
    console.error(`[ai] 工具=${name} 失败:`, e.message);
    return { ok: false, error: '工具执行失败：' + e.message };
  }
}

module.exports = { toolSchemas, executeTool, describeTool };
