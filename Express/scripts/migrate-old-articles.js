/**
 * 老博客文章迁移脚本（旧库 blog → 开发库 wztest-ai）
 * 用法：
 *   node scripts/migrate-old-articles.js            # dry-run：只打印迁移预览，不写库
 *   node scripts/migrate-old-articles.js --apply    # 真正落库（只写开发库）
 *
 * 迁移规则（2026-09-20 与站长确认）：
 *   - 全量迁移含回收站文章，status 原样保留（0 展示 / 1 置顶 / 2 回收站）
 *   - 旧分类按映射表归入新分类，未匹配的落「其他」
 *   - 正文为 HTML 原样入库（新站 v-html 渲染链路兼容）；summary 取正文纯文本前 100 字
 *   - 旧站域名（api.suxin23.cn / blog.suxin23.cn）图片下载本地化到 upload/migrated/，外链不动
 *   - 按 title 查重：新库已有同名文章则跳过
 *   - author_id 统一记到新库超管名下（旧表无作者列）
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;

const oldDb = mysql.createPool({
  host: process.env.OLD_DB_HOST,
  port: Number(process.env.OLD_DB_PORT || 3306),
  user: process.env.OLD_DB_USER,
  password: process.env.OLD_DB_PASSWORD,
  database: process.env.OLD_DB_NAME,
  connectionLimit: 2,
});
const newDb = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 4,
});

// 旧分类名 → 新分类名（人工确认的映射表；未列出的旧分类落「其他」）
const CATEGORY_MAP = {
  默认分类: '其他',
  前端技术: '前端开发',
  后端技术: '后端开发',
  小程序: '移动端',
  安卓技术: '移动端',
  运维: 'Linux',
  网站测试: '技术杂谈',
  闲聊: '生活随笔',
  薅羊毛: '其他',
};

// 旧站图片域名：这些域名的图片下载本地化，其余外链原样保留
const LOCALIZE_HOSTS = ['api.suxin23.cn', 'blog.suxin23.cn'];
const IMG_SRC_RE = /src=["'](https?:\/\/[^"'\s]+\.(?:png|jpe?g|gif|webp|bmp)[^"'\s]*)["']/gi;

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(text, n) {
  const s = String(text || '').trim();
  return s.length > n ? s.slice(0, n) + '…' : s;
}

// 下载旧站图片到本地 upload/migrated/，返回新地址；失败返回 null（保留原地址）
async function localizeImage(url, dir) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15 * 1000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) return null;
    const ext = (url.match(/\.(png|jpe?g|gif|webp)/i) || [, 'png'])[1].toLowerCase().replace('jpeg', 'jpg');
    const name = 'migrated-' + crypto.randomUUID() + '.' + ext;
    fs.writeFileSync(path.join(__dirname, '..', 'public', 'upload', 'migrated', name), buf);
    return '/upload/migrated/' + name;
  } catch (_) {
    return null;
  }
}

// 把正文里旧站域名的图片下载本地化并改写地址；跳过模式仅统计
async function localizeContentImages(content, dryRun, report) {
  const matches = [...content.matchAll(IMG_SRC_RE)].map((m) => m[1]).filter((u) => LOCALIZE_HOSTS.some((h) => u.includes(h)));
  if (!matches.length) return content;
  let out = content;
  for (const url of [...new Set(matches)]) {
    if (dryRun) {
      report.images += 1;
      continue;
    }
    const local = await localizeImage(url, __dirname);
    if (local) {
      out = out.split(url).join(local);
      report.images += 1;
      console.log(`    图片本地化: ${url.slice(0, 60)} → ${local}`);
    } else {
      report.imagesFailed += 1;
      console.log(`    ⚠ 图片下载失败，保留原地址: ${url.slice(0, 60)}`);
    }
  }
  return out;
}

(async () => {
  const [oldConn] = [oldDb];
  // 1. 旧库全量数据
  const [oldArticles] = await oldConn.query('SELECT id, title, content, category_id, status, created_at, updated_at FROM articles ORDER BY id');
  const [oldCats] = await oldConn.query('SELECT id, name FROM categories');
  const oldCatName = Object.fromEntries(oldCats.map((c) => [c.id, c.name]));
  console.log(`旧库文章 ${oldArticles.length} 篇 / 分类 ${oldCats.length} 个 | 模式: ${DRY_RUN ? 'DRY-RUN（预览）' : 'APPLY（落库）'}\n`);

  // 2. 新库：分类映射表 + 超管作者 + 已有标题（防重）
  const [newCats] = await newDb.query('SELECT id, name FROM wz_categories');
  const newCatIdByName = Object.fromEntries(newCats.map((c) => [c.name, c.id]));
  const [admins] = await newDb.query('SELECT id FROM wz_users WHERE is_root = 1 AND status = 1 ORDER BY id LIMIT 1');
  const authorId = admins[0]?.id;
  if (!authorId) {
    console.error('!!! 新库无可用超管账号（author_id 外键必需），终止');
    process.exit(1);
  }
  const [existing] = await newDb.query('SELECT title FROM wz_articles');
  const existingTitles = new Set(existing.map((r) => r.title));

  // 本地化图片输出目录
  const migratedDir = path.join(__dirname, '..', 'public', 'upload', 'migrated');
  if (!APPLY) {
    // dry-run 不真正下载
  } else if (!fs.existsSync(migratedDir)) {
    fs.mkdirSync(migratedDir, { recursive: true });
  }

  // 3. 逐篇处理
  const report = { migrated: 0, skipped: 0, images: 0, imagesFailed: 0, byStatus: { 0: 0, 1: 0, 2: 0 } };
  const preview = [];
  for (const art of oldArticles) {
    const oldCat = oldCatName[art.category_id] || '未知分类';
    const newCatName = CATEGORY_MAP[oldCat] || '其他';
    const newCatId = newCatIdByName[newCatName];
    if (!newCatId) {
      console.error(`  ✗ #${art.id} ${art.title} — 新库缺少分类「${newCatName}」，跳过`);
      report.skipped += 1;
      continue;
    }
    if (existingTitles.has(art.title)) {
      console.log(`  - #${art.id} ${art.title} — 新库已有同名文章，跳过`);
      report.skipped += 1;
      continue;
    }

    const content = APPLY ? await localizeContentImages(art.content, false, report) : art.content;
    const summary = clamp(stripHtml(content), 100);
    const status = [0, 1, 2].includes(art.status) ? art.status : 0;
    if (APPLY) {
      await newDb.query(
        `INSERT INTO wz_articles (title, content, summary, category_id, author_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [art.title, content, summary, newCatId, authorId, status, art.created_at, art.updated_at],
      );
    }
    report.migrated += 1;
    report.byStatus[status] = (report.byStatus[status] || 0) + 1;
    preview.push(`#${art.id} [${oldCat}→${newCatName}] (${art.content.length}字, st${status}) ${art.title}`);
  }

  console.log('===== 迁移预览（%s）=====', DRY_RUN ? 'DRY-RUN' : 'APPLY 结果');
  preview.forEach((p) => console.log('  ' + p));
  console.log(`\n汇总: 迁移 ${report.migrated} / 跳过 ${report.skipped} | 图片本地化 ${report.images} 张（失败 ${report.imagesFailed}）| 状态分布 ${JSON.stringify(report.byStatus)}`);
  console.log(DRY_RUN ? '\n以上为预览。确认无误后执行: node scripts/migrate-old-articles.js --apply' : '\n✅ 迁移完成（写入开发库 ' + process.env.DB_NAME + '）');

  await oldConn.end();
  await newDb.end();
  process.exit(0);
})().catch((e) => {
  console.error('迁移失败:', e.message);
  process.exit(1);
});
