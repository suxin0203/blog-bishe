# AI 向导二期 · 部署文档

> 更新时间：2026-09-21（换库方案版）
> 前置文档：docs/AI向导-方案一设计计划.md（一期 + 二期实施记录）、docs/AI向导-技术报告.md
> 本期核心：Tool Calling（查真实数据）+ 会话落库 + 前端 Markdown + 看板 AI 统计 + 文章内容补全 + 全站体验修复

---

## 〇、部署方案总览（换库版，站长已确认）

**不再"在正式库 wztest 执行迁移 SQL"，而是把开发库 wztest-ai 直接转正为生产库。**

理由：wztest-ai 的数据是正式库超集（原 22 篇 + 迁移 40 篇 + 全部新表 + 占位账号），换库零迁移操作、零失败风险、秒级回滚（.env 库名改回即可），原 wztest 自动成为历史备份。

- 回收站文章（含旧博客迁移的隐藏内容）保留不展示，是否删除由站长后续在后台自行决定；
- 上线前唯一检查：确认原 wztest 库在验证期间没有新增数据（个人博客通常没有，站长已确认近期无变化）。

---

## 一、环境矩阵（换库后）

| 环境 | 数据库 | 说明 |
|------|--------|------|
| 线上生产 | `wztest-ai`（原开发库转正） | 服务器 `.env` 指向它；已含 03/04 迁移、62 篇文章、占位账号 |
| 本地开发 | `wztest-ai` | 与生产同库（个人项目单实例，可接受） |
| 历史备份 | `wztest` | 原封保留，只出不进 |

环境隔离机制：代码无任何环境开关，靠各环境自己的 `.env` 文件区分。两个 .env 的 `ZHIPU_API_KEY` 相同。

---

## 二、本期改动文件清单

### 后端新增
- `Express/services/aiTools.js` — 工具注册表（6 个工具），schema 与 handler 分离
- `Express/services/aiSessionService.js` — 会话持久化（wz_ai_sessions / wz_ai_messages）
- `Express/scripts/test-ai-tools.js` — 工具单测（14 断言）
- `Express/scripts/ai-eval.js` — 21 题质量评估（普通 8 / 工具 9 / 边界 4）
- `Express/scripts/fill-article-content.js` — 文章内容补全（已对开发库执行）
- `Express/scripts/check-node-compat.js` — 服务器环境兼容检查（17 项）
- `Express/scripts/smoke-api.js` — 全站接口冒烟（22 断言）

### 后端修改
- `Express/services/aiService.js` — 移除内存会话；新增 chatWithTools；系统提示词强化；Node 14 兼容（axios 替代 fetch）
- `Express/controllers/aiController.js` — 两轮工具协议、`{tool}` 事件、会话落库、history
- `Express/routes/ai.js` — 新增 `GET /ai/history`
- `Express/services/articleService.js` — getById 支持 publicOnly（回收站屏蔽）；导出 getTopBy/stripHtml；update 支持部分字段；排序改 created_at
- `Express/services/userService.js` — 注销换绑（rebindContentToPlaceholder）+ 占位账号
- `Express/controllers/userController.js` — hard 删除前换绑；改密/重置后作废 refreshToken；找回校验对齐
- `Express/services/dashboardService.js` + `controllers/dashboardController.js` + `routes/dashboard.js` — 新增 `GET /dashboard/token/ai-stats`；趋势图日期 DATE_FORMAT 修复
- `Express/common/config.js` — 新增 `DB_PORT`（默认 3306）
- `Express/common/utils.js` — 新增 formatDateTime（24 小时制）

### SQL
- `sql/migrations/03-ai-session-stats.sql` — AI 会话两表（wztest-ai 已执行）
- `sql/migrations/04-user-deletion-rebind.sql` — 占位账号 + 外键收紧（wztest-ai 已执行）

### 前端
- `Vue3/package.json` — 新增 markdown-it、dompurify
- `Vue3/vite.config.js` — build target es2018（微信 X5 兼容）+ optimizeDeps.include dompurify
- `Vue3/index.html` — viewport-fit=cover + 微信分享 OG meta + 隐藏缩略图兜底
- `Vue3/src/api/ai.js` — fetchHistory + ReadableStream 缺失降级
- `Vue3/src/api/api.js` — getDashboardAiStats + AI 会话管理三接口
- `Vue3/src/components/AiGuide/index.vue` — 时间线、图片补全、密码眼睛、格式统一
- `Vue3/src/components/RichTextEditor.vue` — 图片地址双向转换（编辑器内绝对/库内相对）
- `Vue3/src/views/Detail.vue` — 正文图片地址补全；返回按钮三级策略
- `Vue3/src/views/Login.vue` — formRef 修复 + 5 处密码眼睛
- `Vue3/src/views/PointsShop.vue` — 商品图地址补全
- `Vue3/src/views/dashboard/BlogBoard.vue` — AI 统计卡
- `Vue3/src/views/dashboard/AiSessions.vue` — AI 会话管理页（新增）
- `Vue3/src/views/dashboard/Dashboard.vue` — 菜单加 AI 会话管理
- `Vue3/src/App.vue` — keep-alive（列表状态保持）+ n-config-provider 中文 locale
- `Vue3/src/components/RichTextEditor.vue`、`AiGuide` — 见上

---

## 三、服务器部署步骤（宝塔 + 手动复制流程）

### 本地准备
```text
1. cd Vue3 && npm run build        # dist 已是最新（本机已构建）
2. 整理上传包：Express 文件夹（排除 node_modules 和 .env）+ Vue3/dist
```

### 宝塔操作
```text
3. 上传覆盖 /www/wwwroot/wzBlog/Express
   ⚠️ 必须确认带上了 Express/public/upload/migrated/ 目录
   （迁移文章的 55 张图片在里面，漏了正文和商品图全裂）
4. 数据库：无需任何操作
   （换库方案：生产库就是 wztest-ai，03/04 已在其上执行过；
    原 wztest 保留不动作回滚备份）
5. 检查 .env：DB_NAME=wztest-ai、DB_USER/DB_PASSWORD 与本地 .env 相同
6. 终端：cd /www/wwwroot/wzBlog/Express && npm install --production
7. Node 项目管理器：重启项目
8. 前端 dist 覆盖站点目录
```

### 验证清单（按序）
- [ ] `node scripts/check-node-compat.js` 全 ✓（数据库连通确认已切 wztest-ai）
- [ ] `node scripts/smoke-api.js` 22/22 通过（部署后回归兜底）
- [ ] 首页/文章页文章数量变多（62 篇口径，含旧博客迁移内容），排序按发布时间递减
- [ ] AI 向导问"有哪些关于 Nginx 的文章？"→ 命中旧文章并给出 `#/detail?id=13` 链接，点击打开详情
- [ ] 刷新文章页 → 归档/筛选状态保持；侧栏"✕ 清除筛选"可一键解除
- [ ] 后台数据看板 → 出现"AI 向导使用统计"卡 → AI 会话管理页可查看/删除
- [ ] 管理后台正常登录（bcrypt 未受影响）+ 密码框眼睛切换可用
- [ ] 回滚预案：服务器 .env 的 DB_NAME 改回 wztest + 重启（原 wztest 库原封未动，秒级回滚）
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

---

## 六、后台 AI 会话管理（2026-09-19 增补）

- 新页面：后台侧边栏「数据与运营 → AI 会话管理」（`/dashboard/aisessions`，仅超管，编辑与普通用户不可见且接口 403）
- 功能：分页列表（用户/首问/消息数/最近活跃，支持按用户名、会话ID、提问内容搜索）→「查看」弹窗回放完整对话（含工具调用记录）→「删除」会话及全部消息（事务删除，不留孤儿数据）
- 后端接口：`GET /ai/token/sessions`、`GET /ai/token/sessions/:id/messages`、`DELETE /ai/token/sessions/:id`（控制器内二次校验 is_root，防止编辑角色越权）
- 代码高亮：AI 回复中的代码块已接入项目内 Prism（prism-tomorrow 暗色主题）

---

## 七、Node 14 → 24 LTS 升级指南（建议，与本地开发机版本一致）

**结论**：当前代码已双版本兼容（Node 14 可运行、本地 Node 24 全量测试通过），不升级不影响功能。但 Node 14 已于 2023-04 停止维护，为了后续开发顺畅建议升级。

### 步骤（宝塔面板）

1. 软件商店 → Node.js 版本管理器 → 安装 **v24.x LTS**（v22 亦可；本地开发机即 v24.16，服务器与开发环境同版本可消除版本漂移）
2. 将项目运行版本切换到新版本
3. **删除 node_modules 重装**（bcrypt 等原生模块必须匹配新 Node ABI）：
   ```bash
   cd /www/wwwroot/wzBlog/Express
   cp -r node_modules node_modules.bak      # 留回滚备份
   rm -rf node_modules
   npm install --production
   ```
   若 bcrypt 报权限/编译错误：`npm install bcrypt --build-from-source`，或修复目录权限后重试（bcrypt 5.x 是 NAPI 预编译，Node 14~22 通用，通常直接下载即可）
4. **运行兼容性检查**：`node scripts/check-node-compat.js`（17 项：Node 版本、14 个运行时依赖加载、bcrypt 哈希自比对、数据库连通）
5. 启动项目 → 验证登录、AI 向导一轮对话、看板统计
6. 回滚预案：切换回 v14 + `rm -rf node_modules && mv node_modules.bak node_modules`

### 升级依据（已排查）

- 后端运行时依赖 14 个在 Node 18/20/22 均有兼容版本；bcrypt 5.x 基于 NAPI v3 预编译，跨版本无需重编译源码
- AI 模块代码自二期起已做 Node 14 兼容（axios 代替 fetch），在新版 Node 上同样运行
- 本地开发机 Node 24 的全量测试（工具单测 14/14、e2e、评估 21/21）可作为升级后表现的参照
