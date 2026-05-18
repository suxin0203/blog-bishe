# TabBar 图标问题排查

## 问题现象
TabBar 图标不显示，只显示文字

## 可能原因

### 1. 图标尺寸不符合要求
微信小程序 TabBar 图标要求：
- **尺寸**：81px × 81px（推荐）
- **格式**：PNG
- **大小**：不超过 40KB
- **背景**：透明背景

### 2. 图标路径问题
- 路径必须是相对路径
- 不能使用网络图片
- 路径区分大小写

### 3. 图标颜色问题
- 未选中图标：灰色或黑色
- 选中图标：彩色或主题色

## 解决方案

### 方案 1：检查图标尺寸
```bash
# 使用图片编辑工具检查图标尺寸
# 确保是 81px × 81px
```

### 方案 2：重新制作图标
使用在线工具制作符合规范的图标：
- https://www.iconfont.cn/
- https://www.flaticon.com/

### 方案 3：暂时使用文字 TabBar
如果图标问题无法快速解决，可以暂时移除图标：

```json
{
  "tabBar": {
    "color": "#6b7280",
    "selectedColor": "#667eea",
    "backgroundColor": "#ffffff",
    "borderStyle": "white",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/points/index",
        "text": "积分"
      },
      {
        "pagePath": "pages/me/index",
        "text": "我的"
      }
    ]
  }
}
```

## 当前配置
```json
{
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "assets/icons/home.png",
        "selectedIconPath": "assets/icons/home-active.png"
      },
      {
        "pagePath": "pages/points/index",
        "text": "积分",
        "iconPath": "assets/icons/points.png",
        "selectedIconPath": "assets/icons/points-active.png"
      },
      {
        "pagePath": "pages/me/index",
        "text": "我的",
        "iconPath": "assets/icons/me.png",
        "selectedIconPath": "assets/icons/me-active.png"
      }
    ]
  }
}
```

## 测试步骤

1. **检查图标文件**
   - 确认文件存在：✅
   - 检查文件大小
   - 检查图片尺寸

2. **清除缓存**
   - 微信开发者工具 → 清除缓存
   - 重新编译

3. **查看控制台**
   - 是否有图标加载错误

## 临时解决方案

如果图标仍然不显示，建议暂时移除图标配置，使用纯文字 TabBar，功能不受影响。

---

**状态：** 图标文件存在，但可能尺寸或格式不符合要求
**建议：** 检查图标尺寸是否为 81px × 81px
