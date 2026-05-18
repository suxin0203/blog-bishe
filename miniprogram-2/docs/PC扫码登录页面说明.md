# PC 扫码登录页面路径说明

## ✅ 页面路径对应

### 后端生成的小程序码
```javascript
// Express/services/wechatMiniService.js
const loginPage = process.env.WX_MINIAPP_PC_LOGIN_PAGE || 'pages/pc-qr-login/index';
```

### 小程序页面
```
pages/pc-qr-login/index
```

---

## ✅ 场景值解析

### 支持的参数格式

#### 1. scene 参数（扫码进入）
```
scene=4c9f5ed681184c578e6609eec2700448
```

#### 2. sceneId 参数（直接传入）
```
sceneId=4c9f5ed681184c578e6609eec2700448
```

#### 3. q 参数（二维码链接）
```
q=https://xxx.com?scene=4c9f5ed681184c578e6609eec2700448
```

---

## ✅ 解析逻辑

```javascript
onLoad(options) {
  const { scene, sceneId, q } = options
  
  let finalSceneId = null
  
  // 1. 优先处理 scene 参数（扫码进入）
  if (scene) {
    finalSceneId = decodeURIComponent(scene)
  } 
  // 2. 其次处理 sceneId 参数（直接传入）
  else if (sceneId) {
    finalSceneId = sceneId
  }
  // 3. 最后处理 q 参数（二维码链接）
  else if (q) {
    const url = decodeURIComponent(q)
    const match = url.match(/scene=([^&]+)/)
    if (match) {
      finalSceneId = match[1]
    }
  }
  
  // 验证 sceneId
  if (!finalSceneId) {
    wx.showModal({
      title: '参数错误',
      content: '未获取到有效的场景值'
    })
    return
  }
  
  this.setData({ sceneId: finalSceneId })
}
```

---

## ✅ 完整流程

### 1. 扫码进入
```
用户扫描二维码
→ 小程序打开 pages/pc-qr-login/index
→ 解析 scene 参数获取 sceneId
→ 检查登录状态
→ 调用 POST /qr-login/entry
```

### 2. 已绑定用户
```
POST /qr-login/entry
→ 返回 { action: "login_ok" }
→ 显示"确认成功"
→ 自动返回
```

### 3. 未绑定用户
```
POST /qr-login/entry
→ 返回 { action: "need_register_or_bind", bindToken: "xxx" }
→ 提示"需要绑定账号"
→ 跳转到登录页面
→ 用户选择注册或绑定
→ 完成后 PC 端获取 Token
```

---

## ✅ 测试场景值

### 测试 URL
```
// 开发工具测试
pages/pc-qr-login/index?scene=4c9f5ed681184c578e6609eec2700448

// 或者
pages/pc-qr-login/index?sceneId=4c9f5ed681184c578e6609eec2700448
```

### 控制台日志
```javascript
PC 扫码登录页面加载，options: { scene: "4c9f5ed681184c578e6609eec2700448" }
从 scene 获取 sceneId: 4c9f5ed681184c578e6609eec2700448
调用小程序入口接口，sceneId: 4c9f5ed681184c578e6609eec2700448, code: xxx
小程序入口返回: { action: "login_ok" }
```

---

## ✅ 错误处理

### 1. 未获取到 sceneId
```javascript
wx.showModal({
  title: '参数错误',
  content: '未获取到有效的场景值',
  showCancel: false,
  success: () => {
    wx.navigateBack()
  }
})
```

### 2. 未登录
```javascript
wx.showModal({
  title: '提示',
  content: '请先登录后再确认扫码登录',
  confirmText: '去登录',
  success: (res) => {
    if (res.confirm) {
      wx.redirectTo({ url: '/pages/auth/login' })
    }
  }
})
```

### 3. 接口调用失败
```javascript
wx.showModal({
  title: '操作失败',
  content: error.message || '请稍后重试',
  showCancel: false
})
```

---

## ✅ 页面文件

1. ✅ `pages/pc-qr-login/index.js` - 逻辑（支持多种场景值格式）
2. ✅ `pages/pc-qr-login/index.wxml` - 页面结构
3. ✅ `pages/pc-qr-login/index.wxss` - 样式
4. ✅ `pages/pc-qr-login/index.json` - 配置
5. ✅ `app.json` - 添加页面路径

---

## ✅ 与后端对应关系

| 后端配置 | 小程序页面 | 状态 |
|---------|-----------|------|
| `pages/pc-qr-login/index` | `pages/pc-qr-login/index` | ✅ 匹配 |
| 场景值：`scene` | 解析：`decodeURIComponent(scene)` | ✅ 支持 |
| 接口：`POST /qr-login/entry` | API：`api.qrLogin.miniappEntry` | ✅ 对应 |

---

**状态：** ✅ 页面路径已对应，场景值解析完善，支持多种格式！
