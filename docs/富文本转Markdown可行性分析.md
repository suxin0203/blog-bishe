# 富文本编辑器改为 Markdown 编辑器可行性分析

> 本文档用于评估文栈博客系统从当前 WangEditor 富文本编辑器迁移到 Markdown 编辑器的必要性、可行性、改造范围、风险和推荐实施方案。

---

## 一、当前编辑器现状

### 1.1 当前实现

当前 Web 后台文章编辑使用 `WangEditor`，对应组件为：

- `Vue3/src/components/RichTextEditor.vue`

当前特征：

- 编辑器组件基于 `@wangeditor/editor-for-vue`。
- 内容通过 `v-model` 绑定为 HTML 字符串。
- 图片上传走已有接口 `/upload/token/rich_editor_upload`。
- 图片插入时会把相对路径转换成后端静态资源地址。
- 后端文章接口不关心内容格式，只负责保存字段。

### 1.2 当前内容存储形态

现有文章正文大概率以 HTML 形式存储在数据库文章内容字段中。

示例形态：

```html
<h2>标题</h2>
<p>正文内容</p>
<img src="/upload/xxx.jpg" />
<pre><code>const a = 1;</code></pre>
```

### 1.3 当前方案优点

- 所见即所得，上手简单。
- 对非技术用户友好。
- 图片上传能力已经接入。
- Web 端展示成本低，可直接 `v-html` 渲染。

### 1.4 当前方案不足

- HTML 内容较重，长期维护不如 Markdown 清晰。
- 小程序端直接渲染 HTML 的兼容性不如 Web。
- 样式、代码块、表格等复杂内容在多端表现不一致。
- 富文本 HTML 存储对 XSS 与样式污染更敏感。
- 内容迁移、版本对比、纯文本检索不如 Markdown 方便。

---

## 二、为什么考虑 Markdown

Markdown 更适合博客、技术文章和跨端内容展示。

### 2.1 对文章创作更友好

Markdown 可以清晰表达：

- 标题层级。
- 段落。
- 引用。
- 列表。
- 代码块。
- 链接。
- 图片。
- 表格。

对于技术博客而言，Markdown 的代码块和结构化表达比传统富文本更适合。

### 2.2 对小程序端更友好

微信小程序对 HTML 的支持有限，而 Markdown 可以通过成熟库转换成小程序节点结构。

可选方案：

- `Towxml`
- `wemark`
- `mp-html`（偏 HTML 渲染）

其中 `Towxml` 对 Markdown 与代码高亮支持较好，更适合技术博客。

### 2.3 对长期维护更友好

Markdown 是纯文本：

- 便于数据库存储。
- 便于导出。
- 便于版本对比。
- 便于全文搜索。
- 便于从其它博客平台迁入/迁出。

### 2.4 对安全性更友好

相较于直接存储任意 HTML，Markdown 在渲染时可以统一转换和过滤，能减少恶意标签、内联脚本、危险属性带来的风险。

---

## 三、改造范围评估

## 3.1 前端后台编辑器

需要将当前 `RichTextEditor.vue` 替换或新增为 Markdown 编辑器组件。

当前组件：

- `Vue3/src/components/RichTextEditor.vue`

建议新增：

- `Vue3/src/components/MarkdownEditor.vue`

不建议直接删除原组件，建议先并行保留，降低回滚成本。

### 推荐编辑器

| 编辑器 | 优点 | 缺点 | 推荐度 |
|--------|------|------|--------|
| Vditor | 中文文档完善、所见即所得、分屏预览、支持图片上传 | 体积略大 | 高 |
| ByteMD | 插件化、轻量、适合开发者 | 所见即所得体验弱一些 | 中 |
| Milkdown | 现代化、可扩展强 | 接入复杂度较高 | 中低 |
| EasyMDE | 简单成熟 | UI 风格偏旧 | 中 |

推荐使用 `Vditor`。

### 前端工作内容

1. 安装 Markdown 编辑器依赖。
2. 新增 `MarkdownEditor.vue`。
3. 接入图片上传接口。
4. 文章编辑页替换编辑器组件。
5. 文章详情页支持 Markdown 渲染。
6. 后台文章预览支持 Markdown。
7. 调整代码高亮样式。

预计工作量：3-5 天。

---

## 3.2 前台文章详情渲染

当前前台文章详情如果使用 `v-html` 直接渲染 HTML，则需要调整为：

```text
Markdown 源文本
→ Markdown parser 转 HTML
→ sanitize 安全过滤
→ 代码高亮
→ 页面渲染
```

推荐 Web 端使用：

- `markdown-it`
- `highlight.js` 或继续使用 `Prism.js`
- `dompurify` 做 HTML 安全过滤

如果使用 `Vditor`，也可以复用 Vditor 的预览能力，但文章详情页不建议引入完整编辑器，只建议引入轻量 Markdown 渲染链路。

预计工作量：1-2 天。

---

## 3.3 后端接口

后端文章保存接口原则上不需要大改。

原因：

- 后端只保存内容字段，不强依赖 HTML。
- `POST /articles/token/` 和 `PUT /articles/token/:id` 可以继续接收 `content`。
- 数据库存储字段如果是 `TEXT` 或 `LONGTEXT`，可以继续存 Markdown。

建议增加一个字段来标识内容格式：

```sql
ALTER TABLE wz_articles ADD COLUMN content_format VARCHAR(20) NOT NULL DEFAULT 'html' COMMENT '文章正文格式：html/markdown';
```

如果不想改数据库，也可以在过渡期通过内容特征判断，但不推荐。

推荐后端改动：

1. 文章表新增 `content_format` 字段。
2. 新增/编辑文章时保存格式。
3. 文章详情返回 `content_format`。
4. 前端根据格式选择渲染方式。

预计工作量：0.5-1 天。

---

## 3.4 数据迁移

历史文章为 HTML，新文章改为 Markdown 后，会出现两种内容格式。

可选策略：

### 策略一：不迁移，双格式共存

- 旧文章：`content_format = html`
- 新文章：`content_format = markdown`
- 前端详情页根据格式渲染。

优点：

- 风险低。
- 不破坏旧数据。
- 可以快速上线。

缺点：

- 渲染逻辑需要兼容两套。
- 后台编辑旧文章时需要特殊处理。

### 策略二：一次性迁移

使用 `turndown.js` 把 HTML 转 Markdown。

流程：

```text
备份数据库
→ 查询所有 HTML 文章
→ 使用 turndown 转为 Markdown
→ 人工抽查
→ 更新 content 和 content_format
→ 前端统一按 Markdown 渲染
```

优点：

- 长期维护最简单。
- 前端只保留一套渲染逻辑。

缺点：

- 数据迁移有风险。
- HTML 转 Markdown 可能丢失部分样式。
- 表格、图片、代码块需要重点检查。

### 策略三：渐进迁移

- 先支持双格式。
- 后台编辑旧文章时提供“一键转 Markdown”。
- 逐步把重要文章迁移。

优点：

- 风险最低。
- 可控性强。

缺点：

- 过渡期较长。
- 功能复杂度略高。

---

## 四、改造工作量评估

| 项目 | 工作量 | 风险 | 说明 |
|------|--------|------|------|
| 新增 Markdown 编辑器组件 | 1-2 天 | 低 | 推荐 Vditor |
| 编辑页接入 | 1 天 | 低 | 替换 v-model 组件 |
| 图片上传适配 | 0.5-1 天 | 中 | 需适配 Vditor 上传返回格式 |
| 文章详情 Markdown 渲染 | 1-2 天 | 中 | 需处理代码高亮与样式 |
| 数据库新增格式字段 | 0.5 天 | 低 | 增加 `content_format` |
| 后端返回格式字段 | 0.5 天 | 低 | 接口轻微调整 |
| 历史数据迁移 | 2-3 天 | 中 | 需备份和人工抽查 |
| 小程序端 Markdown 渲染 | 1-2 天 | 中 | 推荐 Towxml |
| 测试与样式优化 | 1-2 天 | 中 | 重点测代码块、图片、表格 |

总工作量估计：

- 最小改造：4-6 天。
- 双格式兼容：6-8 天。
- 完全迁移：8-12 天。

---

## 五、是否会改动过大

结论：**不会特别大，但不是纯前端替换，需要做好内容格式兼容。**

### 5.1 改动小的部分

- 后端接口不需要重写。
- 图片上传接口可以复用。
- 数据库存储字段大概率可以复用。
- 文章列表、分类、标签、权限、积分等模块不受影响。

### 5.2 改动中的部分

- 后台文章编辑组件。
- 前台文章详情渲染。
- 代码高亮样式。
- 小程序端正文渲染。

### 5.3 改动较大的部分

- 历史文章迁移。
- 旧文章再次编辑的兼容处理。
- 如果文章中有复杂 HTML 样式，转换 Markdown 后可能丢失样式。

因此，如果只是“新增 Markdown 支持”，改动不大；如果“一次性替换并迁移全部旧文章”，则属于中等规模改造。

---

## 六、推荐实施方案

### 6.1 推荐方案：双格式过渡 + 后续渐进迁移

最适合当前项目的方式是：

```text
第一步：新增 content_format 字段
第二步：新增 MarkdownEditor.vue
第三步：新文章默认 Markdown
第四步：旧文章继续 HTML 渲染
第五步：小程序端优先支持 Markdown，同时兼容 HTML
第六步：后续再批量或手动迁移旧文章
```

### 6.2 为什么不建议直接全部替换

虽然完全替换长期更干净，但当前系统已经存在 Web 端富文本文章，如果直接改：

- 需要马上处理历史内容。
- 需要一次性测试所有文章详情。
- 出错时影响前台展示。

毕业设计或项目展示阶段，更推荐稳妥方案：先支持，再迁移。

### 6.3 推荐技术组合

| 场景 | 推荐工具 |
|------|----------|
| Web 后台编辑 | Vditor |
| Web 前台渲染 | markdown-it + Prism.js + DOMPurify |
| HTML 转 Markdown | turndown.js |
| 小程序 Markdown 渲染 | Towxml |
| 小程序 HTML 兼容 | mp-html 或 rich-text |

---

## 七、数据库与接口建议

### 7.1 数据库字段

建议新增：

```sql
ALTER TABLE wz_articles
ADD COLUMN content_format VARCHAR(20) NOT NULL DEFAULT 'html' COMMENT '文章正文格式：html/markdown';
```

可选新增：

```sql
ALTER TABLE wz_articles
ADD COLUMN markdown_content LONGTEXT NULL COMMENT 'Markdown 原文';
```

但不推荐同时维护 `content` 和 `markdown_content` 两个正文源，容易出现同步问题。更推荐只保留一个 `content` 字段，用 `content_format` 标识格式。

### 7.2 接口返回建议

文章详情返回：

```json
{
  "id": 1,
  "title": "文章标题",
  "content": "# Markdown 内容",
  "content_format": "markdown"
}
```

前端处理：

```text
content_format = html      → 按 HTML 渲染
content_format = markdown  → 按 Markdown 渲染
```

---

## 八、小程序端影响分析

如果保持 HTML：

- 小程序可以用 `rich-text` 或 `mp-html` 渲染。
- 复杂样式可能不一致。
- 代码高亮需要额外处理。

如果改为 Markdown：

- 小程序可用 `Towxml` 转换。
- 文章结构更稳定。
- 更适合技术博客阅读。
- 图片预览和代码块可控性更高。

因此，若确定要做小程序端，Markdown 支持性更好。

---

## 九、风险清单

| 风险 | 等级 | 说明 | 应对 |
|------|------|------|------|
| 历史 HTML 转换不完整 | 中 | 表格、内联样式可能丢失 | 保留 HTML 兼容，不强制一次性迁移 |
| 编辑器上传接口格式不匹配 | 中 | Vditor 上传返回格式与当前接口可能不同 | 做一层上传适配 |
| 前台样式变化 | 中 | Markdown 样式与原富文本不同 | 单独写 markdown 样式文件 |
| XSS 风险 | 中 | Markdown 转 HTML 后仍需过滤 | 使用 DOMPurify |
| 小程序包体积增加 | 低 | Towxml 会增加体积 | 按需引入，控制资源 |
| 用户编辑习惯变化 | 低 | Markdown 对非技术用户有门槛 | 选择所见即所得模式 |

---

## 十、最终建议

### 10.1 是否建议改

建议改，但不建议一次性强制替换所有旧文章。

推荐原因：

1. 当前项目偏技术博客，Markdown 更适合文章创作。
2. 小程序端对 Markdown 的支持和表现更可控。
3. 纯文本格式更利于长期维护、迁移和安全控制。
4. 后端改动较小，主要工作在前端渲染与编辑器替换。

### 10.2 推荐优先级

如果当前目标是毕业设计展示：

```text
优先级 1：先完成小程序文章浏览与登录
优先级 2：小程序端兼容 HTML 正文
优先级 3：Web 后台支持 Markdown 新文章
优先级 4：逐步迁移历史文章
```

如果当前目标是长期维护博客：

```text
优先级 1：新增 content_format 字段
优先级 2：接入 Vditor
优先级 3：新文章默认 Markdown
优先级 4：迁移历史文章
优先级 5：小程序端统一 Markdown 渲染
```

### 10.3 推荐结论

**Markdown 对小程序移植支撑性更好，改造规模为中等，不会影响文章、分类、标签、用户、积分等核心后端业务。最推荐采用“双格式兼容 + 渐进迁移”的方案。**
