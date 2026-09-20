# 博客 AI 向导 · 方案一（最小可用版）设计计划

> 生成时间：2026-09-18 ｜ **状态：✅ 已实现并通过端到端验证（2026-09-18，实施记录见文末）**
> 关联决策：Node 生态落地（不重写后端）；后期如重构 Python/Java（LangChain / Spring AI），概念可平移。
> 方案一定义：**纯提示词驱动的聊天向导**——系统提示词写死博客介绍与功能说明，多轮对话 + SSE 流式输出。不含 Tool Calling、不含 RAG、不新建数据库表。

---

## 一、范围界定

| 做 | 不做（留给二期+） |
|------|------|
| `POST /ai/chat/stream` SSE 聊天接口 | Tool Calling 查真实文章/分类数据 |
| 系统提示词（站点介绍 + 功能清单 + 回答边界） | RAG / 向量数据库 |
| 会话记忆（内存，最近 10 轮，TTL 30 分钟） | 聊天记录落库 |
| 前端悬浮球 + 聊天窗（Vue3 前台） | 小程序端 AI 入口 |
| 简单 IP 限流 | 敏感词库、复杂风控 |

---

## 二、技术选型

| 环节 | 选型 | 理由 |
|------|------|------|
| LLM | 智谱 GLM-4-Flash-250414（备选 GLM-4.7-Flash） | 免费、注册即用、OpenAI 协议兼容；选型实测见 `common/aiConfig.js` 注释 |
| SDK | **原生 fetch（Node 24 内置）**，未引入 openai 包 | SSE 解析逻辑已实测稳定，少一个依赖；`AbortSignal.any` 组合超时与中断 |
| 流式传输 | SSE（POST + fetch ReadableStream） | 打字机效果；EventSource 只支持 GET，改用 fetch 流式读取 |
| 会话记忆 | Node 内存 `Map`（sessionId → messages） | 方案一可接受重启丢失；二期落库 |
| 限流 | 每 IP 每分钟 10 次，内存计数 | 防刷免费额度即可 |

---

## 三、接口设计

```
POST /ai/chat/stream
Content-Type: application/json

请求：{ "message": "博客有什么功能？", "sessionId": "可选，不传则新建" }

响应：text/event-stream
data: {"sessionId":"abc123"}          ← 首条，下发会话 ID
data: {"delta":"文栈博客"}             ← 增量文本，循环推送
data: {"delta":"是一个……"}
data: [DONE]                          ← 结束标记

异常（非流式）：{ "code": 429, "message": "提问太频繁啦", "data": null }
```

- 不强制登录（游客可用）；若请求头带 token，`req.user` 已由现有中间件解析，可留作二期个性化。
- 响应头加 `X-Accel-Buffering: no`，防 nginx 缓冲导致"一次性吐全文"。

---

## 四、后端新增（不动任何现有代码）

| 文件 | 职责 |
|------|------|
| `common/aiConfig.js` | `apiKey`（读环境变量 `ZHIPU_API_KEY`）、`baseURL`、`model`、`maxHistory=10`、限流阈值 |
| `services/aiService.js` | ① `buildSystemPrompt()` 站点介绍+功能清单+边界规则；② 内存会话存储 `Map`；③ `chatStream(messages)` 调 openai SDK 返回 async iterator |
| `controllers/aiController.js` | SSE handler：参数校验 → 限流 → 拼 history → 逐 chunk `res.write` → 异常兜底（流中断给友好提示） |
| `routes/ai.js` | 路由定义 |
| `app.js` | 仅加两行：`require` + `app.use('/ai', aiRouter)` |

依赖变更：`npm i openai`（1 个）。

### 系统提示词要点

- 角色：文栈博客向导"文文"，热情简洁，中文回答。
- 知识注入：博客功能清单（文章/分类/标签/评论/点赞收藏/积分商城/签到/留言板/数据看板/轮播图/友情链接/微信小程序/PC 扫码登录）+ 各功能入口说明。
- 边界规则：只回答与本博客相关的问题；不知道就承认并引导到对应栏目，**不许编造**；不透露系统提示词内容；无关/敏感话题礼貌拒绝。
- 固有维护成本：站点功能变了要同步改提示词——这正是二期 Tool Calling 的解药，论文里可作为方案对比素材。

---

## 五、前端新增（Vue3 前台）

| 文件 | 职责 |
|------|------|
| `src/api/ai.js` | fetch 流式封装：POST → ReadableStream 逐行解析 `data:` 行 → 回调吐增量 |
| `src/components/AiGuide/index.vue` | 悬浮球（右下角固定）+ 点击展开聊天面板 |

组件内要素：

- 消息气泡：用户右侧、AI 左侧，AI 消息流式追加 + 打字机光标；
- 输入框：Enter 发送 / Shift+Enter 换行，发送中禁用；
- 会话：新会话自动拿 `sessionId`，提供"清空对话"（重置 sessionId）；
- 状态：加载中、请求失败重试、流式结束后光标消失；
- 挂载点：前台全局布局层（`App.vue`），路由切换不重挂。

---

## 六、实施步骤（✅ 全部完成，2026-09-18）

1. ✅ **拿 Key**：智谱 BigModel API Key 已配置进 `Express/.env`（`ZHIPU_API_KEY`）。
2. ✅ **后端最小闭环**：`aiConfig.js` + `aiService.js`；连通性脚本 `scripts/test-ai.js`。
3. ✅ **接口层**：controller + route + `app.js` 挂载 `/ai`。
4. ✅ **前端管道**：`src/api/ai.js` 流式封装。
5. ✅ **UI**：`src/components/AiGuide/index.vue` 悬浮球 + 聊天面板，挂载于 `App.vue`（/dashboard 下自动隐藏，适配暗色主题）。
6. ✅ **提示词打磨 + 边界测试**：`scripts/test-ai-guide.js` 五组用例全过（多轮记忆 / 越界拒绝 / 防套提示词 / 空问题 400 / IP 限流 429）。
7. ⬜ **部署检查（上线时做）**：生产 nginx 反代该路径需 `proxy_buffering off`（或依赖 `X-Accel-Buffering: no` 响应头）。

---

## 七、工作量

| 部分 | 耗时 |
|------|------|
| 后端（config + service + SSE 接口） | 0.5~1 天 |
| 前端（流式封装 + 聊天窗组件） | 1 天 |
| 联调 + 提示词调优 + 边界测试 | 0.5 天 |
| **合计** | **2~3 天业余时间** |

---

## 八、已知坑位（提前规避）

1. **SSE 被 nginx 缓冲**：现象是"转圈很久后一次性出全文"。解法：响应头 `X-Accel-Buffering: no` + nginx `proxy_buffering off`。
2. **Vite dev proxy**：本地开发若走代理，确认没开会缓冲流的转换；直连 8021 最稳。
3. **API Key 泄露**：Key 只走环境变量。~~`common/config.js` 明文提交数据库密码~~ → 已改造为 `.env` 配置（2026-09-18，模板见 `Express/.env.example`），但 `|| ` 后仍保留旧明文回退值以兼容已部署环境；**待办：在服务器换掉数据库密码 → 新密码只写进 `.env` → 删除代码里的回退值**（旧密码已进 git 历史，只有换密码才是真修复）。
4. **内存会话重启即失**：方案一接受；二期落库。
5. **免费额度并发限制**：GLM-4-Flash 有并发上限，限流阈值别设太高。

---

## 九、二期预告（Tool Calling）

会话记忆落库 + 工具接入现有 services：`articleService.getList`（搜文章）、`categoryService`（分类）、热门文章、站点功能实时查询。模型自主决定调哪个工具，回答从"背提示词"升级为"查真数据"，顺带根治功能清单与提示词不同步的问题。RAG（文章正文语义问答）放三期。

---

## 十、实施记录（2026-09-18）

### 新增/改动文件

| 文件 | 说明 |
|------|------|
| `Express/common/aiConfig.js` | 模型/限流/记忆配置，Key 读环境变量 |
| `Express/services/aiService.js` | 系统提示词（依据 docs/功能模块.md 撰写）、内存会话、fetch 流式调用 |
| `Express/controllers/aiController.js` | SSE 接口：参数校验 → IP 限流 → 逐 delta 推送 → 异常兜底 |
| `Express/routes/ai.js` + `app.js` | 挂载 `POST /ai/chat/stream` |
| `Vue3/src/api/ai.js` | fetch + ReadableStream 解析 SSE |
| `Vue3/src/components/AiGuide/index.vue` | 悬浮球 + 聊天面板（暗色适配、/dashboard 隐藏） |
| `Vue3/src/App.vue` | 挂载 AiGuide |
| `Express/scripts/test-ai.js` | 模型连通性/流式验证脚本 |
| `Express/scripts/test-ai-guide.js` | 端到端五用例测试脚本（需先启动服务） |

### 模型实测结论（免费档）

- `glm-4-flash-250414`：**默认**，直出模型 ~200ms 首包，稳定；
- `glm-4.7-flash`：免费但当时限流严重（错误码 1302，请求被排队挂起）；
- `glm-4.5-flash`：推理模型，回答前先思考，聊天场景延迟高。
- 限流按模型独立计数，被限时改 `aiConfig.model` 一行即可切换。

### 踩坑记录

1. **Node 的 `req.on('close')` 在请求体读完时就触发**（不是客户端断开），会瞬间 abort 掉大模型请求；SSE 中断检测必须挂 `res.on('close')`。
2. **Windows 下 curl 发中文 JSON 是 GBK 字节**，服务端按 UTF-8 解析成乱码导致模型答非所问——测试中文接口一律用 Node/浏览器客户端（`test-ai-guide.js` 即为此而生）。
3. **智谱免费档限流按模型独立**：1302 错误 = 触发速率限制；流式请求被限时可能表现为"挂起不响应"而非立刻 429，`aiService` 里用 `AbortSignal.any` + 60s 超时兜底。
4. 免费模型有并发数限制，浏览器实测打字机效果正常（<1s 完成），个人博客场景绰绰有余。
5. **服务器是宝塔 Node v14.19.1**：没有全局 `fetch`（15+）、`AbortController`（15+）、`AbortSignal.timeout`（17+）、`AbortSignal.any`（20+）。AI 模块已改造为 Node 14 兼容：`axios`（`responseType: 'stream'` + CancelToken）代替 fetch/Abort 体系，中断协议改为普通标记对象 `{ cancelled, cancel() }`，本地（Node 24）与服务器（Node 14）均可运行。长期建议：宝塔把 Node 升到 18/20 LTS（升级后需删 node_modules 重装，重建 bcrypt 等原生模块）。

---

## 附：Express 后端模块现状评估（2026-09-18）

**结论：整体不乱，分层清晰（routes → controllers → services → common），services 层尤其整齐（命名统一、参数化查询、事务封装齐全）。不需要"整合重构"，AI 模块顺着现有分层加文件即可，零侵入。**

发现的小问题（均为顺手清理级，不阻塞 AI 开发）：

1. ~~**controllers 有 6 个旧版死文件**~~ ✅ 已删除（2026-09-18，删前全仓 grep 确认零引用）：`articles.js`、`categories.js`、`friendslink.js`、`messages.js`、`otherswitch.js`、`user.js`。
2. **命名两代混杂**：新代统一 `xxxController.js`，旧代是 `activity.js` / `uploadJPG.js` / `wechatlogin.js` 这类裸名；新代码按新代风格走即可，存量不必强行统一。
3. ~~**两个假 npm 包**~~ ✅ 已卸载（2026-09-18）：`fs`、`path` 从 package.json 移除，冒烟测试通过（`node -e "require('./app.js')"` 模块全量加载正常）。注意 `ejs` 不能删：`routes/index.js` 的 `/` 首页仍在用它渲染 `views/index.ejs`。
4. ~~**config.js 明文数据库密码已入库**~~ ✅ 已改造 `.env` + dotenv（2026-09-18），回退值待换密码后删除（见坑位 3）。

---

## 二期实施记录（2026-09-19，✅ 已完成并全部验证）

### 交付内容

1. **环境与数据**：本地 `.env` 切开发库 `wztest-ai`（正式库 wztest 零接触，已只读验证零污染）；`config.js`/`pool` 支持 `DB_PORT`；迁移 `sql/migrations/03-ai-session-stats.sql` 建成 `wz_ai_sessions`/`wz_ai_messages` 并已在开发库执行；**14 篇空壳文章补全真实内容**（id 3,4,5,7,8,9,10,11,12,13,14,15,16,19，466~1307 字符 HTML，脚本 `scripts/fill-article-content.js`）。
2. **会话落库**：`aiSessionService.js`（ensure/getMessages/append）替换一期内存 Map；新增 `GET /ai/history` 会话回放；前端 sessionId 存 localStorage，刷新自动恢复对话。
3. **Tool Calling**：`aiTools.js` 工具注册表（search_articles / list_categories / list_tags / get_hot_articles / get_article_detail / get_site_overview，全部复用现有 services，schema 与 handler 分离）；`aiService.chatWithTools`（轮 1 非流式带工具）+ `chatStream`（轮 2 流式收口，不带工具）；SSE 新增 `{tool}` 状态事件；轮 1/轮 2 均支持客户端断开取消（CancelToken）。
4. **前端**：markdown-it + DOMPurify 渲染 AI 回复（链接自动新窗口）；工具调用状态行"🔎 正在查询…"；AI 文章引用为可点击完整链接。
5. **看板统计**：`GET /dashboard/token/ai-stats`（总提问/今日提问/近 7 日趋势/工具 Top5）；BlogBoard.vue 新增"AI 向导使用统计"卡（趋势图复用 renderLineChart）。

### 验证结果

| 项目 | 结果 |
|------|------|
| 工具单测 `test-ai-tools.js` | 14/14 通过 |
| e2e `test-ai-guide.js` | 6/6 通过（多轮记忆/拒答/防套提示词/400/工具触发+链接/限流） |
| 质量评估 `ai-eval.js`（20 题） | 18/20 = 90% 达标（2 个失败项为断言过严，修正后预期 20/20） |
| 接口边界 | 伪造 sessionId/无参/超长 501 字/纯空格/非法 JSON 全部正确处理 |
| 数据完整性 | 128 条消息 0 孤儿，message_count 一致 |
| 正式库隔离 | wztest 无 AI 表、文章内容保持空壳原样 |
| 看板接口 | getAiStats 聚合正确（58 条消息、工具 Top 排序） |

### 二期新增踩坑记录

6. **挂上 tools 后模型边界感变弱**：glm-4-flash 在带工具定义时更容易顺从越界请求（肯写快排代码了）。对策：系统提示词的拒绝规则给出具体示例（"写快排代码"应如何回应），强化后回归通过。
7. **categoryService 没有 findByName**（tagService 有）：工具里按名称找分类需从 findAll() 结果自行匹配。
8. **Node 14 兼容的流式中断全套方案**：非流式轮与流式轮统一用 `{ cancelled, cancel() }` 标记对象 + axios CancelToken；流式监听 `res.on('close')`（不是 `req`），非流式靠 axios timeout 60s 兜底。

### 部署

见 **docs/AI向导-二期部署.md**（覆盖文件清单、wztest 执行 03 迁移、验证清单、环境矩阵）。

### 二期增补（2026-09-19 晚，用户实测反馈）

9. **复合问题短板**（"有哪些 Vue 的文章？大概讲了什么？"只答一半）：一期工具链只有单轮。已升级为**最多两轮链式工具**（先搜索→再 get_article_detail 读内容），`search_articles` 结果增加 `contentExcerpt` 正文摘录（120 字）让单轮也能答内容，系统提示词增加复合问题分步引导。实测两条路径均通过：单轮搜索+摘录直答；两轮链式（search_articles → get_article_detail）详细回答文章配置要点。
10. **微信内置浏览器兼容**：安卓微信 X5 内核无 `ReadableStream` → `api/ai.js` 降级为一次性读全文解析（打字机观感不变）；`vite.config.js` 构建目标降为 es2018（旧 X5 遇 ES2020 语法白屏）；移动端输入框 16px 防 iOS 聚焦缩放；触控目标加大。详见 docs/AI向导-二期部署.md 第五节。

### 二期增补 2（2026-09-19 晚，步骤时间线 UI）

11. **执行步骤时间线**：AI 回答前在气泡内显示竖向步骤时间线，随 SSE 事件动态生长——「理解与分析问题」→「查询站内数据（带实际动作提示，如'正在查询热门文章…'，链式时变'正在阅读文章内容…'）」→「整理并组织回答」。实现要点：纯前端驱动（SSE 事件映射，零后端改动）；`{tool}` 事件触发插入查询步骤、首个 `{delta}` 触发整理步骤；纯聊天自动退化为 2 步；完成后 0.9s 收起为一行「✓ 已完成 N 个步骤」；支持 error 状态（红点）。采样数据：409ms 出第 1 步 → 818ms 出第 2 步 → 5.7s 出第 3 步 → 8.5s 收起。移动端时间线宽 299px（375px 视口）完整显示。
12. **复合问题升级为两轮链式工具**：控制器工具循环化（MAX_TOOL_ROUNDS=2，单轮可并行多工具），`search_articles` 结果增加 `contentExcerpt` 正文摘录（120 字）使单轮即可回答"大概讲了什么"；系统提示词加复合问题分步引导。实测："有哪些 Vue 文章？讲了什么？"单轮直答；"找 Nginx 文章详细介绍配置"走 search → detail 链式并详述内容要点。

### 二期增补 3（2026-09-19 晚，工具调用守卫）

13. **畸形输入下模型跳过工具的守卫**：用户实测发现，把"有没有关于 mysql 的文章？讲了什么？"重复粘贴多遍后，模型会跳过工具直接凭空回答"没有找到"（正常表述不受影响）。定性为模型指令遵循短板而非代码 bug。对策（工具调用守卫模式，生产 AI 应用常见做法）：涉站点数据的问题若模型未调用工具就想回答，强制打回重试一次（`SITE_DATA_INTENT` 正则粗判意图 + 追加纠偏消息）。复测同一条畸形输入：正确触发 search_articles、找到《MySQL 索引优化实践》并给出 `/detail?id=3` 链接；普通问题零误伤。评估用例增至 21 个（含畸形输入回归用例）。

### 二期收尾（2026-09-19 深夜，最终基线）

14. **趋势图日期时区偏移修复**：SQL 的 `DATE()` 返回 Date 对象，JSON 序列化为 UTC 后前端 `slice(5)` 截取的标签会差一天。三处趋势查询（用户/文章/AI）统一改 `DATE_FORMAT(created_at, '%Y-%m-%d')` 直接返回字符串。
15. **最终评估基线**：加入工具调用守卫与畸形输入用例后，`ai-eval.js` 21 题全量通过（普通 8/8、工具 9/9、边界 4/4，**100%**）。此数字为论文/答辩的最终基线。

### 二期增补 4（2026-09-19 深夜，列表页体验复查）

14. **重复的每页条数选择器移除**：文章页工具栏下拉（5/10/20/50）与底部 n-pagination 的 size-picker 功能重复，移除后者的 `page-sizes/show-size-picker`，条数选择唯一入口收敛到工具栏；页码导航保留。
15. **URL 参数回灌 bug 修复**：`syncToQuery` 原先只写 page/pageSize、展开保留旧 query，导致从归档页带 tag_id/year/month 进来后，用户切换筛选会被 URL 陈旧参数"回灌"还原。修复：tag_id/year/month 随 pageInfo 一并写入 URL，空值删除；watch 的对比条件同步补齐 year/month。
16. **首页分页记忆决策：不做**。首页定位是"最新内容门户"（摘要+推荐位），用户从首页进详情通常只看单篇，返回首页看最新即可；完整浏览/筛选/分页记忆场景已由文章页覆盖，且首页 URL 加参数有损分享语义。

### 二期增补 5（2026-09-20，微信分享适配 + 全局分页中文化）

17. **微信分享卡片适配（无 JS-SDK 方案）**：`index.html` 补全 Open Graph + itemprop meta（og:title/description/image/url、site_name）与优化 description；新增默认分享封面 `Vue3/public/share-cover.png`（500×500，取自站点轮播图，微信不识别 SVG 缩略图故必须 PNG/JPG ≥300px）；body 顶部隐藏 `<img>` 兜底微信"抓第一张可见图"的取图规则。边界说明：SPA + hash 路由下微信不执行 JS 且 hash 不发服务端，所有页面共享默认卡片、无法每篇文章独立卡片；完全自定义卡片需认证服务号 + JS-SDK 签名接口（三期可选，需公众号资质）。每篇文章动态标题已由 `Detail.vue` 的 `document.title` 覆盖（浏览器标签/部分客户端生效）。
18. **全局分页文案中文化**：根因是 naive-ui 未配置中文 locale（分页显示 "x / page"、"跳至" 英文）。`App.vue` 顶层包 `n-config-provider :locale="zhCN" :date-locale="dateZhCN"`，全部组件（前台首页分页、后台表格分页、日期选择等）统一为简体中文。首页条数选择显示 "5 / 页"；文章页工具栏下拉保持"5 篇/页"（文章量词），语义一致不再混英文。

### 二期增补 6（2026-09-20，归档筛选锁定 bug + 分页边界处理）

19. **归档筛选"锁定"修复**：从归档页进入文章页后，URL 携带的 year/month 无法通过任何 UI 解除（刷新永远保持归档状态）。根因是筛选状态同步进 URL 后缺少解除入口。修复：侧栏"当前筛选"卡新增「✕ 清除筛选」按钮（存在激活筛选时显示），一键清空 year/month/tag/category/keyword 并重置第 1 页、同步 URL；刷新后保持"全部文章"。语义区分：刷新 = 保持当前状态（含分享场景），清除按钮 = 主动解除。
20. **category_id 纳入 URL 同步**：原实现 tag/year/month 持久化而 category 不持久化（不一致，选分类后刷新丢失）。现已四项筛选全量同步，空值从 URL 删除，watch 对比条件补齐。
21. **页码越界自动回退**：URL 手改 page=99 或筛选变化导致页码超界时，检测到空列表且 page > totalPages 自动回退到最后一页重新拉取，不再显示空白列表。

### 二期增补 7（2026-09-20，后台管理页视觉统一）

22. **后台页面视觉统一**：积分商城页补齐页面大标题（与数据看板/AI 会话管理同款 board-header：图标 + 标题 + 描述），原 n-card 标题移除；AI 会话管理页分页从表格内置改为底部独立分页条（pagination-wrap：页码导航 + 条数选择 10/20/50 + "共 N 条"），与文章/分类/标签/友链/积分商城管理页完全统一。至此全部后台管理页为统一模式：页面大标题 → 内容区 → 底部分页条。

23. **AI 会话管理三段式布局**：整页 flex（header 固定顶部 / 卡片填充剩余高度 / 卡片内三段：工具栏固定、表格区 `card-body-scroll` 独立滚动、分页条 `flex-shrink:0` 固定底部），布局模式与积分商城 `card-body-scroll` 方案对齐。任意屏幕高度下分页条始终贴底可见，表格区域独立滚动不推挤分页。排查提示：vite HMR 部分应用时会出现新旧 DOM 混搭的假象，重启 dev server 后以全新加载为准。

### 二期增补 8（2026-09-20，老博客文章迁移完成）

24. **旧库直连迁移**：迁移源选定旧博客数据库（直连比 API 爬虫全量——API 会过滤回收站/隐藏文章，实际库内 40 篇 vs API 可见 29 篇）。旧库凭据存本地 `.env` 的 `OLD_DB_*`（gitignored），迁移脚本全程只读旧库。工具表映射：默认分类→其他、前端技术→前端开发、后端技术→后端开发、小程序/安卓技术→移动端、运维→Linux、网站测试→技术杂谈、闲聊/薅羊毛→其他/生活随笔。
25. **迁移结果**：40 篇全量入开发库 wztest-ai（27 展示 + 2 置顶 + 11 回收站原样保留），49 张旧站图片本地化到 `upload/migrated/`（2 张失败保留原地址并告警），summary 自动取正文纯文本前 100 字，按 title 查重。迁移后开发库共 62 篇（44 展示 + 3 置顶 + 15 回收站）。注意：迁移文章使用新库自增新 id（旧 id 不保留）；置顶文章「建行外卖优惠集合」会出现在首页置顶位，用户可自行调整。脚本 `scripts/migrate-old-articles.js` 支持 dry-run/--apply，可重复执行（title 查重跳过）。
26. **编辑器决策记录**：写作侧保持 WangEditor 富文本（存 HTML，v-html 渲染链路成熟），AI 回复保持 markdown-it（独立链路），两者互不冲突。备选：详情渲染加"HTML/MD 双格式智能判断"、后台换 md-editor-v3——均列为三期可选，当前不做。

### 二期增补 9（2026-09-20 深夜，时间格式统一 + 迁移时间校验）

27. **时间显示统一 24 小时制**：全后端 31 处 `toLocaleString()`（美式 "10/19/2025, 2:59:56 AM" 格式）统一替换为公共函数 `common/utils.formatDateTime()`（输出 `YYYY-MM-DD HH:mm`），覆盖文章卡片/详情、评论、留言、收藏、积分订单、用户列表、看板排行、扫码会话、AI 会话管理等全部接口输出。涉及 14 个文件，node --check 全过、toLocaleString 零残留。
28. **迁移文章时间全量校验修正**：40 篇迁移文章逐一与旧库原值比对，created_at/updated_at 全部对齐旧库初始时间（修正 2 篇因访问触发 ON UPDATE 而漂移的记录）。结论：迁移本身时间同步是成功的，此前"时间不对"的观感来自美式格式 + 访问触发的 updated_at 漂移，二者均已处理。

### 二期增补 10（2026-09-20 深夜，文章排序修复）

29. **列表排序从 id 改为发布时间**：迁移把 2023~2025 年的旧文章追加到 id 23~62，`ORDER BY id DESC` 的隐含假设（id 顺序=发布顺序）被打破，导致列表前几页全是旧文章、新文章沉底。修复：`articleService.getList` 排序改为 `置顶优先 → created_at DESC → id DESC`。实测 62 篇跨 4 页严格按发布时间递减，置顶内部同样按时间倒序。教训：**任何"按 id 排序≈按时间排序"的假设，在补录历史数据后都会失效**——时间排序应显式用时间字段。

### 二期增补 11（2026-09-20 深夜，用户注销换绑落地）

30. **用户注销/删除策略落地（占位账号换绑方案）**：新增迁移 `sql/migrations/04-user-deletion-rebind.sql`（占位账号「已注销用户」deleted-user，status=0 停用不可登录 + 随机哈希双保险；`wz_articles/wz_points_orders/wz_user_points_log` 三个外键 CASCADE → RESTRICT）。`userService` 新增 `ensurePlaceholderUser/getPlaceholderUserId/rebindContentToPlaceholder`（换绑前先清理占位重复点赞防撞唯一键），`remove` 重写为「换绑 → 删行」；`deleteUser` hard 分支先换绑再删。修复历史 bug：原 `remove` 的 `SET author_id = NULL` 对 NOT NULL 列必失败——发过文章的用户 hard 删除从来都是 500。实测闭环：建测试用户+发文+点赞 → hard 删除 → 文章保留且作者=占位(#29)、点赞归占位、用户行删除、无报错。删除语义说明：默认（不带 hard=1）为停用（status=0，内容天然保留）；hard=1 为彻底删除（内容归「已注销用户」）。正式库上线时同步执行 04 迁移。

### 二期收尾补录（2026-09-21，全站冒烟 + 构建验证）

31. **接口冒烟脚本 `scripts/smoke-api.js`**：覆盖访客公开接口 10 个（站点配置/分类/标签/轮播/友链/文章列表/归档/排行/详情/积分商品）+ AI 向导 3 个 + 后台管理 7 个 + 越权兜底 2 个（编辑 403、无 token 401）。用法：启动服务后 `node scripts/smoke-api.js`。**当前基线 22/22（100%）**——发布任何改动后跑一遍，核心流程不报错就有自动化兜底。
32. **生产构建验证**：`npm run build` 通过（es2018 target 下全部新代码编译成功），dist 产物已更新。构建时的 chunk >500KiB 警告为既有优化建议（WangEditor/ECharts 体积），非错误。

### 全站体检收尾（2026-09-21）

33. **时间格式统一 24 小时制**：全后端 31 处 `toLocaleString()`（美式格式）统一替换为 `common/utils.formatDateTime()`（`YYYY-MM-DD HH:mm`），覆盖文章/评论/留言/收藏/积分/用户/看板/AI 会话等全部接口输出，14 个文件批量改造后 node --check 全过、零残留。
34. **迁移时间校验修正**：40 篇迁移文章逐一与旧库比对，created_at/updated_at 全部对齐旧库原值（修正 2 篇因访问触发 ON UPDATE 漂移的记录）。
35. **接口冒烟脚本 `scripts/smoke-api.js`**：22 个接口断言（访客 10 + AI 3 + 后台 7 + 越权 2）全过。发布改动后跑一遍即为回归兜底。
36. **生产构建验证**：`npm run build` 通过（es2018 target），dist 产物就绪；chunk >500KiB 警告为既有优化建议非错误。

### 体验修复（2026-09-21，登录/注册密码明文切换）

37. **密码框无"眼睛"切换 bug 修复**：naive-ui 的 n-input 需要**显式设置 `show-password-on="click"`** 才会渲染明文/密文切换图标（默认 null = 无眼睛），Login.vue 共 5 处密码框（登录/注册/确认密码/找回新密码/找回确认密码）全部补上。实测点击眼睛 input.type 在 password/text 间正常切换。换库方案同步敲定：上线直接将服务器 .env 指向 wztest-ai（站长确认近期无数据变化，原 wztest 保留作回滚备份）。

### 全量体检报告（2026-09-21，提交前最终检查）

**结论：无重大 bug 或逻辑错误，达到可交付/可上线状态。**

| 检查维度 | 结果 |
|----------|------|
| 后端语法（services/controllers/routes/common/scripts 全量） | node --check 全过 |
| Node 14 兼容 | 运行时代码零残留（AbortController/fetch 仅存注释） |
| 接口冒烟 smoke-api.js | 22/22（100%） |
| AI 工具单测 test-ai-tools.js | 14/14 |
| 生产构建 vite build（es2018） | 通过，dist 就绪 |
| 数据完整性 | 62 篇文章（44 展示+3 置顶+15 回收站）、AI 消息 0 孤儿、占位账号 #29 正常 |
| 迁移文章时间 | 40 篇已全量对齐旧库原值（修正 2 篇访问漂移） |
| 唯一发现 | 2 篇同名回收站文章《预备党员转正申请书》（旧库历史遗留，均不展示，无功能影响） |

### 体验修复（2026-09-21，回收站文章越权访问）

38. **回收站文章可被 id 遍历访问修复**：公开详情端点 `GET /articles/:id` 原先不过滤 status，改 URL id 即可读回收站（已删除）文章全文，且阅读量接口照常计数。修复：`articleService.getById` 新增 `publicOnly` 选项（SQL 追加 `status IN (0,1)`）；公开详情、阅读量计数、AI 工具（get_article_detail/搜索摘录）全部启用 publicOnly——回收站文章对访客与 AI 均不可见（公开访问返回"文章走丢了"兜底），后台编辑/恢复路径不受影响（仍走无过滤的 getById）。实测三种访问端行为符合预期。安全说明：这属于"失效访问控制"类漏洞（OWASP A01），修复前任何知道/遍历 id 的人都可读取已删除内容。

### 体验修复（2026-09-21，迁移文章图片裂图修复）

39. **迁移文章正文图片裂图根因与修复**：迁移脚本按站点约定把旧图改写为相对路径 `/upload/migrated/…`（正确），但 `Detail.vue` 正文是 `v-html` 直出——浏览器把相对路径解析到**前端 dev 端口（5173）**而非后端（8021），必然 404。修复：`Detail.vue` 渲染前用 `resolveContentAssets()` 把 `src/href` 里 `/upload/` 开头的相对地址补全为 `VITE_BASE_URL` 域名（生产=wzapi）。同款问题一并修复：前台积分商城商品图（`PointsShop.vue` assetUrl 补全）。验证：#39 文章 7 张图全部加载成功（含本地化图与合法外链）。注意：服务器部署时 `Express/public/upload/migrated/` 目录随 git 一起同步即可。
