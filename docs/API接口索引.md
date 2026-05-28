# 文栈博客 API 接口索引

> 本文档供 AI 开发时快速查阅，完整文档�?http://localhost:8021/api-docs

## 认证说明

- **需登录接口**：路径包�?`/token/`
- **认证方式**：`Authorization: Bearer {token}`
- **Token 获取**：登录接口返�?

## 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 分页格式

```json
{
  "list": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 核心接口清单

### 用户模块

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/users/login` | POST | �?| 登录，返�?token |
| `/users/register` | POST | �?| 注册 |
| `/users/me` | GET | �?| 获取当前用户信息 |
| `/users/token/` | GET | �?| 用户列表（管理员�?|
| `/users/token/{id}` | GET/PUT/DELETE | �?| 用户详情/更新/删除 |
| `/users/token/updatePassword` | POST | �?| 修改密码 |

### 文章模块

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/articles` | GET | �?| 文章列表（分页、搜索、筛选） |
| `/articles` | POST | �?| 创建文章 |
| `/articles/{id}` | GET | �?| 文章详情 |
| `/articles/token/{id}` | PUT | �?| 更新文章 |
| `/articles/token/{id}` | DELETE | �?| 删除文章（软�?硬删�?|
| `/articles/token/{id}/restore` | PUT | �?| 恢复文章 |
| `/articles/{id}/view` | POST | �?| 阅读�?+1 |
| `/articles/top` | GET | �?| 文章排行�?|
| `/articles/archive` | GET | �?| 文章归档数据 |
| `/articles/token/list` | GET | �?| 后台文章列表 |

**查询参数**�?
- `page`：页码（默认 1�?
- `pageSize`：每页数量（默认 8�?
- `keyword`：搜索关键词
- `category_id`：分�?ID
- `tag_id`：标�?ID
- `status`：状态（0/1 正常�? 回收站）

### 分类与标�?

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/categories` | GET | �?| 分类列表 |
| `/categories` | POST | �?| 新增分类 |
| `/categories/token/{id}` | PUT/DELETE | �?| 更新/删除分类 |
| `/tags` | GET | �?| 标签列表 |
| `/tags` | POST | �?| 新增标签 |
| `/tags/token/{id}` | PUT/DELETE | �?| 更新/删除标签 |

### 评论模块

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/comments/article/{articleId}` | GET | �?| 某文章的评论列表 |
| `/comments` | POST | 可�?| 发表评论（可匿名�?|
| `/comments/token/{id}` | PUT/DELETE | �?| 更新/删除评论 |

### 点赞模块

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/likes/token/article/{articleId}/toggle` | POST | �?| 点赞/取消点赞 |
| `/likes/article/{articleId}/check` | GET | 可�?| 检查是否已点赞 |

### 收藏模块

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/favorites/token/article/{articleId}/toggle` | POST | �?| 收藏/取消收藏 |
| `/favorites/token/list` | GET | �?| 我的收藏列表 |
| `/favorites/article/{articleId}/check` | GET | 可�?| 检查是否已收藏 |

### 留言模块

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/messages` | GET | �?| 留言列表 |
| `/messages` | POST | �?| 发表留言 |
| `/messages/token/{id}` | PUT/DELETE | �?| 更新/删除留言 |

### 轮播�?

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/swiper` | GET | �?| 轮播图列�?|
| `/swiper` | POST | �?| 新增轮播�?|
| `/swiper/token/{id}` | PUT/DELETE | �?| 更新/删除轮播�?|

### 友情链接

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/friendslink` | GET | �?| 友链列表 |
| `/friendslink` | POST | �?| 新增友链 |
| `/friendslink/token/{link_id}` | PUT/DELETE | �?| 更新/删除友链 |

### 全局配置

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/otherswitch` | GET | �?| 获取全部配置�?|
| `/otherswitch` | POST | �?| 新增配置 |
| `/otherswitch/token/{id}` | PUT/DELETE | �?| 更新/删除配置 |

### 积分商城

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/points/goods` | GET | �?| 商品列表 |
| `/points/goods/{id}` | GET | �?| 商品详情 |
| `/points/goods` | POST | �?| 新增商品 |
| `/points/token/goods/{id}` | PUT/DELETE | �?| 更新/删除商品 |
| `/points/orders` | GET | 可�?| 订单列表 |
| `/points/orders` | POST | �?| 兑换商品 |
| `/points/orders/{id}` | GET | �?| 订单详情 |
| `/points/token/orders/{id}` | PUT | �?| 更新订单状�?|
| `/points/log` | GET | 可�?| 积分流水 |

**积分订单查询参数**�?
- `my=1`：获取当前用户订�?
- `userId`：指定用�?ID
- `status`：订单状态（pending/approved/shipped/completed/cancelled�?
- `page`、`pageSize`：分页参�?

### 数据看板

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/dashboard/token/stats` | GET | �?| 基础统计数据 |
| `/dashboard/token/article-rank` | GET | �?| 文章排行 |
| `/dashboard/token/user-trend` | GET | �?| 用户增长趋势 |
| `/dashboard/token/article-trend` | GET | �?| 文章发布趋势 |

### 微信登录

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/wechat/openid/{code}` | GET | �?| 根据 code 换取 openid |
| `/wechat/userinfo/{openid}` | GET | �?| 根据 openid 获取用户信息 |

### PC 扫码登录（PC 端调用）

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/qrLogin/session` | POST | �?| 创建扫码会话 |
| `/qrLogin/session/{sceneId}` | GET | �?| 查询会话状�?|
| `/qrLogin/session/{sceneId}/code.png` | GET | �?| 获取小程序码图片 |

### 扫码登录（小程序端调用）

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/miniapp/qr-login/entry` | POST | �?| 扫码后上�?|
| `/miniapp/qr-login/register-and-confirm` | POST | �?| 注册并确认登�?|
| `/miniapp/qr-login/bind-and-confirm` | POST | �?| 绑定并确认登�?|

---

## 小程序常用接口组�?

### 首页

1. `/swiper` - 轮播�?
2. `/articles/top?type=view_count&limit=5` - 热门文章
3. `/articles?page=1&pageSize=10` - 文章列表
4. `/categories` - 分类列表

### 文章详情�?

1. `/articles/{id}?incrementView=true` - 文章详情（增加阅读量�?
2. `/likes/article/{id}/check` - 检查点赞状�?
3. `/favorites/article/{id}/check` - 检查收藏状�?
4. `/comments/article/{id}?status=1` - 评论列表

### 分类�?

1. `/categories` - 分类列表
2. `/articles?category_id={id}&page=1` - 该分类下的文�?

### 积分商城

1. `/points/goods` - 商品列表
2. `/points/goods/{id}` - 商品详情
3. `/points/orders?my=1` - 我的订单
4. `/points/log` - 积分流水

### 我的页面

1. `/users/me` - 当前用户信息
2. `/favorites/token/list` - 我的收藏
3. `/points/orders?my=1` - 我的订单
4. `/points/log` - 积分流水

---

## 易错点提�?

### 参数类型

- `articleId`、`category_id`、`tag_id` �?ID 参数必须�?*数字类型**，不能传字符�?
- `page` �?**1** 开始，不是 0
- 查询参数�?`all`、`my` 等需要传**字符�?* `"1"`，不是布尔�?

### Token 使用

- 需�?Token 的接口路径包�?`/token/`
- Header 格式：`Authorization: Bearer {token}`，注�?`Bearer` 后有空格
- 可�?Token 的接口（如点�?收藏检查）不带 Token 时返回默认�?

### 响应字段

- 点赞接口返回 `liked`（boolean�?
- 收藏接口返回 `favorited`（boolean�?
- 分页数据�?`data.list` 中，分页信息�?`data.pagination` �?
- 积分流水 `points` 为正数表示获得，负数表示消�?

### 状态码

- 文章 `status`�?=展示�?=置顶�?=回收�?
- 评论 `status`�?=已发布，0=待审核，2=屏蔽
- 订单 `status`：pending/approved/shipped/completed/cancelled

---

## 开发建�?

### 前端/小程序开发时

1. **优先查阅**：`wenzhan_miniprogram/docs/API接口快速参�?md`（小程序专用，包含详细示例和易错点）
2. **需要详细参数时**：访�?http://localhost:8021/api-docs 或读�?`Express/config/swagger.js`
3. **避免读取后端代码**：除非接口文档缺失或有疑�?

### 接口调用示例

小程序端�?

```javascript
// 已封装在 utils/request.js
const { data } = await request.get('/articles', { page: 1 });
```

前端 Vue3�?

```javascript
// 已封装在 src/api/api.js
import { getArticles } from '@/api/api';
const articles = await getArticles({ page: 1 });
```

---

**完整 Swagger 文档**：http://localhost:8021/api-docs

**小程序专用文�?*：`wenzhan_miniprogram/docs/API接口快速参�?md`

**最后更�?*�?024-01-01
