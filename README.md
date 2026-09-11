# 文栈博客系统（Wenzhan Blog）

> 基于 Vue 3 + Express + MySQL 构建的前后端分离博客平台，集成用户认证、内容管理、互动系统、积分商城、数据看板及微信小程序扫码登录等完整功能。

## 📌 在线预览

- **前台展示**：[Suxin's blog](http://wzblog.suxin23.cn)
- **API 接口**：[wzapi.suxin23.cn](https://wzapi.suxin23.cn)
- **API 文档**：[wzapi.suxin23.cn/api-docs](https://wzapi.suxin23.cn/api-docs)

## ✨ 项目特色

### 核心亮点

- 🔐 **完整认证体系**：JWT + RefreshToken + 验证码 + 时间戳防重放
- 👥 **RBAC 权限控制**：管理员/编辑/普通用户三级角色体系
- 📱 **跨端扫码登录**：PC 展示二维码，微信小程序扫码确认登录，支持手动切换打开正式版/体验版/开发版
- 🎁 **积分激励系统**：登录、发文、评论、点赞获取积分，支持商城兑换
- 📊 **数据运营看板**：用户趋势、文章排行、流量来源可视化分析
- 🛡️ **安全机制完善**：参数化查询、密码加密、内容审核、敏感词过滤

### 功能模块

| 模块 | 功能说明 |
|------|---------|
| **用户系统** | 注册、登录、找回密码、用户管理、角色权限控制 |
| **内容管理** | 文章发布/编辑/删除、分类标签、富文本编辑、图片上传 |
| **互动系统** | 评论审核、点赞收藏、留言板、友情链接 |
| **积分商城** | 积分获取规则、商品兑换、订单管理、积分流水 |
| **数据看板** | 统计概览、文章排行、用户趋势、流量分析 |
| **微信登录** | 小程序扫码登录、openid 绑定、跨端身份认证 |
| **系统设置** | 轮播图、站点配置、敏感词管理、主题设置 |

## 🏗️ 技术架构

### 前端技术栈

```
Vue 3 + Vite + Naive UI + Pinia + Vue Router
├── WangEditor (富文本编辑器)
├── ECharts (数据可视化)
├── Prism.js (代码高亮)
├── Axios (HTTP 请求)
└── CryptoJS (加密工具)
```

### 后端技术栈

```
Node.js + Express + MySQL
├── jsonwebtoken (JWT 认证)
├── bcrypt (密码加密)
├── multer (文件上传)
├── swagger (API 文档)
├── cors (跨域支持)
└── mysql2 (数据库连接池)
```

### 架构模式

```
┌─────────────┐      HTTP/JSON      ┌─────────────┐      SQL      ┌─────────┐
│   Vue 3     │ ──────────────────> │   Express   │ ───────────> │  MySQL  │
│   前端应用   │ <────────────────── │   RESTful   │ <─────────── │  数据库  │
└─────────────┘      响应数据        └─────────────┘     查询结果   └─────────┘
```

## 📁 项目结构

```
.
├── Express/              # 后端服务
│   ├── controllers/      # 控制器层
│   ├── services/         # 业务逻辑层
│   ├── routes/           # 路由定义
│   ├── common/           # 公共工具
│   ├── config/           # 配置文件
│   └── app.js            # 应用入口
├── Vue3/                 # 前端应用
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   ├── components/   # 公共组件
│   │   ├── api/          # API 封装
│   │   ├── stores/       # 状态管理
│   │   └── common/       # 工具函数
│   └── vite.config.js    # Vite 配置
├── sql/                  # 数据库脚本
│   ├── wz_blog_schema.sql    # 建表脚本
│   ├── wz_blog_seed.sql      # 初始数据
│   └── migrations/           # 数据迁移
└── docs/                 # 项目文档
    ├── 项目整体功能介绍.md
    ├── 项目说明文档.md
    ├── 功能模块.md
    ├── 系统核心技术.md
    ├── PC扫码微信小程序登录设计.md
    ├── 小程序移植计划.md
    ├── 小程序页面原型设计.md
    ├── 富文本转Markdown可行性分析.md
    └── 积分系统说明.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 14.17.0
- MySQL >= 8.0
- npm 或 yarn

### 1. 克隆项目

```bash
git clone git@github.com:suxin0203/newBlog_Vue3_Naive-ui.git
cd newBlog_Vue3_Naive-ui
```

### 2. 数据库初始化

```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE wz_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 导入建表脚本
mysql -u root -p wz_blog < sql/wz_blog_schema.sql

# 导入初始数据（可选）
mysql -u root -p wz_blog < sql/wz_blog_seed.sql
```

### 3. 后端启动

```bash
cd Express

# 安装依赖
npm install

# 配置数据库连接（修改 common/pool.js）
# 配置环境变量（可选）
# JWT_SECRET=your_secret_key
# WX_MINIAPP_APPID=your_appid
# WX_MINIAPP_SECRET=your_secret

# 开发模式启动
npm run dev

# 生产模式启动
npm start
```

后端服务将运行在 `http://localhost:8021`

### 4. 前端启动

```bash
cd Vue3

# 安装依赖
npm install

# 配置 API 地址（修改 .env.development）
# VITE_API_BASE_URL=http://localhost:8021

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

前端应用将运行在 `http://localhost:5173`

### 5. 访问应用

- 前台首页：`http://localhost:5173`
- 后台管理：`http://localhost:5173/dashboard`
- API 文档：`http://localhost:8021/api-docs`

### 默认账号

```
管理员账号：admin / admin123
编辑账号：editor / editor123
普通用户：user / user123
```

## 📖 文档导航

| 文档 | 说明 |
|------|------|
| [项目整体功能介绍](docs/项目整体功能介绍.md) | 系统完整功能清单、业务流程、技术亮点总览 |
| [项目说明文档](docs/项目说明文档.md) | 项目背景、目标、整体架构与业务亮点 |
| [功能模块](docs/功能模块.md) | 模块划分、核心接口、角色权限边界 |
| [系统核心技术](docs/系统核心技术.md) | 技术栈、认证鉴权、安全机制、请求链路 |
| [PC扫码登录设计](docs/PC扫码微信小程序登录设计.md) | 扫码登录专题设计、状态流转、接口样例 |
| [积分系统说明](docs/积分系统说明.md) | 积分来源、每日上限、回退规则、流水管理 |
| [小程序移植计划](docs/小程序移植计划.md) | 小程序端功能规划、技术方案、实施路线 |
| [小程序页面原型设计](docs/小程序页面原型设计.md) | 小程序页面结构、交互流程和接口依赖 |
| [富文本转 Markdown 可行性分析](docs/富文本转Markdown可行性分析.md) | 富文本改 Markdown 的收益、工作量、风险和推荐路线 |
| [开发进度清单](docs/开发与进度/开发进度与代办清单.md) | 当前实现进度、待办事项、优先级安排 |

## 🎯 核心业务流程

### 用户登录流程

```
用户输入账号密码 → 验证码校验 → 后端验证 → 签发 JWT Token 
→ 返回 AccessToken + RefreshToken → 前端存储 → 访问受保护接口
```

### 扫码登录流程

```
PC 创建会话 → 展示小程序码 → 用户扫码 → 小程序确认/注册/绑定 
→ 后端更新状态 → PC 轮询获取 Token → 完成登录
```

### 积分获取流程

```
用户行为（登录/发文/评论/获赞） → 后端校验规则 → 判断每日上限 
→ 写入积分流水 → 更新用户余额 → 前端展示变化
```

## 🔒 安全机制

- ✅ 密码 bcrypt 加密存储
- ✅ JWT 访问令牌 + RefreshToken 刷新机制
- ✅ 时间戳防重放攻击（30 秒窗口）
- ✅ SQL 参数化查询防注入
- ✅ 评论审核机制
- ✅ 敏感词过滤
- ✅ 文件上传类型限制
- ✅ 角色权限边界控制

## 🛠️ 开发工具

- **IDE**：VS Code + Volar
- **API 测试**：Postman / Swagger UI
- **数据库管理**：Navicat / MySQL Workbench
- **版本控制**：Git

## 📊 数据看板预览

系统提供完整的数据运营看板，包括：

- 📈 用户增长趋势图
- 📝 文章发布趋势图
- 🔥 热门文章排行榜
- 🌍 流量来源分析
- 💬 评论互动统计
- 🎁 积分消费分析

## 🔮 未来规划

### 短期计划

- [ ] 微信小程序端开发（文章浏览、用户登录、积分系统）
- [ ] Markdown 编辑器支持（替换富文本编辑器）
- [ ] 文章搜索功能优化
- [ ] 移动端响应式适配

### 长期规划

- [ ] 多主题切换支持
- [ ] 文章草稿自动保存
- [ ] 评论回复嵌套展示
- [ ] 站内消息通知系统
- [ ] 文章导出 PDF 功能
- [ ] SEO 优化与 SSR 支持

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 开源协议

本项目采用 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。

## 👨‍💻 作者

**Suxin**

- GitHub: [@suxin0203](https://github.com/suxin0203)
- Blog: [wzblog.suxin23.cn](http://wzblog.suxin23.cn)

## 🙏 致谢

感谢以下开源项目：

- [Vue.js](https://vuejs.org/)
- [Naive UI](https://www.naiveui.com/)
- [Express](https://expressjs.com/)
- [WangEditor](https://www.wangeditor.com/)
- [ECharts](https://echarts.apache.org/)

---

⭐ 如果这个项目对你有帮助，欢迎 Star 支持！
