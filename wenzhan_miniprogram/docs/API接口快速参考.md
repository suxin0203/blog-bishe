# 文栈博客小程序 API 接口快速参考

> **重要提示**：本文档专为小程序开发设计，标注了所有易错点和注意事项。开发时优先查阅此文档，避免对接报错。

## 📌 基础信息

- **API 基础地址**：`https://wzapi.suxin23.cn` (生产环境) / `http://localhost:8021` (本地开发)
- **完整 Swagger 文档**：http://localhost:8021/api-docs
- **统一响应格式**：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 🔐 认证说明

### Token 使用规则

- **需要登录的接口**：路径中包含 `/token/`
- **认证方式**：在请求 Header 中添加 `Authorization: Bearer {token}`
- **Token 获取**：登录成功后从响应中获取
- **Token 存储**：使用 `wx.setStorageSync('token', token)` 存储

### ⚠️ 易错点

1. **Header 格式错误**：必须是 `Authorization: Bearer token值`，注意 `Bearer` 后有空格
2. **Token 过期处理**：接口返回 401 时需要重新登录
3. **可选 Token 接口**：如收藏/点赞检查接口，不带 Token 时返回默认值

---

## 🔑 一、用户认证模块

### 1.1 用户登录

**接口**：`POST /users/login`

**请求参数**：

```json
{
  "username": "string (必填)",
  "password": "string (必填)",
  "openid": "string (可选，微信 openid)"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": 1,
    "username": "testuser",
    "nickname": "测试用户",
    "avatar_url": "https://...",
    "points": 100,
    "role": "user"
  }
}
```

**⚠️ 易错点**：
- 密码需要明文传输（后端会加密），不要在前端加密
- 登录成功后记得存储 `token` 和用户信息
- `openid` 参数用于微信登录绑定，普通登录不需要

---

### 1.2 获取当前用户信息

**接口**：`GET /users/me`

**需要 Token**：是

**用途**：恢复登录态，检查 Token 是否有效

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "testuser",
    "points": 100
  }
}
```

**⚠️ 易错点**：
- 小程序启动时应该调用此接口验证本地 Token 是否有效
- 返回 401 表示 Token 失效，需要重新登录

---

## 📱 二、微信登录模块（小程序专用）

### 2.1 获取 OpenID

**接口**：`GET /wechatlogin/openid/{code}`

**参数**：
- `code`：通过 `wx.login()` 获取的临时登录凭证

**调用流程**：

```javascript
// 1. 获取 code
wx.login({
  success: (res) => {
    const code = res.code;
    // 2. 换取 openid
    request.get(`/wechatlogin/openid/${code}`).then(data => {
      const openid = data.openid;
      wx.setStorageSync('openid', openid);
    });
  }
});
```

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "openid": "oXXXX-xxxxxxxxxxxxxxxxx",
    "session_key": "xxxxx"
  }
}
```

**⚠️ 易错点**：
- `code` 只能使用一次，重复使用会报错
- `openid` 需要持久化存储，用于后续接口调用
- `session_key` 用于解密用户信息，也需要存储

---

### 2.2 检查 OpenID 是否已绑定账号

**接口**：`GET /wechatlogin/userinfo/{openid}`

**参数**：
- `openid`：微信用户的 openid

**响应示例**：

```json
// 已绑定
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "testuser",
    "openid": "oXXXX-xxx"
  }
}

// 未绑定
{
  "code": 200,
  "data": null
}
```

**⚠️ 易错点**：
- `data` 为 `null` 表示未绑定，需要引导用户注册或绑定
- 已绑定时可以直接使用返回的用户信息登录

---

### 2.3 扫码登录 - 小程序端上报

**接口**：`POST /miniapp/qr-login/entry`

**请求参数**：

```json
{
  "sceneId": "string (必填，从小程序码参数中获取)",
  "openid": "string (必填，当前用户的 openid)"
}
```

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "needRegister": false,
    "needBind": true,
    "user": null
  }
}
```

**⚠️ 易错点**：
- `sceneId` 从扫码进入小程序的 `scene` 参数中获取
- 根据 `needRegister` 和 `needBind` 判断后续流程

---

### 2.4 扫码登录 - 注册并确认

**接口**：`POST /miniapp/qr-login/register-and-confirm`

**请求参数**：

```json
{
  "sceneId": "string (必填)",
  "openid": "string (必填)",
  "username": "string (必填，3-20字符)",
  "password": "string (必填，6-20字符)",
  "nickname": "string (可选)",
  "avatar_url": "string (可选)"
}
```

**⚠️ 易错点**：
- `username` 不能包含特殊字符
- `password` 明文传输，后端会加密
- 注册成功后 PC 端会自动登录

---

### 2.5 扫码登录 - 绑定并确认

**接口**：`POST /miniapp/qr-login/bind-and-confirm`

**请求参数**：

```json
{
  "sceneId": "string (必填)",
  "openid": "string (必填)",
  "username": "string (必填，已存在的用户名)",
  "password": "string (必填，该用户的密码)"
}
```

**⚠️ 易错点**：
- `username` 和 `password` 必须是已存在的账号
- 绑定成功后该 openid 会关联到该账号

---

## 📝 三、文章模块

### 3.1 文章列表（分页）

**接口**：`GET /articles`

**查询参数**：

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| page | number | 否 | 页码 | 1 |
| pageSize | number | 否 | 每页数量 | 8 |
| keyword | string | 否 | 搜索关键词 | - |
| category_id | number | 否 | 分类 ID | - |
| tag_id | number | 否 | 标签 ID | - |
| status | number | 否 | 状态（0/1正常，2回收站） | - |

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "title": "文章标题",
        "summary": "文章摘要",
        "cover_url": "https://...",
        "category_name": "技术",
        "view_count": 100,
        "like_count": 10,
        "comment_count": 5,
        "created_at": "2024-01-01 12:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 8,
      "total": 100,
      "totalPages": 13
    }
  }
}
```

**⚠️ 易错点**：
- 分页从 1 开始，不是 0
- `category_id` 和 `tag_id` 必须是数字类型
- 小程序端通常不需要传 `status` 参数

---

### 3.2 文章详情

**接口**：`GET /articles/{id}`

**查询参数**：
- `incrementView`：传 `"true"` 时阅读量 +1

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "文章标题",
    "content": "<p>文章内容HTML</p>",
    "cover_url": "https://...",
    "category_id": 1,
    "category_name": "技术",
    "author_id": 1,
    "author_name": "作者",
    "view_count": 101,
    "like_count": 10,
    "comment_count": 5,
    "created_at": "2024-01-01 12:00:00",
    "tags": [
      { "id": 1, "name": "Vue" },
      { "id": 2, "name": "Node.js" }
    ]
  }
}
```

**⚠️ 易错点**：
- `content` 是 HTML 格式，小程序需要使用 `rich-text` 组件渲染
- 首次进入详情页时应该传 `incrementView=true` 增加阅读量
- 不要频繁调用增加阅读量，会导致数据不准确

---

### 3.3 文章排行榜

**接口**：`GET /articles/top`

**查询参数**：
- `type`：排序类型，可选值 `view_count`（阅读量）、`like_count`（点赞数）、`comment_count`（评论数）
- `limit`：返回数量，默认 10

**响应示例**：

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "title": "热门文章",
      "view_count": 1000,
      "like_count": 50
    }
  ]
}
```

**⚠️ 易错点**：
- 小程序首页推荐使用此接口获取热门文章
- `type` 参数必须是字符串，不是数字

---

## ❤️ 四、点赞与收藏模块

### 4.1 点赞/取消点赞

**接口**：`POST /likes/token/article/{articleId}/toggle`

**需要 Token**：是

**参数**：
- `articleId`：文章 ID（路径参数）

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "liked": true
  }
}
```

**⚠️ 易错点**：
- `articleId` 必须是数字类型，不能传字符串
- `liked: true` 表示已点赞，`false` 表示已取消
- 需要根据返回值更新 UI 状态

---

### 4.2 检查是否已点赞

**接口**：`GET /likes/article/{articleId}/check`

**需要 Token**：可选（不带 Token 时返回 `liked: false`）

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "liked": false
  }
}
```

**⚠️ 易错点**：
- 进入文章详情页时调用此接口获取点赞状态
- 未登录时也可以调用，返回 `liked: false`

---

### 4.3 收藏/取消收藏

**接口**：`POST /favorites/token/article/{articleId}/toggle`

**需要 Token**：是

**参数**：
- `articleId`：文章 ID（路径参数）

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "favorited": true
  }
}
```

**⚠️ 易错点**：
- 与点赞接口类似，但返回字段是 `favorited`
- `articleId` 必须是数字类型

---

### 4.4 我的收藏列表

**接口**：`GET /favorites/token/list`

**需要 Token**：是

**响应示例**：

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "title": "收藏的文章",
      "cover_url": "https://...",
      "created_at": "2024-01-01"
    }
  ]
}
```

**⚠️ 易错点**：
- 返回的是完整的文章信息数组，不是分页格式
- 小程序"我的"页面使用此接口

---

### 4.5 检查是否已收藏

**接口**：`GET /favorites/article/{articleId}/check`

**需要 Token**：可选

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "favorited": false
  }
}
```

**⚠️ 易错点**：
- 必须在 Header 中带 Token，否则始终返回 `favorited: false`
- 进入文章详情页时调用

---

## 💬 五、评论模块

### 5.1 获取文章评论列表

**接口**：`GET /comments/article/{articleId}`

**查询参数**：
- `status`：评论状态，传 `1` 获取已发布的评论

**响应示例**：

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "article_id": 1,
      "user_id": 2,
      "user_name": "评论者",
      "user_avatar": "https://...",
      "content": "评论内容",
      "parent_id": null,
      "like_count": 5,
      "created_at": "2024-01-01 12:00:00"
    }
  ]
}
```

**⚠️ 易错点**：
- 小程序端应该传 `status=1` 只获取已发布的评论
- `parent_id` 不为 null 表示是回复评论

---

### 5.2 发表评论

**接口**：`POST /comments`

**需要 Token**：可选（不带 Token 时为匿名评论）

**请求参数**：

```json
{
  "article_id": 1,
  "content": "评论内容",
  "parent_id": null
}
```

**⚠️ 易错点**：
- `article_id` 必须是数字类型
- `parent_id` 用于回复评论，不回复时传 `null` 或不传
- 小程序端建议要求登录后才能评论

---

## 🎁 六、积分商城模块

### 6.1 商品列表

**接口**：`GET /points/goods`

**查询参数**：
- `all`：传 `"1"` 获取全部商品（包括下架的），不传只返回上架商品

**响应示例**：

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "商品名称",
      "type": "physical",
      "description": "商品描述",
      "image_url": "https://...",
      "points_cost": 100,
      "stock": 50,
      "status": 1
    }
  ]
}
```

**⚠️ 易错点**：
- `type` 有两种：`physical`（实物）和 `title`（称号）
- `stock` 为 `null` 表示无限库存
- 小程序端不需要传 `all` 参数

---

### 6.2 商品详情

**接口**：`GET /points/goods/{id}`

**响应示例**：同商品列表中的单个商品

---

### 6.3 兑换商品

**接口**：`POST /points/orders`

**需要 Token**：是

**请求参数**：

```json
{
  "goods_id": 1,
  "quantity": 1,
  "receiver_name": "收货人",
  "receiver_phone": "13800138000",
  "receiver_address": "收货地址",
  "user_remark": "备注"
}
```

**⚠️ 易错点**：
- `goods_id` 必须是数字类型
- 实物商品必须填写收货信息，称号类商品可以不填
- 兑换前应该检查用户积分是否足够
- 返回 400 表示积分不足或库存不足

---

### 6.4 我的订单列表

**接口**：`GET /points/orders`

**查询参数**：
- `my`：传 `"1"` 获取当前用户的订单
- `page`：页码
- `pageSize`：每页数量

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "goods_id": 1,
        "goods_name": "商品名称",
        "quantity": 1,
        "total_points": 100,
        "status": "pending",
        "created_at": "2024-01-01"
      }
    ],
    "total": 10
  }
}
```

**⚠️ 易错点**：
- 小程序端必须传 `my=1`
- `status` 状态：`pending`（待审核）、`approved`（已审核）、`shipped`（已发货）、`completed`（已完成）、`cancelled`（已取消）

---

### 6.5 积分流水

**接口**：`GET /points/log`

**查询参数**：
- `userId`：用户 ID（可选，不传则获取当前登录用户的流水）
- `page`：页码
- `pageSize`：每页数量

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "user_id": 1,
        "points": 10,
        "type": "login",
        "description": "每日登录",
        "created_at": "2024-01-01 12:00:00"
      }
    ],
    "total": 50
  }
}
```

**⚠️ 易错点**：
- `points` 为正数表示获得，负数表示消耗
- `type` 类型：`login`（登录）、`article`（发文）、`comment`（评论）、`exchange`（兑换）等

---

## 📊 七、分类与标签

### 7.1 分类列表

**接口**：`GET /categories`

**响应示例**：

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "技术",
      "description": "技术文章",
      "sort_order": 1
    }
  ]
}
```

---

### 7.2 标签列表

**接口**：`GET /tags`

**响应示例**：

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "Vue"
    }
  ]
}
```

---

## 🎨 八、轮播图

### 8.1 轮播图列表

**接口**：`GET /swiper`

**查询参数**：
- `all`：传 `"1"` 获取全部（包括未启用的），不传只返回启用的

**响应示例**：

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "image_url": "https://...",
      "link_url": "https://...",
      "title": "轮播图标题",
      "sort_order": 1,
      "status": 1
    }
  ]
}
```

**⚠️ 易错点**：
- 小程序首页使用，不需要传 `all` 参数
- `link_url` 可能为空，点击时需要判断

---

## 🚨 常见错误处理

### 错误码说明

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| 200 | 成功 | 正常处理 |
| 400 | 参数错误 | 检查请求参数 |
| 401 | 未登录或 Token 失效 | 跳转登录页 |
| 403 | 无权限 | 提示用户权限不足 |
| 404 | 资源不存在 | 提示用户 |
| 500 | 服务器错误 | 提示用户稍后重试 |

### 小程序端统一错误处理

```javascript
// utils/request.js
function handleError(error) {
  if (error.code === 401) {
    wx.removeStorageSync('token');
    wx.navigateTo({ url: '/pages/auth/login' });
    wx.showToast({ title: '请先登录', icon: 'none' });
  } else if (error.code === 400) {
    wx.showToast({ title: error.message || '参数错误', icon: 'none' });
  } else {
    wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
  }
}
```

---

## 📋 开发检查清单

### 接口对接前

- [ ] 确认 API 基础地址配置正确
- [ ] 确认 Token 存储和读取逻辑正确
- [ ] 确认请求拦截器已添加 Authorization Header

### 常见对接问题

1. **401 错误**：检查 Token 是否正确添加到 Header
2. **参数类型错误**：检查数字类型参数是否传成了字符串
3. **收藏/点赞状态不对**：检查是否在 Header 中带了 Token
4. **分页数据为空**：检查 page 是否从 1 开始
5. **图片不显示**：检查图片 URL 是否完整，是否需要添加域名前缀

---

## 📞 技术支持

如果遇到接口问题：

1. 先查看完整 Swagger 文档：http://localhost:8021/api-docs
2. 检查请求参数和响应格式是否符合文档
3. 使用 Postman 或 Swagger UI 测试接口是否正常
4. 检查小程序控制台的网络请求日志

---

**最后更新**：2024-01-01
**文档版本**：v1.0.0
