# PC 扫码登录逻辑说明

## ✅ 核心逻辑

### 扫码登录 ≠ 小程序登录

**扫码登录是独立的授权流程，不需要用户先登录小程序！**

---

## 🔄 完整流程

### 1. 用户扫码
```
PC 端生成二维码（包含 sceneId）
→ 用户扫码
→ 小程序打开 pages/pc-qr-login/index
→ 自动获取 scene 参数
```

### 2. 获取 openid
```javascript
// 不需要检查小程序登录状态
// 直接调用 wx.login() 获取 code
const loginRes = await wx.login()
const code = loginRes.code

// 调用后端接口
POST /qr-login/entry
{
  sceneId: "xxx",
  code: "wx_code"
}
```

### 3. 后端处理
```javascript
// 后端通过 code 换取 openid
const sessionData = await wechatMiniService.code2Session(code)
const openid = sessionData.openid

// 查询数据库
const users = await runQuery('SELECT * FROM wz_users WHERE openid = ?', [openid])

if (users[0]) {
  // openid 已绑定用户
  // 更新会话状态为 confirmed
  return { action: 'login_ok' }
} else {
  // openid 未绑定用户
  // 生成 bindToken
  return { action: 'need_register_or_bind', bindToken: 'xxx' }
}
```

### 4. 小程序处理返回
```javascript
if (res.action === 'login_ok') {
  // 已绑定：显示成功，自动关闭
  wx.showToast({ title: '确认成功' })
  wx.navigateBack()
}

if (res.action === 'need_register_or_bind') {
  // 未绑定：提示去绑定账号
  wx.showModal({
    title: '需要绑定账号',
    content: '当前微信未绑定账号，请选择注册新账号或绑定已有账号',
    success: (res) => {
      if (res.confirm) {
        // 跳转到登录页面，携带 bindToken
        wx.redirectTo({
          url: `/pages/auth/login?mode=bind&sceneId=${sceneId}&bindToken=${bindToken}`
        })
      }
    }
  })
}
```

### 5. PC 端获取结果
```javascript
// PC 端轮询查询会话状态
GET /qr-login/session/:sceneId

// 当状态变为 confirmed 时
{
  status: "confirmed",
  token: "xxx",
  refreshToken: "xxx",
  user: {...}
}

// PC 端获取 token，完成登录
```

---

## ✅ 关键点

### 1. 不需要小程序登录
```javascript
// ❌ 错误做法
if (!auth.isLoggedIn()) {
  wx.showModal({ content: '请先登录' })
  return
}

// ✅ 正确做法
// 直接调用 wx.login() 获取 code
// 后端通过 openid 判断是否已绑定
```

### 2. openid 是关键
```
openid 已绑定 → 直接确认登录
openid 未绑定 → 提示绑定账号
```

### 3. 两种场景

#### 场景 A：openid 已绑定
```
扫码 → 获取 openid → 后端确认 → PC 端获取 token → 完成
```

#### 场景 B：openid 未绑定
```
扫码 → 获取 openid → 后端返回 bindToken 
→ 用户选择注册或绑定 → 绑定成功 
→ 后端确认 → PC 端获取 token → 完成
```

---

## 🔒 安全机制

1. **二维码只包含 sceneId**：不包含任何敏感信息
2. **5 分钟有效期**：过期自动失效
3. **一次性使用**：确认后状态变为 completed
4. **bindToken 保护**：未绑定用户需要 bindToken 才能操作

---

## 📝 修改的文件

1. ✅ `pages/pc-qr-login/index.js` - 移除登录检查，直接用 openid 授权
2. ✅ `pages/pc-qr-login/index.wxml` - 页面结构
3. ✅ `pages/pc-qr-login/index.wxss` - 样式
4. ✅ `pages/pc-qr-login/index.json` - 配置

---

## 🧪 测试场景

### 测试 1：已绑定用户
1. 用户 A 的微信已绑定账号
2. 扫码
3. 自动确认成功
4. PC 端获取 token

### 测试 2：未绑定用户
1. 用户 B 的微信未绑定账号
2. 扫码
3. 提示"需要绑定账号"
4. 选择注册或绑定
5. 完成后 PC 端获取 token

---

**状态：** ✅ 扫码登录逻辑已修正，不需要小程序登录，直接用 openid 授权！
