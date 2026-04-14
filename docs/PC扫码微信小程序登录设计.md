## PC 扫微信小程序码登录功能设计

> 本文档是专题设计文档，只讨论一件事：**PC 网页如何通过微信小程序扫码完成登录。**
>
> - 如果你想看整个项目是什么、整体有什么能力，请看 `docs/项目说明文档.md`
> - 如果你想看系统认证、JWT、权限控制、安全机制，请看 `docs/系统核心技术.md`
> - 如果你想看项目所有功能模块与接口总览，请看 `docs/功能模块.md`

---

## 1. 功能目标

在现有文栈博客系统基础上，实现“PC 网页展示二维码，用户使用微信小程序扫码后完成 Web 登录”的跨端登录能力。

该方案的目标是：

1. PC 端无需输入账号密码，也能完成登录
2. 已绑定微信身份的用户可快速确认登录
3. 未绑定用户可以在小程序端完成注册或绑定已有账号
4. 整个过程尽量复用现有 JWT 与用户体系，不额外引入 Redis 等中间件

---

## 2. 适用范围与设计原则

### 2.1 适用范围

本方案适用于以下场景：

- PC 端登录页增加“微信扫码登录”入口
- 微信小程序作为扫码确认媒介
- 后端使用 MySQL 存储短期扫码会话
- 登录完成后，PC 端获得与账号密码登录一致的登录态

### 2.2 设计原则

- 复用现有用户表与 JWT 机制
- 会话状态尽量清晰、可追踪
- 不把敏感登录态直接放入二维码
- 保证二维码、绑定令牌、扫码确认都有过期控制
- 保持对前端、后端、小程序三方都容易联调

---

## 3. 参与角色

该功能涉及四类参与方：

1. **PC 端网页**：负责创建扫码会话、展示二维码、轮询登录状态
2. **博客后端 API**：负责生成会话、记录状态、签发登录态
3. **微信小程序**：负责扫码后发起确认、注册或绑定动作
4. **用户**：实际执行扫码、确认、注册、绑定等操作

---

## 4. 核心业务思路

整体思路如下：

1. PC 页面向后端申请创建一条扫码登录会话
2. 后端生成唯一 `sceneId`，并返回对应的小程序码
3. 用户使用微信小程序扫码进入确认页面
4. 小程序调用后端接口，根据本次微信 `openid` 判断：
   - 已绑定账号：直接确认 PC 登录
   - 未绑定账号：提示“注册新账号”或“绑定已有账号”
5. 后端更新该扫码会话状态
6. PC 端持续轮询会话状态，状态变为已确认后拿到登录态并完成登录

这样就形成了：

`PC 建会话 -> 小程序扫码 -> 小程序确认/注册/绑定 -> 后端更新状态 -> PC 轮询完成登录`

---

## 5. 状态设计

扫码登录建议围绕会话状态表进行管理。当前设计的核心状态包括：

- `pending`：待扫码 / 待确认
- `confirmed`：已确认，PC 可领取登录态
- `completed`：PC 已成功消费本次登录结果
- `expired`：二维码或会话已过期

此外，还存在两个临时概念：

- `temp_openid`：扫码后拿到、但尚未完成注册或绑定的微信身份
- `bindToken`：注册或绑定时使用的一次性短期令牌

---

## 6. 数据结构设计

建议新增扫码登录会话表：`wz_qr_login_sessions`。

该表的核心职责是保存：

- 会话唯一标识 `scene_id`
- 当前状态 `status`
- 已确认登录的 `user_id`
- 临时微信身份 `temp_openid`
- 一次性绑定令牌 `bind_token`
- 令牌过期时间 `bind_token_expires_at`
- 会话过期时间 `expires_at`

推荐建表 SQL：

```sql
CREATE TABLE `wz_qr_login_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `scene_id` VARCHAR(64) NOT NULL COMMENT '扫码登录会话ID',
  `status` ENUM('pending','confirmed','completed','expired') NOT NULL DEFAULT 'pending' COMMENT '会话状态',
  `user_id` INT UNSIGNED DEFAULT NULL COMMENT '确认登录的用户ID',
  `channel` VARCHAR(32) NOT NULL DEFAULT 'pc' COMMENT '登录通道',
  `temp_openid` VARCHAR(128) DEFAULT NULL COMMENT '临时openid',
  `bind_token` VARCHAR(128) DEFAULT NULL COMMENT '一次性绑定token',
  `bind_token_expires_at` DATETIME DEFAULT NULL COMMENT 'bind_token过期时间',
  `client_ip` VARCHAR(45) DEFAULT NULL COMMENT 'PC端IP',
  `user_agent` VARCHAR(255) DEFAULT NULL COMMENT '浏览器UA',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `expires_at` DATETIME NOT NULL COMMENT '会话过期时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scene_id` (`scene_id`),
  KEY `idx_status_expires` (`status`, `expires_at`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_bind_token` (`bind_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PC扫码登录会话表';
```

---

## 7. 后端接口设计

### 7.1 PC 端：创建扫码会话

- **接口**：`POST /qr-login/session`
- **作用**：PC 创建一条新的扫码登录会话，并拿到小程序码
- **认证**：无需登录

**请求示例：**

```json
{
  "channel": "pc"
}
```

**成功响应示例：**

```json
{
  "code": 200,
  "message": "创建扫码登录会话成功",
  "data": {
    "sceneId": "5f3b2e1c9a7d...",
    "expiresAt": "2026-03-12T12:00:00Z",
    "miniProgramCode": "data:image/png;base64,..."
  }
}
```

### 7.2 PC 端：轮询扫码会话状态

- **接口**：`GET /qr-login/session/:sceneId`
- **作用**：PC 持续轮询当前扫码会话状态
- **认证**：无需登录

**状态返回约定：**

#### 1）待扫码或待确认

```json
{
  "code": 200,
  "message": "等待扫码或确认",
  "data": {
    "status": "pending",
    "expiresAt": "2026-03-12T12:00:00Z"
  }
}
```

#### 2）已确认登录

```json
{
  "code": 200,
  "message": "扫码登录已确认",
  "data": {
    "status": "confirmed",
    "token": "<jwt_access_token>",
    "refreshToken": "<jwt_refresh_token>",
    "user": {
      "id": 1,
      "username": "wx_demo_3f9a",
      "nickname": "微信昵称",
      "avatar_url": "https://...",
      "role": "user",
      "is_root": 0,
      "points": 0,
      "title": ""
    }
  }
}
```

#### 3）会话完成或过期

```json
{
  "code": 200,
  "message": "会话已完成，请刷新二维码",
  "data": {
    "status": "completed"
  }
}
```

```json
{
  "code": 410,
  "message": "二维码已过期，请刷新",
  "data": {
    "status": "expired"
  }
}
```

---

## 8. 小程序端接口设计

### 8.1 扫码入口

- **接口**：`POST /miniapp/qr-login/entry`
- **作用**：小程序扫码后进入统一入口，根据当前微信身份判断是直接确认登录，还是进入注册 / 绑定流程
- **认证**：无需 Authorization，依赖 `wx.login` 获取的 `code`

**请求示例：**

```json
{
  "sceneId": "xxxxx",
  "code": "wx.login返回的code"
}
```

**响应 1：已绑定账号，可直接登录**

```json
{
  "code": 200,
  "message": "已确认登录",
  "data": {
    "action": "login_ok"
  }
}
```

**响应 2：未绑定，需要注册或绑定**

```json
{
  "code": 200,
  "message": "需要注册或绑定账号",
  "data": {
    "action": "need_register_or_bind",
    "bindToken": "<一次性短期token>"
  }
}
```

### 8.2 注册新账号并确认登录

- **接口**：`POST /miniapp/qr-login/register-and-confirm`
- **作用**：未绑定用户在小程序端创建新账号，并确认当前 PC 登录

**请求示例：**

```json
{
  "sceneId": "xxxxx",
  "bindToken": "<entry返回的bindToken>",
  "username": "用户填写的用户名",
  "password": "用户填写的密码",
  "email": "user@example.com"
}
```

**成功响应：**

```json
{
  "code": 200,
  "message": "注册并确认PC登录成功",
  "data": {
    "status": "confirmed"
  }
}
```

### 8.3 绑定已有账号并确认登录

- **接口**：`POST /miniapp/qr-login/bind-and-confirm`
- **作用**：把本次扫码获取的微信身份绑定到已有账号，并完成当前 PC 登录

**请求示例：**

```json
{
  "sceneId": "xxxxx",
  "bindToken": "<entry返回的bindToken>",
  "username": "已有账号用户名或邮箱",
  "password": "对应密码"
}
```

**成功响应：**

```json
{
  "code": 200,
  "message": "绑定账号并确认PC登录成功",
  "data": {
    "status": "confirmed"
  }
}
```

---

## 9. 典型流程拆解

### 9.1 老用户扫码直接登录

1. PC 端创建扫码会话
2. 用户用微信小程序扫码
3. 小程序调用扫码入口接口
4. 后端根据 `openid` 发现该用户已绑定账号
5. 后端把会话标记为 `confirmed`
6. PC 端轮询到成功状态，领取 `token + refreshToken`，完成登录

### 9.2 新用户扫码后注册并登录

1. PC 端创建扫码会话
2. 小程序扫码后，后端发现当前 `openid` 未绑定账号
3. 后端返回 `bindToken`
4. 用户在小程序端填写用户名、密码、邮箱
5. 小程序调用注册并确认接口
6. 后端创建用户、绑定 `openid`、更新会话状态
7. PC 端轮询到 `confirmed` 状态后完成登录

### 9.3 已有账号绑定后登录

1. 小程序扫码进入扫码入口
2. 后端返回 `bindToken`
3. 用户输入已有账号与密码
4. 小程序调用绑定并确认接口
5. 后端校验账号合法性并写入 `openid`
6. 更新会话为 `confirmed`
7. PC 端轮询成功后完成登录

---

## 10. 前端与小程序端联调要点

### 10.1 PC 端页面要点

登录页中的扫码登录区域建议实现以下能力：

- 打开页面时调用 `POST /qr-login/session`
- 将返回的小程序码展示为图片
- 启动轮询 `GET /qr-login/session/:sceneId`
- 根据不同状态更新 UI：
  - `pending`：继续等待
  - `confirmed`：写入登录态并跳转
  - `expired/completed`：提示刷新二维码

### 10.2 小程序端页面要点

扫码确认页建议实现如下流程：

1. 通过 `App.onShow` 或页面参数获取 `sceneId`
2. 调用 `wx.login` 获取 `code`
3. 请求 `POST /miniapp/qr-login/entry`
4. 根据 `action` 决定跳转：
   - `login_ok`：提示已登录成功
   - `need_register_or_bind`：展示“注册新账号 / 绑定已有账号”入口
5. 完成注册或绑定后提示“电脑端已登录”

---

## 11. 安全控制点

扫码登录虽然方便，但必须注意以下安全点：

### 11.1 二维码中不直接放 Token

二维码中只能包含 `sceneId` 或其短码，不能直接放访问 Token 或刷新 Token。

### 11.2 会话必须有过期时间

- `sceneId` 必须过期
- `bindToken` 必须过期
- 过期后必须拒绝继续使用

### 11.3 一次性消费原则

当 PC 端已经成功消费 `confirmed` 结果后，应将状态更新为 `completed`，避免重复领取登录态。

### 11.4 绑定关系需校验冲突

若某个 `openid` 已经绑定其他账号，应拒绝重复绑定或明确提示用户处理方式。

---

## 12. 推荐异常场景清单

建议重点测试以下场景：

1. 会话正常创建、扫码、确认并登录成功
2. 用户已绑定账号，扫码后直接登录
3. 用户未绑定账号，先注册再登录
4. 用户未绑定账号，绑定已有账号再登录
5. 二维码超时
6. `bindToken` 超时
7. 用户重复使用已完成会话
8. 用户输入错误账号密码进行绑定
9. `openid` 已被其他账号占用
10. PC 端轮询到已过期状态后刷新二维码重新登录

---

## 13. 相关配置参数

实现时可能需要的关键配置项如下：

```js
const appId = process.env.WX_MINIAPP_APPID || 'wx15276ccd959c150c';
const appSecret = process.env.WX_MINIAPP_SECRET || 'e92d91ea4d286209050510806625dc9d';
const loginPage = process.env.WX_MINIAPP_PC_LOGIN_PAGE || 'pages/pc-qr-login/index';
```

建议后续统一整理进环境变量说明文档，而不要散落在各处设计说明中。

---

## 14. 总结

PC 扫微信小程序码登录并不是对原有系统的推翻重做，而是在现有用户体系、JWT 登录态、微信 `openid` 能力基础上的一次扩展。

它的价值主要体现在：

- 提升登录体验
- 强化系统展示亮点
- 打通 Web 与小程序两端能力
- 形成更完整的跨端身份认证场景

如果后续继续扩展本方案，建议优先补充：

- 扫码登录泳道图
- 状态机图
- 前后端联调时序图
- 失败分支处理规范
