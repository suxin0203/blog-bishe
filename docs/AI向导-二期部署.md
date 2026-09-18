# AI 向导二期 · 部署文档

> 创建时间：2026-09-19
> 前置文档：docs/AI向导-方案一设计计划.md（一期 + 二期实施记录）
> 本期核心：Tool Calling（查真实数据）+ 会话落库 + 前端 Markdown + 看板 AI 统计 + 文章内容补全

---

## 一、环境矩阵（重要）

| 环境 | 数据库 | 配置位置 | AI 表 |
|------|--------|----------|-------|
| 本地开发 | `wztest-ai`（正式库克隆，随便折腾） | 本地 `Express/.env`（已配置） | 已建 |
| 线上生产 | `wztest`（正式库，严禁误写） | 服务器 `Express/.env`（沿用一期，无需改 DB 配置） | **部署时执行 03 迁移** |

环境隔离机制：代码无任何环境开关，靠各环境自己的 `.env` 文件区分（十二要素做法）。本地 `.env` 已指向 `wztest-ai`，服务器 `.env` 保持 `wztest`。**两个 .env 的 `ZHIPU_API_KEY` 相同。**

---

## 二、本期改动文件清单

### 后端新增
- `Express/services/aiTools.js` — 工具注册表（6 个工具：搜文章/分类/标签/热门/详情/站点统计），schema 与 handler 分离
- `Express/services/aiSessionService.js` — 会话持久化（wz_ai_sessions / wz_ai_messages）
- `Express/scripts/test-ai-tools.js` — 工具单测（14 断言）
- `Express/scripts/ai-eval.js` — 20 题质量评估（普通 8 / 工具 8 / 边界 4）
- `Express/scripts/fill-article-content.js` — 文章内容补全（已对开发库执行，保留作记录）

### 后端修改
- `Express/services/aiService.js` — 移除内存会话；新增 `chatWithTools`（工具轮非流式）；系统提示词加工具规则与防越界强化
- `Express/controllers/aiController.js` — 两轮工具协议编排、SSE 新增 `{tool}` 事件、会话落库、新增 history
- `Express/routes/ai.js` — 新增 `GET /ai/history`
- `Express/services/articleService.js` — 导出 `getTopBy`、`stripHtml`（供工具复用）
- `Express/services/dashboardService.js` + `controllers/dashboardController.js` + `routes/dashboard.js` — 新增 `GET /dashboard/token/ai-stats`
- `Express/common/config.js` — 新增 `DB_PORT`（默认 3306）

### SQL
- `sql/migrations/03-ai-session-stats.sql` — `wz_ai_sessions` / `wz_ai_messages` 建表（开发库已执行）

### 前端
- `Vue3/package.json` — 新增 `markdown-it`、`dompurify`
- `Vue3/src/api/ai.js` — 新增 `fetchHistory()`
- `Vue3/src/api/api.js` — 新增 `getDashboardAiStats()`
- `Vue3/src/components/AiGuide/index.vue` — Markdown 渲染（DOMPurify 消毒）、工具状态行、sessionId 存 localStorage + 刷新恢复
- `Vue3/src/views/dashboard/BlogBoard.vue` — 新增"AI 向导使用统计"卡（指标 + 近 7 日趋势图 + 工具调用 Top）

---

## 三、服务器部署步骤

```bash
# 1. 覆盖 Express 文件夹（排除 node_modules 和 .env），覆盖 Vue3 源码重新构建
#    本地先：cd Vue3 && npm i markdown-it dompurify && npm run build

# 2. 服务器装新依赖
cd /www/wwwroot/wzBlog/Express
npm install markdown-it dompurify   # 后端其实没用这俩，这步可跳过
npm install                          # 保险起见（本期后端无新增运行时依赖，axios/dotenv 已有）

# 3. 在正式库 wztest 执行 03 迁移（可重复执行，幂等）
mysql -uwztest -p wztest < sql/migrations/03-ai-session-stats.sql
# 或用宝塔数据库管理界面粘贴执行该文件内容

# 4. 确认服务器 .env 的 ZHIPU_API_KEY 存在（一期已配则不用动）

# 5. 重启 Node 项目

# 6. 前端 dist 覆盖站点目录
```

### 验证清单
- [ ] 线上站问"博客里有哪些关于 Redis 的文章？"→ 回答含真实文章标题和 `https://wzblog.suxin23.cn/#/detail?id=7` 链接，点击能打开详情
- [ ] 刷新页面 → 对话自动恢复
- [ ] 后台数据看板 → 出现"AI 向导使用统计"卡
- [ ] 管理后台正常登录（bcrypt 未受影响）
- [ ] 服务器日志无 `AbortController is not defined`（本期代码已兼容 Node 14）

---

## 四、已知边界与三期备选

1. 无工具问题的首字延迟 1~3s（轮 1 非流式换实现可靠），三期可升级流式 tool_call 拼装；
2. 工具链上限 2 轮（支持"先搜索→再读详情"的链式复合问题，单轮可并行多个工具调用），更多轮次的深度推理放三期；
3. AI 会话表不做物理清理，长期运行需归档策略；
4. 评估基线：`node scripts/ai-eval.js` 21 题（含畸形输入回归用例）**全量通过（100%）**——含工具调用守卫后的最终基线。

## 五、移动端与微信内置浏览器兼容（2026-09-19 增补）

| 项目 | 处理方式 |
|------|----------|
| 安卓微信 X5 内核无 `ReadableStream` | `api/ai.js` 检测 `res.body.getReader` 不存在时，降级为一次性读取全文解析（前端打字机缓冲保证观感一致） |
| 旧 X5 不支持 ES2020 语法（可选链等，会白屏） | `vite.config.js` 构建 target 降为 `es2018`，esbuild 编译产物覆盖全部依赖 |
| iOS 输入框聚焦自动放大页面 | 移动端输入框字号 16px（≥16px 不触发缩放） |
| 刘海屏/底部横条 | `viewport-fit=cover` + `env(safe-area-inset-*)` 内边距 |
| 动态视口（地址栏收放） | 面板高度 `100vh` 回退 + `100dvh` |
| 触控目标 | 发送按钮高 39px、图标按钮 30px、建议问题 chips 加高 |

验证方式：手机微信内打开站点（或电脑 Chrome DevTools 设备模拟 + 自定义 UA 含 MicroMessenger），跑一轮"有哪些 Vue 文章？讲了什么？"看多轮工具链与链接跳转。
