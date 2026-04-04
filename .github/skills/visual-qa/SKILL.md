---
name: visual-qa
description: "通过 Chrome DevTools MCP 自主验收游戏画面：截图、检查渲染、验证 UI 布局、确认地图显示正确。Use when verifying game visually, taking screenshots, checking canvas rendering, validating UI layout, testing game in browser, visual regression testing, or self-verifying map and sprite rendering."
argument-hint: "验收目标描述（如：验证新地图渲染）"
---

# Chrome 驱动的可视化自验收

## 目的

让 Agent 能自主启动本地服务器、通过 Chrome MCP 打开游戏、截图检查、验证渲染结果是否正确，形成**全自动视觉 QA 闭环**。

## 何时使用

- 创建/修改了地图，需要验证渲染效果
- 修改了 UI 面板，需要确认布局正确
- 修改了精灵动画，需要检查播放效果
- 任何涉及视觉展示的变更后

## Chrome DevTools MCP 工具清单

本 skill 使用以下 MCP 工具（`mcp_chrome-devtoo_*` 前缀）：

| 工具 | 用途 |
|------|------|
| `new_page` | 打开新标签页 |
| `navigate_page` | 导航到 URL |
| `take_screenshot` | 截屏（最核心） |
| `take_snapshot` | 获取 DOM 快照 |
| `evaluate_script` | 在页面执行 JS |
| `click` | 点击元素 |
| `fill` | 填写输入框 |
| `wait_for` | 等待元素/条件 |
| `list_pages` | 列出所有页面 |
| `select_page` | 选择特定页面 |
| `get_console_message` | 获取控制台消息 |
| `list_console_messages` | 列出所有控制台消息 |

## 操作步骤

### 1. 启动本地服务器

```bash
# 在项目根目录启动静态文件服务器（后台运行）
python -m http.server 8000
```

使用 `run_in_terminal` 的 `isBackground: true` 模式。

### 2. 打开游戏页面

```
mcp_chrome-devtoo_navigate_page → http://localhost:8000
```

或者如果需要打开特定工具页面：
```
mcp_chrome-devtoo_navigate_page → http://localhost:8000/tools/map-editor.html
```

### 3. 等待加载完成

```
mcp_chrome-devtoo_wait_for → selector: "canvas" 或 "#game-container"
```

### 4. 截图检查

```
mcp_chrome-devtoo_take_screenshot
```

对截图进行视觉分析，检查：
- [ ] 页面是否完整加载（无白屏）
- [ ] Canvas 是否正常渲染（非空白）
- [ ] 地图/精灵是否正确显示
- [ ] UI 元素是否正确排列
- [ ] 无明显的渲染错误（贴图撕裂、错位等）

### 5. 执行交互验证

通过 JS 注入来检查游戏状态：

```javascript
// 检查地图是否加载
mcp_chrome-devtoo_evaluate_script →
  "JSON.stringify({ mapsLoaded: Object.keys(MapLoader._cache), tilesets: Object.keys(MapLoader._tilesetImages) })"

// 检查控制台错误
mcp_chrome-devtoo_list_console_messages
```

### 6. 模拟用户操作

```
// 点击底部导航切换到冒险面板
mcp_chrome-devtoo_click → selector: "[data-nav='adventure']"

// 等待面板加载
mcp_chrome-devtoo_wait_for → selector: ".adventure-panel"

// 再截图
mcp_chrome-devtoo_take_screenshot
```

### 7. 检查特定渲染

对于地图验证，可以注入测试代码：

```javascript
// 加载并渲染指定地图到临时 canvas
mcp_chrome-devtoo_evaluate_script → `
  (async function() {
    try {
      var data = await MapLoader.loadMap('map_dungeon_01');
      var c = document.createElement('canvas');
      c.width = data.width * data.tileWidth;
      c.height = data.height * data.tileHeight;
      var ctx = c.getContext('2d');
      MapLoader.renderMap(ctx, data, {x:0,y:0,zoom:1}, {width:c.width,height:c.height});
      // 替换页面内容为渲染结果
      document.body.innerHTML = '';
      document.body.appendChild(c);
      return 'Map rendered: ' + data.width + 'x' + data.height;
    } catch(e) {
      return 'ERROR: ' + e.message;
    }
  })()
`

// 截图查看渲染结果
mcp_chrome-devtoo_take_screenshot
```

## 验收清单模板

对每次验收，按以下清单逐项确认：

### 基础检查
- [ ] 页面无 JS 报错（console messages clean）
- [ ] 所有资源加载成功（无 404）
- [ ] 画面不是空白/黑屏

### 地图验收
- [ ] 地面层正确铺设（无黑色空洞）
- [ ] 墙壁/边界正确显示
- [ ] 物体层正确叠加
- [ ] 碰撞区域与视觉一致
- [ ] NPC/生成点位置合理

### UI 验收
- [ ] 底部导航栏完整显示
- [ ] 面板切换流畅
- [ ] 弹窗/浮层正常打开关闭
- [ ] 数字显示正确（formatNumber）
- [ ] 移动端布局不溢出（max-width 480px）

### 精灵验收
- [ ] 角色动画正常播放
- [ ] 帧对齐无错位
- [ ] 特效动画完整

## 错误处理

如果验收发现问题：

1. **截图保存**：记录问题截图
2. **控制台日志**：收集错误信息
3. **定位问题**：通过 DOM 快照和 JS 执行定位
4. **修复后重验**：修改代码后重新走一遍验收流程
5. **沉淀经验**：如果是常见问题类型，使用 `/error-capture` skill 记录

## 注意事项

- 本项目是纯静态项目，`python -m http.server 8000` 即可
- Canvas 渲染需要等图片加载完成后再截图
- 使用 `wait_for` 确保元素就绪再操作
- 控制台的 `[warn]` 级别日志通常可忽略
- 截图分辨率默认跟随浏览器窗口大小，可用 `resize_page` 调整
