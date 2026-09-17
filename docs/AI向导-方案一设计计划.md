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

---

## 附：Express 后端模块现状评估（2026-09-18）

**结论：整体不乱，分层清晰（routes → controllers → services → common），services 层尤其整齐（命名统一、参数化查询、事务封装齐全）。不需要"整合重构"，AI 模块顺着现有分层加文件即可，零侵入。**

发现的小问题（均为顺手清理级，不阻塞 AI 开发）：

1. ~~**controllers 有 6 个旧版死文件**~~ ✅ 已删除（2026-09-18，删前全仓 grep 确认零引用）：`articles.js`、`categories.js`、`friendslink.js`、`messages.js`、`otherswitch.js`、`user.js`。
2. **命名两代混杂**：新代统一 `xxxController.js`，旧代是 `activity.js` / `uploadJPG.js` / `wechatlogin.js` 这类裸名；新代码按新代风格走即可，存量不必强行统一。
3. ~~**两个假 npm 包**~~ ✅ 已卸载（2026-09-18）：`fs`、`path` 从 package.json 移除，冒烟测试通过（`node -e "require('./app.js')"` 模块全量加载正常）。注意 `ejs` 不能删：`routes/index.js` 的 `/` 首页仍在用它渲染 `views/index.ejs`。
4. ~~**config.js 明文数据库密码已入库**~~ ✅ 已改造 `.env` + dotenv（2026-09-18），回退值待换密码后删除（见坑位 3）。
