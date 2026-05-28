# 文栈博客 API 接口文档（标准格式）

> **严格规则**：所有字段名与后端代码完全一致，不允许简写

## 统一响应格式

所有接口统一返回以下格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

**字段说明**：
- `code`: 状态码（200=成功，0=失败，401=未授权，403=无权限，404=不存在，500=服务器错误）
- `message`: 提示信息
- `data`: 响应数据（可能为 null、对象、数组）

---

## 1. 微信登录接口

### 1.1 根据 code 换取 openid

**接口路径**：`GET /wechat/openid/{code}`

**请求参数**：
- `code` (路径参数): 微信登录返回的 code

**响应示例**：

```json
{
  "message": "获取openid成功",
  "data": {
    "session_key": "xxx",
    "openid": "xxx"
  }
}
```

**响应字段**：
- `data.session_key`: 会话密钥
- `data.openid`: 用户唯一标识

---

### 1.2 根据 openid 获取用户信息

**接口路径**：`GET /wechat/userinfo/{openid}`

**请求参数**：
- `openid` (路径参数): 用户的 openid

**响应示例（已绑定）**：

```json
{
  "code": 200,
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": 1,
    "username": "user123",
    "nickname": "昵称",
    "email": "user@example.com",
    "avatar_url": "https://...",
    "role": "user",
    "is_root": 0,
    "points": 100,
    "openid": "xxx",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**响应示例（未绑定）**：

```json
{
  "code": 0,
  "message": "用户不存在"
}
```

**响应字段**：
- `token`: JWT 令牌（已绑定时返回）
- `data.id`: 用户ID
- `data.username`: 用户名
- `data.nickname`: 昵称
- `data.email`: 邮箱
- `data.avatar_url`: 头像URL
- `data.role`: 角色（user/editor/admin）
- `data.is_root`: 是否超级管理员（0/1）
- `data.points`: 积分
- `data.openid`: 微信openid
- `data.created_at`: 创建时间
- `data.updated_at`: 更新时间

---

## 2. 积分接口

### 2.1 获取积分流水

**接口路径**：`GET /points/token/log`

**认证**：需要 Token

**请求参数**：
- `page` (query, 可选): 页码，默认 1
- `pageSize` (query, 可选): 每页数量，默认 10
- `userId` (query, 可选): 用户ID（管理员可指定）

**响应示例**：

```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "user_id": 1,
        "change": 10,
        "reason": "article_publish:123:文章标题",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 100
  }
}
```

**响应字段**：
- `data.list`: 流水列表
- `data.list[].id`: 流水ID
- `data.list[].user_id`: 用户ID
- `data.list[].change`: 积分变化（正数=获得，负数=消耗）
- `data.list[].reason`: 变化原因
- `data.list[].created_at`: 创建时间
- `data.total`: 总记录数

---

### 2.2 获取商品列表

**接口路径**：`GET /points/goods`

**请求参数**：
- `all` (query, 可选): 是否获取全部（1=是）
- `keyword` (query, 可选): 搜索关键词
- `type` (query, 可选): 商品类型
- `page` (query, 可选): 页码
- `pageSize` (query, 可选): 每页数量

**响应示例**：

```json
{
  "code": 200,
  "message": "获取商品列表成功",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "商品名称",
        "type": "physical",
        "description": "商品描述",
        "image_url": "https://...",
        "points_cost": 100,
        "stock": 10,
        "status": 1,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 50
  }
}
```

**响应字段**：
- `data.list[].id`: 商品ID
- `data.list[].name`: 商品名称
- `data.list[].type`: 商品类型（physical=实物，virtual=虚拟，title=称号）
- `data.list[].description`: 商品描述
- `data.list[].image_url`: 商品图片URL
- `data.list[].points_cost`: 所需积分
- `data.list[].stock`: 库存数量
- `data.list[].status`: 状态（0=下架，1=上架）
- `data.list[].created_at`: 创建时间
- `data.list[].updated_at`: 更新时间

---

### 2.3 创建兑换订单

**接口路径**：`POST /points/orders`

**认证**：需要 Token

**请求体**：

```json
{
  "goods_id": 1,
  "quantity": 1,
  "receiver_name": "张三",
  "receiver_phone": "13800138000",
  "receiver_address": "北京市朝阳区xxx",
  "user_remark": "备注信息"
}
```

**请求字段**：
- `goods_id`: 商品ID（必填）
- `quantity`: 数量（可选，默认1）
- `receiver_name`: 收货人姓名（实物商品必填）
- `receiver_phone`: 收货人电话（实物商品必填）
- `receiver_address`: 收货地址（实物商品必填）
- `user_remark`: 用户备注（可选）

**响应示例**：

```json
{
  "code": 200,
  "message": "兑换成功",
  "data": {
    "id": 123
  }
}
```

**响应字段**：
- `data.id`: 订单ID
- `data.completed`: 是否已完成（称号类商品会立即完成）
- `data.title`: 称号名称（称号类商品返回）

---

### 2.4 获取订单列表

**接口路径**：`GET /points/orders`

**认证**：需要 Token

**请求参数**：
- `userId` (query, 可选): 用户ID（管理员可指定）
- `status` (query, 可选): 订单状态
- `keyword` (query, 可选): 搜索关键词
- `page` (query, 可选): 页码
- `pageSize` (query, 可选): 每页数量

**响应示例**：

```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "user_id": 1,
        "goods_id": 1,
        "goods_name": "商品名称",
        "goods_type": "physical",
        "quantity": 1,
        "points_cost": 100,
        "total_points": 100,
        "status": "pending",
        "receiver_name": "张三",
        "receiver_phone": "13800138000",
        "receiver_address": "北京市朝阳区xxx",
        "logistics_company": null,
        "logistics_no": null,
        "user_remark": "备注",
        "admin_remark": null,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 10
  }
}
```

**响应字段**：
- `data.list[].id`: 订单ID
- `data.list[].user_id`: 用户ID
- `data.list[].goods_id`: 商品ID
- `data.list[].goods_name`: 商品名称
- `data.list[].goods_type`: 商品类型
- `data.list[].quantity`: 数量
- `data.list[].points_cost`: 单价积分
- `data.list[].total_points`: 总积分
- `data.list[].status`: 订单状态（pending=待处理，approved=已审核，shipped=已发货，completed=已完成，cancelled=已取消）
- `data.list[].receiver_name`: 收货人姓名
- `data.list[].receiver_phone`: 收货人电话
- `data.list[].receiver_address`: 收货地址
- `data.list[].logistics_company`: 物流公司
- `data.list[].logistics_no`: 物流单号
- `data.list[].user_remark`: 用户备注
- `data.list[].admin_remark`: 管理员备注
- `data.list[].created_at`: 创建时间
- `data.list[].updated_at`: 更新时间

---

## 3. 文章接口

### 3.1 获取文章列表

**接口路径**：`GET /articles`

**请求参数**：
- `page` (query, 可选): 页码，默认 1
- `pageSize` (query, 可选): 每页数量，默认 8
- `keyword` (query, 可选): 搜索关键词
- `category_id` (query, 可选): 分类ID
- `tag_id` (query, 可选): 标签ID
- `status` (query, 可选): 状态（0=展示，1=置顶，2=回收站）
- `year` (query, 可选): 年份
- `month` (query, 可选): 月份

**响应示例**：

```json
{
  "code": 200,
  "message": "获取分页文章列表成功",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "文章标题",
        "summary": "文章摘要",
        "cover_url": "https://...",
        "content": "文章内容",
        "category_id": 1,
        "category_name": "分类名称",
        "author_id": 1,
        "author_name": "作者名",
        "status": 0,
        "view_count": 100,
        "like_count": 10,
        "favorite_count": 5,
        "comment_count": 3,
        "tags": [
          {
            "id": 1,
            "name": "标签名"
          }
        ],
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
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

**响应字段**：
- `data.list[].id`: 文章ID
- `data.list[].title`: 标题
- `data.list[].summary`: 摘要
- `data.list[].cover_url`: 封面图URL
- `data.list[].content`: 内容
- `data.list[].category_id`: 分类ID
- `data.list[].category_name`: 分类名称
- `data.list[].author_id`: 作者ID
- `data.list[].author_name`: 作者名
- `data.list[].status`: 状态
- `data.list[].view_count`: 阅读量
- `data.list[].like_count`: 点赞数
- `data.list[].favorite_count`: 收藏数
- `data.list[].comment_count`: 评论数
- `data.list[].tags`: 标签列表
- `data.list[].created_at`: 创建时间
- `data.list[].updated_at`: 更新时间
- `data.pagination.page`: 当前页码
- `data.pagination.pageSize`: 每页数量
- `data.pagination.total`: 总记录数
- `data.pagination.totalPages`: 总页数

---

### 3.2 获取文章详情

**接口路径**：`GET /articles/{id}`

**请求参数**：
- `id` (路径参数): 文章ID
- `incrementView` (query, 可选): 是否增加阅读量（1=是）
- `source` (query, 可选): 来源（internal/external）

**响应示例**：

```json
{
  "code": 200,
  "message": "查询成功",
  "data": [
    {
      "id": 1,
      "title": "文章标题",
      "summary": "文章摘要",
      "cover_url": "https://...",
      "content": "文章内容",
      "category_id": 1,
      "category_name": "分类名称",
      "author_id": 1,
      "author_name": "作者名",
      "status": 0,
      "view_count": 101,
      "like_count": 10,
      "favorite_count": 5,
      "comment_count": 3,
      "tags": [
        {
          "id": 1,
          "name": "标签名"
        }
      ],
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**注意**：响应的 `data` 是数组格式，包含一个文章对象。

---

## 4. 用户接口

### 4.1 用户注册

**接口路径**：`POST /users/register`

**请求体**：

```json
{
  "username": "user123",
  "password": "password123",
  "email": "user@example.com",
  "nickname": "昵称",
  "openid": "xxx"
}
```

**请求字段**：
- `username`: 用户名（必填）
- `password`: 密码（必填）
- `email`: 邮箱（必填）
- `nickname`: 昵称（可选）
- `openid`: 微信openid（可选，用于绑定）

**响应示例**：

```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "user123"
  }
}
```

---

### 4.2 用户登录

**接口路径**：`POST /users/login`

**请求体**：

```json
{
  "username": "user123",
  "password": "password123",
  "captcha": "1234",
  "openid": "xxx"
}
```

**请求字段**：
- `username`: 用户名（必填）
- `password`: 密码（必填）
- `captcha`: 验证码（可选，有openid时不需要）
- `openid`: 微信openid（可选，用于绑定）

**响应示例**：

```json
{
  "code": 200,
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": 1,
    "username": "user123",
    "nickname": "昵称",
    "email": "user@example.com",
    "avatar_url": "https://...",
    "role": "user",
    "is_root": 0,
    "points": 100,
    "openid": "xxx"
  }
}
```

---

### 4.3 获取当前用户信息

**接口路径**：`GET /users/me`

**认证**：需要 Token

**响应示例**：

```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "id": 1,
    "username": "user123",
    "nickname": "昵称",
    "email": "user@example.com",
    "avatar_url": "https://...",
    "role": "user",
    "is_root": 0,
    "points": 100,
    "openid": "xxx",
    "status": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 字段命名规范

**严格遵守以下规范**：

1. **使用下划线命名法**（snake_case）：
   - ✅ `user_id`, `created_at`, `avatar_url`
   - ❌ `userId`, `createdAt`, `avatarUrl`

2. **常用字段名**：
   - ID字段：`id`, `user_id`, `goods_id`, `category_id`, `tag_id`
   - 时间字段：`created_at`, `updated_at`
   - URL字段：`avatar_url`, `cover_url`, `image_url`
   - 数量字段：`view_count`, `like_count`, `favorite_count`, `comment_count`
   - 状态字段：`status`, `is_root`

3. **禁止简写**：
   - ✅ `description`, `quantity`, `receiver`
   - ❌ `desc`, `qty`, `recv`

4. **布尔值字段**：
   - 使用 `is_` 前缀：`is_root`
   - 值为 0 或 1（数字类型）

5. **枚举值使用字符串**：
   - 订单状态：`"pending"`, `"approved"`, `"shipped"`, `"completed"`, `"cancelled"`
   - 商品类型：`"physical"`, `"virtual"`, `"title"`
   - 用户角色：`"user"`, `"editor"`, `"admin"`

---

**完整 Swagger 文档**：http://localhost:8021/api-docs

**最后更新**：2024-01-01
