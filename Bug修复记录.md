# Bug 修复记录

> 修复日期：2026-09-12
> 范围：Express 后端 / Vue3 前端 / 微信小程序 / 数据库 / 文档
> 性质：查漏补缺专项。所有修复在动手前均经过二次核实，关键项（轮播图、安卓微信扫码）做了线上复现与修复后回归。
> 关联文档：`项目清单.md`（项目结构索引）、`sql/migrations/02-normalize-image-urls.sql`（线上库迁移脚本）

---

## 一、轮播图"上传后丢失 / 线上空白"（用户报告）

### 根因（完整证据链，三处叠加）

1. **写入侧**：后台 `Adminset.vue` 上传成功后，把「当前环境的 API 域名」拼成绝对地址存库。本地存 `http://localhost:8021/...`，线上经 nginx 转发时 Host 头丢失变成 `http://127.0.0.1/...`。
   - 线上实测证据：`GET https://wzapi.suxin23.cn/swiper` 返回 `image_url: "http://127.0.0.1/upload/lbt/..."`，访客浏览器必然加载失败 → 轮播空白。
2. **读取侧**：`swiperController.getSwiperList` 返回数据前，又用「请求 Host」把地址改写成绝对地址——数据库即使是对的，经过 nginx（不回传 Host）也会被改坏。
3. **格式不一**：轮播上传接口返回 `upload/lbt/x.jpg`（无前导斜杠），富文本上传返回 `/upload/...`（有斜杠），前端各处拼接口径混乱。

### 修复内容

| 文件 | 改动 |
|------|------|
| `Express/services/swiperService.js` | 新增 `normalizeImageUrl()`：写入前统一归一化为相对路径 `/upload/...`，外链图片原样保留 |
| `Express/controllers/swiperController.js` | 删除读路径按 Host 拼绝对地址的逻辑，接口原样返回库中相对路径 |
| `Express/controllers/uploadJPG.js` | 轮播上传返回值统一为 `/upload/lbt/x.jpg`（与富文本一致）；图片列表接口同步改相对路径 |
| `Vue3/src/views/dashboard/Adminset.vue` | 上传改走 axios 实例（custom-request），上传后直接以返回的相对路径落库；后台预览前用 `resolveAssetUrl()` 补全域名 |
| `Vue3/src/components/MyCarousel.vue` | 无需改（已有相对路径拼接逻辑，相对路径方案下正好生效） |
| 小程序 `utils/util.js` | 无需改（`convertImageUrl` 本就支持相对路径补全，这也是"小程序轮播一直正常、PC 线上空白"的原因） |
| `sql/migrations/02-normalize-image-urls.sql` | 存量数据归一化脚本 |

### 数据修复（已实时生效于线上）

- **线上服务使用的就是 wztest 库**（决定性验证：线上服务创建的 `wz_qr_login_sessions` 记录与 wztest 完全一致；反向查询线上接口也能看到本地服务写入的会话行）。因此对 wztest 的数据修复即线上数据修复：
  - 轮播 1 条归一化为相对路径 `/upload/lbt/...`；
  - 21 个用户头像、2 条站点配置（default_avatar_url / site_logo_url）从 api.suxin23.cn 迁移到 wzapi.suxin23.cn；
  - 文章 19 正文中 1 处旧域名图片链接同步迁移。
- 全库一致性复扫（wz_swiper / wz_users / wz_otherswitch / wz_articles / wz_friendslink / wz_points_goods / wz_messages / wz_comments）：**8 张表零残留** 127.0.0.1 / localhost / api.suxin23.cn。
- 未迁移的 6 个用户头像为 QQ/微信第三方头像（qlogo.cn），属合法外链，无需处理。
- `sql/migrations/02-normalize-image-urls.sql` 保留为变更记录；第 3 节建表语句供全新环境使用。

### 遗留注意事项

- 若图片文件只在本地/线上其中一侧存在（两边文件系统不互通），路径修好后对应图片仍需手动同步文件本体。本仓库 `Express/public/upload/` 已纳入头像与站点 logo（见第三节），随代码部署即可。
- ⚠️ 头像域名已切到 wzapi，但 avatar.png / 站点 logo 文件要随**后端重新部署**才会上服务器——在部署完成前，数据库中指向 wzapi 的头像会 404（PC 端兜底头像已内置在前端包里不受影响）。请尽快部署后端。

---

## 二、安卓微信扫码登录生成二维码失败（用户报告）

### 根因（线上复现实锤）

- 用 290 字符的安卓微信 UA 调 `POST https://wzapi.suxin23.cn/qr-login/session`，稳定返回：
  `500: 创建扫码登录会话失败：Data too long for column 'user_agent' at row 1`；正常 UA 返回 200。
- 机理：安卓微信 WebView 的 UA 普遍超过 255 字符，`wz_qr_login_sessions.user_agent` 列是 `varchar(255)`，旧版服务端代码未截断，INSERT 直接失败 → 二维码生成失败。iPhone/桌面 UA 较短所以没事。
- **"之前修过又复发"的真相**：仓库代码里其实已有截断逻辑（`qrLoginSessionService.js`），但**线上服务一直没重新部署，跑的仍是旧代码**。

### 修复内容

| 文件 | 改动 |
|------|------|
| `Express/services/qrLoginSessionService.js` | 保留 255 截断；新增兜底：UA 写库失败（Data too long 类错误）时自动放弃 UA 重试插入——即使列被改短，二维码生成也不再失败 |
| `sql/migrations/02-normalize-image-urls.sql` | 第 3 节补上 `wz_qr_login_sessions` 建表语句（此前该表不在任何 SQL 文件中，新环境无从创建） |

### 回归验证

- 本地新代码 + 290 字符 UA：200 ✅；400 字符 UA：200 ✅。
- **线上彻底解决依赖重新部署后端**（这是关键动作，不部署修复不生效）。

---

## 三、默认头像/站点 Logo 依赖旧域名（关联隐患）

- 现状：`wzapi.suxin23.cn/upload/avatar.png` 实测 404，全站头像兜底仍指向旧域名 `api.suxin23.cn`（今日仍 200，但属单点依赖，旧域名下线即全站头像失效）。
- 修复：
  - 下载真实头像（128×128）与站点 logo（500×500）落库到仓库：`Express/public/upload/avatar.png`、`Express/public/upload/20260320/708c1ba2-....png`、`Vue3/src/assets/images/avatar-default.png`；
  - `Vue3/src/common/constants.js` 的 `DEFAULT_AVATAR_URL` 改为**前端内置资源**（不再依赖任何域名），`MyHeader.vue`（3 处）、`HomePage.vue`、`Dashboard.vue`（2 处）、`Users.vue`、`Adminset.vue` 占位文案全部改用该常量；
  - 数据库 `wz_users.avatar_url`（21 行）、`wz_otherswitch` 的 default_avatar_url/site_logo_url（2 行）已从 api.suxin23.cn 迁移到 wzapi.suxin23.cn（wztest 已执行，线上含在迁移脚本第 2 节）。

---

## 四、其他确认修复的 Bug

### 4.1 小程序 Token 自动刷新完全失效（功能性 P0）

- 证据：后端 `/users/refresh` 成功返回 `code: 200`（`userController.js`），小程序却判断 `res.data.code === 0`（`request.js:191`），条件永假 → 刷新必走"清登录态+踢回登录页"；且从 `res.data.data`（用户对象）解构 token，取值位置也是错的。
- 修复（`wenzhan_miniprogram/utils/request.js`）：改为 `code === 200 && res.data.token`，从 `res.data.token` 取值；后端不轮换 refreshToken，保留原值；并发 401 时统一进刷新队列，不再直接踢登录。
- 效果：小程序 2 小时 token 过期后无感续期，不再被强制重新登录。

### 4.2 积分下单无事务、可负积分/超卖（数据一致性 P0）

- 证据：`pointsService.createOrder` 原为 5 条独立 SQL，扣积分无余量条件。
- 修复：`common/utils.js` 新增 `withTransaction()`；下单全程事务 + `FOR UPDATE` 行锁 + `UPDATE ... AND points >= ?` / `AND stock >= ?` 条件扣减，以 affectedRows 判定成败；称号类商品的UserInfo更新改为事务内连接执行（避免行锁死锁）。

### 4.3 后台"其他设置"页 Linux 部署白屏（部署 P0）

- 证据：`router.js:133` 引用 `AdminSet.vue`，磁盘文件是 `Adminset.vue`，Windows 不敏感、Linux 构建直接失败。
- 修复：引用改为 `Adminset.vue`。已通过 `npm run build` 全量构建验证。

### 4.4 公开页 /show /table 游客访问被踢登录（演示 P0）

- 证据：两页调用 `/activity/token/`（管理员接口），游客 401 → 强制跳登录。
- 修复：后端新增公开接口 `GET /activity/public/list`（表不存在时返回空列表而非 500，`activity` 表本就不在标准建库脚本中）；两页前端切换至公开接口并补充 loading/异常兜底。

### 4.5 富文本/轮播上传 token 固化（P1）

- 证据：`RichTextEditor.vue`、`Adminset.vue` 在组件初始化时一次性读取 localStorage token，2 小时后上传必 401 且静默失败。
- 修复：全部改为 axios 实例上传（customUpload / custom-request），token 由拦截器实时读取、401 自动刷新。

### 4.6 请求层若干缺陷（P1）

- 403 错误双弹窗：`request.js` 两处 toast 合并为一处。
- 401 收尾死代码：`AdminStore.delToken(reload = true)` 支持不刷新页面，拦截器改为"清登录态 → 提示 → 软跳转登录页"。
- Pinia 模块顶层实例化隐患：`request.js` 改为懒获取 store。

### 4.7 JWT 密钥散落定义（安全口径 P2）

- 5 处各自定义（其中 `controllers/user.js` 连环境变量回退都没有），统一收敛到 `Express/common/jwt.js`，全部改为一处引用。

### 4.8 清理项（P2）

- 删除：`Vue3/src/views/MobilePage/index copy.vue`（整页副本）、`Vue3/src/views/BulletinBoard/components/MenuTest.vue`（零引用组件）。
- 移出路由（文件保留）：`/check199`（按钮永久 disabled 的半成品页）、`/activity/mxbc`（与系统无关的外部工具页）。
- 清除约 20 处生效的 `console.log`（`App.vue` 横幅、ZhuD3、Detail、Line、Category、MobilePage、Mxbc 等）。
- 删除 `vite.config.js` 指向 8080 的死代理配置。
- `api.js` 中 `addActivity` 注释纠正（实为签到接口，非新增活动）。

### 4.9 验证码刷新逻辑遗漏（P1，用户反馈）

- 根因（后端实锤）：`userController.js` 的 `validateAndConsumeCaptcha` 是**一次性消费**——无论失败原因（密码错、账号不存在），验证码在第 69 行被无条件删除。而前端 `login()/register()` 只在错误信息**包含"验证码"字样**时才刷新验证码 → 密码输错后验证码已作废却不刷新，用户改对密码再提交必然撞上"验证码已过期"。
- 附带缺陷：`login()` 原本没有 try/catch，网络异常/500 时无任何处理且不刷新。
- 修复（`Vue3/src/views/Login.vue`）：登录/注册**任意失败（业务失败或异常）都无条件刷新验证码**并清空输入；补齐 try/catch；验证码 UI 改为可点击刷新卡片（带旋转刷新图标、hover 提示"看不清？点击刷新"）。

### 4.10 登录页融合改版 + 扫码版本手动切换（用户需求）

- **结构**：扫码登录从独立弹窗（突兀）改为登录卡内第三个页签（账号登录 / 注册 / 扫码登录），页签间带淡入+滑动过渡动画（Vue Transition），不再弹窗。
- **扫码版本切换**：二维码上方新增"扫码打开版本"手动切换（正式版/体验版/开发版），解决正式版槽位临时部署其他项目时无法演示扫码登录的问题：
  - 后端 `wechatMiniService.resolveEnvVersion()` 做白名单校验（非法值回退默认规则），优先级：前端手动指定 > 环境变量 `WX_MINIAPP_ENV_VERSION` > 生产 release / 开发 trial；
  - 版本参数随创建会话（body）与取码图（query）传入，**同一会话切换版本只重新取码图**，会话与轮询不重建；
  - 选择持久化 localStorage，下次自动沿用。
- **页签切换与二维码生命周期**：切到扫码页时，若有未过期会话则续接倒计时与轮询（不浪费微信 API 配额），过期/无会话才新建；切走自动停止定时器。
- **视觉**：页面背景加氛围光斑，标题渐变字，验证码卡片化，二维码加边框阴影，登录/注册按钮加 loading 态。

### 4.11 手机端体验三连修（用户反馈）

1. **首页搜索框手机宽度异常**：`MyHeader.vue` 在 ≤600px 时搜索框被 `max-width: 120px` 卡死过窄；改为弹性伸缩（`flex: 1`）+ **160px 上限**——空间紧张时收缩、充裕时不贪婪，配合 logo 的 `flex-shrink: 0` 保证不被挤压（第一版无上限会挤占 logo，已修正）。
2. **文章详情页可横向滑出空白（老 bug）**：根因是 ≤600px 媒体查询里大量 `width: 100vw`——`100vw` 包含滚动条宽度，必然比可视区宽出一条；另有富文本宽图/长代码行无约束、以及一条永不生效的死规则（scoped 下的 `html,body` 选择器）。修复：
   - 移动端布局 `100vw` 全部改为 `100%` / `auto + margin`；
   - 富文本容器 `.editor-content-view` 增加 `img/pre/video/table` 的 `max-width` 与折行约束；
   - 新增非作用域全局兜底 `html, body { overflow-x: hidden }`（只禁横向，不影响 sticky 侧边栏）；
   - 图片放大遮罩 `100vw/100vh` 改 `100%`。
3. **详情页布局与顶部菜单空白**：
   - 菜单下方大片空白的根因：Detail.vue 移动端样式里 `.header { height: 120px }` 强行把复用的 MyHeader（自身仅 52px 高）撑高，多出 68px 空白；已删除该规则及同段 5 条永远无法生效的死规则（scoped 样式穿不进子组件内部）；
   - 左右边距不对称：原移动端 `.main` 内边距 16px 与 `.main-body` 外边距 14px 双重叠加（单侧 30px），收敛为对称的约 16px；
   - 文章卡片 `#main-page` 加 `overflow: hidden`：任何超宽内容都在卡片圆角边界内裁切，卡片左右内边距视觉始终对称，不再出现"右边距消失"。
4. **扫码登录客户端信息真实化**：小程序确认页原来写死"Chrome / Windows"、"192.168.\*.\*"假数据。现改为：
   - PC 登录页按真实 UA 识别运行环境上报通道：`pc`（电脑浏览器）/ `h5`（手机浏览器）/ `wechat-h5`（微信内网页，UA 含 `MicroMessenger`），后端白名单校验后入库；
   - 后端新增 `describeClient()`：解析会话存储的真实 UA，输出来源端标签、设备（系统 · 浏览器）、是否手机/微信、脱敏 IP（IPv4 隐去后两段、IPv6 只留前三组），随 `POST /miniapp/qr-login/entry` 响应返回；
   - 小程序确认页改为展示真实返回（`pages/qr-login/index.wxml`），无数据时回退通用文案；手机端打开登录页时二维码提示文案自动切换为"长按识别"引导。
   - 兼容性：新旧前后端任意组合均可运行（字段缺失走回退文案）。

> 附：轮播图资源丢失问题（部署时整删项目导致 `public/upload/` 文件被清、数据库路径成死链）采用**方案二**处理——部署时把 `Express/public/upload/` 当数据保护、不随代码删除；代码侧不改动。

### 4.12 登录/注册按钮无反应（4.10 改版引入，2026-09-18 修复）

- 根因：4.10 重写 `Login.vue` 时遗漏了 `formRef` / `formRefRegister` 两个模板引用声明，而 `login()/register()` 调用 `formRef.value?.validate(...)`——点击按钮即抛 `ReferenceError`，表现为按钮"死"。构建不报错（运行时错误），此前未被发现。
- 修复：补上 `const formRef = ref(null)` / `const formRefRegister = ref(null)` 声明。
- 教训：重写组件时模板引用（ref="xxx"）与脚本声明要成对核对；表单校验路径应有最低限度的手工回归。

### 4.13 AI 向导（新功能，2026-09-18 上线）

- 纯提示词聊天向导（智谱 GLM，免费 flash 模型），SSE 流式输出 + 多轮记忆（内存，10 条/30 分钟 TTL）+ IP 限流（60s/10 次）+ 防幻觉系统提示词，对现有业务零侵入。
- 后端：`common/aiConfig.js`（配置，Key 走 `ZHIPU_API_KEY` 环境变量）、`services/aiService.js`、`controllers/aiController.js`、`routes/ai.js`（挂载 `/ai`）。
- 前端：`components/AiGuide/index.vue`（悬浮球+引导气泡+聊天面板，全站可见、/dashboard 隐藏）、`api/ai.js`（fetch 解析 SSE）。
- 配套：数据库/JWT/微信/AI 密钥全部迁移到 `Express/.env`（gitignore），模板见 `.env.example`；删除 6 个零引用旧控制器与假依赖包（fs/path）。
- 待办：① nginx 反代 `/ai` 需 `proxy_buffering off`（响应头已带 `X-Accel-Buffering: no`）；② 换数据库密码后删除 config.js 明文回退；③ 二期 Tool Calling / 三期 RAG。
- 详细设计、踩坑笔记与测试记录见 `docs/AI向导-方案一设计计划.md`、`docs/工作记录-2026-09-18.md`。

### 4.14 AI 向导二期（2026-09-19，功能升级）

- **Tool Calling**：`services/aiTools.js` 注册 6 个工具（搜文章/分类/标签/热门排行/文章详情/站点统计），schema 与 handler 分离，复用现有 service 参数化查询，排行字段白名单映射防注入，结果截断防撑爆上下文，`executeTool` 永不 throw（错误以 `{ok:false}` 交由模型向用户解释）。
- **控制器两轮工具循环**：模型可链式调用工具（如"有哪些 Vue 文章？讲了什么？"→ 先搜再读详情）；新增**站点数据意图守卫**——涉站点数据的问题若模型未调工具就作答，强制打回重试一次，防凭空编造；SSE 新增 `{tool}` 状态事件。
- **会话落库**：`services/aiSessionService.js` + 迁移 `03-ai-session-stats.sql`（`wz_ai_sessions`/`wz_ai_messages`，幂等），替换一期的内存会话；登录用户自动关联 user_id；新增 `GET /ai/history` 会话回放，前端 sessionId 存 localStorage 刷新恢复。
- **看板 AI 统计**：`GET /dashboard/token/ai-stats`（管理员）+ BlogBoard 新增"AI 向导使用统计"卡（指标 + 近 7 日趋势 + 工具调用 Top）。
- **前端**：markdown-it 渲染 + DOMPurify 消毒；`viewport-fit=cover` 适配刘海屏。
- **环境隔离**：本地 `.env` 指向克隆库 `wztest-ai`，线上库 `wztest` 仅需上线时执行 03 迁移（幂等）；nginx 反代 `/ai` 保持 `proxy_buffering off`。
- 详见 `docs/AI向导-二期部署.md`（环境矩阵 + 部署步骤）。

---

## 五、验证记录

| 项目 | 结果 |
|------|------|
| 后端全部改动文件 `node --check` | 全部通过 |
| 前端 `npm run build` 全量构建（两轮） | 成功（Login/Adminset 分块正常产出） |
| 冒烟：`GET /activity/public/list` | 200，空列表兜底 ✅ |
| 冒烟：`GET /swiper` | 返回相对路径，伪造转发头不影响 ✅ |
| 冒烟：`POST /qr-login/session` 290/400 字符 UA | 均 200 ✅ |
| 冒烟：同会话取 trial/release/非法值/无参 码图 | 均 200 PNG，切换无需重建会话 ✅ |
| 单测：`resolveEnvVersion` 18 个用例（默认/非法回退/优先级/大小写） | 全部通过 ✅ |
| 线上复现（修复前）：长 UA 创建会话 | 500 Data too long ✅（实锤依据） |
| 残留检查：废弃引用 / console.log / 测试服务进程 | 零残留 ✅ |

---

## 六、部署清单（重要）

1. 服务器拉取本次代码，重新部署 **Express 后端**（轮播读取路径、UA 截断兜底、公开活动接口、上传的新返回格式都在后端，不部署不生效；avatar.png/logo 也随部署上线）。
2. 重新构建部署 **Vue3 前端**。
3. 微信小程序 `utils/request.js` 有改动，需要重新上传体验版/发版。
4. ~~线上库执行迁移 SQL~~ **无需执行**：已验证线上库就是 wztest，数据修复已实时生效（详见第一节"数据修复"）。
5. 验证：PC 首页轮播显示、安卓微信内登录页能生成小程序码、小程序登录后跨 2 小时不再掉登录、用户默认头像正常显示。

---

## 七、文章列表 ↔ 详情：返回丢分页、丢滚动位置（2026-09-19，体验优化专项）

### 问题（用户报告）

列表页翻到第 N 页后点进详情，返回时直接跳回首页；分页页码、每页条数、滚动位置全部丢失。

### 根因

1. `Detail.vue` 的 `goback()` 写死 `router.push("/")`——所谓"返回"实际是回首页，且详情页没有独立的返回按钮；
2. 列表页翻页状态只存在于组件内存，URL 不携带、组件不缓存，返回即重新挂载回到第 1 页；
3. 路由无 `scrollBehavior`，浏览器原生返回的滚动位置从未被恢复。

### 方案（选型说明）

采用 Vue Router 主流方案而非手动存滚动：

| 需求 | 实现 |
|------|------|
| 分页信息不丢 | 列表页 page/pageSize **同步写入 URL query**（`router.replace`，不产生历史记录），刷新/分享/返回均可恢复 |
| 详情返回对应分页 | 详情 URL 跳转时携带来源 `page/pageSize`；返回按钮据此 `push` 回 `/articles?page=N`，无参数时兜底第 1 页 |
| 原生返回恢复滚动 | `scrollBehavior` 返回 `savedPosition`；配合 `App.vue` 中 `keep-alive include="ArticlePage"` 缓存列表组件，返回时内容即时完整，savedPosition 恢复精准 |
| 自定义返回不恢复滚动 | 自定义返回按钮走 `push` 语义（非 popstate），`scrollBehavior` 落到顶部 |
| 滚动数据不入 URL | 使用浏览器原生 savedPosition 机制，零存储 |

### 改动文件

| 文件 | 改动 |
|------|------|
| `Vue3/src/views/ArticlePage.vue` | `syncFromQuery/syncToQuery`（query ↔ 分页状态双向同步）；`toDetail` 携带 `page/pageSize`；`getArtiles` 成功后落 URL；`watch(route.query)` 处理前进/后退；新增 `export default { name: "ArticlePage" }` |
| `Vue3/src/views/Detail.vue` | `goback()` 三级策略：有来源分页 → push 回对应页；无来源但有历史 → `router.back()`（恢复滚动）；直接打开 → 兜底列表第 1 页。新增"← 返回列表"按钮 |
| `Vue3/src/App.vue` | `router-view` 改 v-slot 写法 + `<keep-alive include="ArticlePage">` |
| `Vue3/src/common/router.js` | 新增 `scrollBehavior`（savedPosition 优先，其余回顶部） |

### 回归验证（浏览器实测，全部通过）

1. 列表翻第 2 页 → URL 变 `#/articles?page=2&pageSize=10`，首条序号 11；
2. 滚动 600px → 进详情 → 详情 URL `#/detail?id=11&page=2&pageSize=10`；
3. 详情页滚到 300px → 点"← 返回列表" → 回 `page=2` 页面、首条序号 11、**scrollY = 0**（自定义返回不恢复滚动 ✓）；
4. 列表滚 600px → 进详情 → 浏览器后退 → 详情；浏览器前进 → 回列表第 2 页且 **scrollY = 600 完整恢复**（原生返回恢复滚动 ✓）；
5. 全新标签页直接打开 `#/detail?id=3`（无历史）→ 返回 → 兜底 `#/articles?page=1`，第 1 页 10 篇 ✓；
6. 回归项：首页进入详情返回首页不受影响（无 page 参数走 back 兜底逻辑）；AI 悬浮球、文章内容渲染正常。
