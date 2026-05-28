# 文栈博客小程序

> 基于微信小程序原生框架开发的博客阅读应用，支持文章浏览、积分商城、扫码登录等功能。

## 快速开始

### 环境要求

- 微信开发者工具
- Node.js >= 14.17.0

### 安装与运行

1. 使用微信开发者工具打开本目录
2. 配置 AppID（测试可使用测试号）
3. 修改 API 地址：`utils/config.js` 中的 `API_BASE_URL`
4. 编译运行

### API 配置

```javascript
// utils/config.js
export const API_BASE_URL = 'https://wzapi.suxin23.cn'; // 生产环境
// export const API_BASE_URL = 'http://localhost:8021'; // 本地开发
```

---

## API 接口文档

### 重要：开发前必读

在开发小程序功能时，请按以下顺序查阅接口文档：

1. **优先查阅**：`docs/API接口快速参考.md`
   - 专为小程序开发设计
   - 包含所有易错点和注意事项
   - 提供完整的请求/响应示例
   - 标注了小程序常用接口

2. **需要详细参数时**：访问 Swagger 文档
   - 本地：http://localhost:8021/api-docs
   - 生产：https://wzapi.suxin23.cn/api-docs

3. **快速查询**：`../../docs/API接口索引.md`
   - 所有接口的快速索引表格
   - 按模块分类
   - 标注认证要求

### 避免读取后端代码

为了提高开发效率，避免 AI 读取后端代码导致的 token 消耗，请：

- 开发新功能前先查阅 `docs/API接口快速参考.md`
- 遇到接口问题时先查看 Swagger 文档
- 只有在文档缺失或有疑问时才查看后端代码

---

## 已完成功能

### 核心功能

- 微信登录与账号绑定
- 文章列表与详情浏览
- 文章搜索与分类筛选
- 文章点赞与收藏
- 评论功能
- 积分系统
- 积分商城与订单管理
- PC 扫码登录支持

### 界面优化

- 首页集成分类快捷入口
- 热门标签云展示
- 轮播图支持
- 无图片商品/订单的优雅降级显示
- 积分流水完整信息展示

---

## 项目结构

```
wenzhan_miniprogram/
├── pages/              # 页面目录
│   ├── index/          # 首页
│   ├── article/        # 文章列表与详情
│   ├── category/       # 分类页
│   ├── points/         # 积分商城
│   ├── me/             # 个人中心
│   ├── auth/           # 登录注册
│   ├── qr-login/       # 扫码登录
│   └── ...
├── components/         # 组件
├── utils/              # 工具函数
│   ├── config.js       # 配置文件
│   ├── request.js      # 请求封装
│   ├── auth.js         # 认证逻辑
│   └── util.js         # 通用工具
├── api/                # API 接口封装
├── docs/               # 文档
│   ├── API接口快速参考.md  # 小程序专用 API 文档
│   └── ...
├── app.js              # 小程序入口
├── app.json            # 全局配置
└── app.wxss            # 全局样式
```

---

## 开发指南

### 接口调用示例

所有接口已封装在 `api/index.js` 中，使用方式：

```javascript
import api from '../../api/index';

// 获取文章列表
const articles = await api.article.getList({ page: 1, pageSize: 10 });

// 获取文章详情
const article = await api.article.getDetail(articleId);

// 点赞文章（需要登录）
const result = await api.article.toggleLike(articleId);

// 收藏文章（需要登录）
const result = await api.article.toggleFavorite(articleId);
```

### 认证处理

Token 已在 `utils/request.js` 中自动处理：

```javascript
// 自动从 storage 读取 token 并添加到 header
// 401 错误时自动跳转登录页
// 无需手动处理认证逻辑
```

### 常见问题

#### 1. 接口返回 401 未登录

检查：
- Token 是否正确存储在 `wx.storage` 中
- Header 中是否正确添加了 `Authorization: Bearer {token}`
- Token 是否过期（需要重新登录）

#### 2. 参数类型错误

常见错误：
- `articleId` 传成了字符串，应该是数字
- `page` 从 0 开始，应该从 1 开始
- 查询参数 `all`、`my` 应该传字符串 `"1"`，不是布尔值

#### 3. 收藏/点赞状态不对

检查：
- 是否在 Header 中带了 Token
- 未登录时调用检查接口会返回默认值 `false`

#### 4. 图片不显示

检查：
- 图片 URL 是否完整
- 是否需要在小程序后台配置域名白名单
- 图片服务器是否支持 HTTPS

---

## 技术要点

### 前端筛选商品

```javascript
// 获取所有商品后在前端根据 type 筛选
const res = await api.points.getGoodsList(params);
let goodsList = res.list || [];

if (activeTab !== 'all') {
  goodsList = goodsList.filter(item => item.type === activeTab);
}
```

### 无图片优雅降级

```xml
<!-- 有图片时显示图片 -->
<image wx:if="{{item.image_url}}" src="{{item.image_url}}" />

<!-- 无图片时显示渐变背景 + 文字 -->
<view class="goods-image-placeholder" wx:else>
  <text class="placeholder-text">{{item.name}}</text>
  <view class="type-badge">{{item.type}}</view>
</view>
```

### 积分流水显示

```javascript
// 正确解析后端返回的字段
const log = {
  reason: item.reason,        // 积分原因
  remark: item.remark,        // 详细信息
  points: item.points,        // 积分变化
  created_at: item.created_at // 时间
};
```

---

## 开发检查清单

### 新功能开发前

- [ ] 查阅 `docs/API接口快速参考.md` 了解接口
- [ ] 确认接口是否需要登录（路径包含 `/token/`）
- [ ] 确认请求参数类型（数字 vs 字符串）
- [ ] 确认响应数据结构

### 接口对接时

- [ ] 使用 `api/index.js` 中封装的方法
- [ ] 检查参数类型是否正确
- [ ] 处理加载状态和错误提示
- [ ] 测试未登录和已登录两种状态

### 提交代码前

- [ ] 测试所有功能正常
- [ ] 检查控制台无报错
- [ ] 检查网络请求是否正常
- [ ] 更新相关文档

---

## 相关文档

| 文档 | 说明 |
|------|------|
| `docs/API接口快速参考.md` | 小程序专用 API 文档，包含详细示例和易错点 |
| `../../docs/API接口索引.md` | 所有接口的快速索引表格 |
| `docs/扫码登录功能说明.md` | PC 扫码登录的完整流程说明 |
| `docs/快速开发指南.md` | 小程序开发快速上手指南 |

---

## 技术栈

- 微信小程序原生框架
- Promise 异步处理
- ES6+ 语法

---

## 注意事项

1. **不要修改后端代码**：所有功能通过前端适配实现
2. **优先查阅文档**：避免重复查看后端代码
3. **参数类型检查**：数字类型参数不要传字符串
4. **Token 管理**：使用封装好的 `utils/auth.js`
5. **错误处理**：使用 `utils/request.js` 的统一错误处理

---

## 更新日志

### 2026-05-19

- 创建小程序专用 API 文档
- 添加接口查询指南
- 优化开发流程说明

### 2026-05-14

- 完成所有核心功能
- 优化界面显示
- 添加无图片降级方案

---

**开发团队**：Suxin  
**最后更新**：2026-05-19
