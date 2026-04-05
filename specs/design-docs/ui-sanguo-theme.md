# 设计文档：三国古风 UI 主题重塑

| 字段 | 值 |
|------|-----|
| **状态** | `Draft` |
| **作者** | spec-architect |
| **创建** | 2026-04-04 |
| **关联** | [07-ui-design](../../ai-docs/07-ui-design.md)、[css/main.css](../../css/main.css) |

---

## 1. 背景与动机

当前 UI 风格定义为 _"Dark Cyberpunk × Chinese Aesthetic"_，实际视觉效果偏向现代深蓝暗色科技感，**缺乏三国/中国古风辨识度**。与市面上典型的中国网游三国题材（如三国志战略版、率土之滨、少年三国志）的 UI 风格差距较大。

**核心诉求**：将 UI 视觉从"赛博朋克暗蓝"转向**中国古风三国题材**，保持暗色调但引入传统中国美学元素，使玩家一眼辨识"这是一款三国游戏"。

---

## 2. 设计方向

### 2.1 视觉关键词

| 维度 | 当前（❌ 抛弃） | 目标（✅ 采用） |
|------|-----------------|-----------------|
| 色调 | 深蓝 + 霓虹粉红 | **墨色 + 朱红 + 鎏金** |
| 质感 | 平滑渐变、发光 | **纸卷质感、絹帛纹理、木牍边框** |
| 边框 | 简单 1px solid | **中式回纹/云纹边角装饰** |
| 字体 | 现代无衬线 | **宋体/楷体标题 + 无衬线正文** |
| 图标 | Emoji | **Emoji（保留）+ CSS 古风容器包裹** |
| 按钮 | 圆角矩形纯色 | **木牍/玉牌/金令形态按钮** |
| 分割线 | 1px solid 蓝色 | **祥云纹分割、竹简纹理** |
| 品质边框 | 纯色发光 | **传统玉器/青铜/金器质感** |

### 2.2 参考风格板

典型中国三国网游 UI 特征：
- **背景**：深褐/墨色底，带浅淡的宣纸纹/竹简纹理
- **顶栏**：仿古木匾额，鎏金字体
- **按钮**：仿木质/玉质/铜质，带古风边角纹样
- **卡片**：仿卷轴/竹简/绢帛展开形态，边角有祥云装饰
- **底部导航**：仿鼎/玉佩/铜镜菜单
- **品质色**：白→绿→蓝→紫→橙（沿用，但边框加入古器物质感）
- **金色**：贯穿全局，鎏金高亮标题和重要按钮

---

## 3. 设计令牌重定义

### 3.1 色彩系统

```
旧 Token               →  新值                     语义
──────────────────────────────────────────────────────────
--color-bg              →  #1a1410                 墨色底（深褐近黑）
--color-surface         →  #2a2018                 绢帛面（暖褐色）
--color-surface-dark    →  #120e0a                 深墨底（凹陷区域）
--color-primary         →  #c0392b                 朱红（中国红，主操作色）
--color-secondary       →  #4a3728                 古铜色（边框/辅助）
--color-gold            →  #d4a849                 鎏金色（标题/高亮）
--color-text            →  #e8dcc8                 绢帛白（正文）
--color-text-dim        →  #a09080                 旧纸灰（辅助文字）
--color-text-muted      →  #605040                 深褐灰（极弱文字）
--color-success         →  #5d8a48                 松柏绿
--color-danger          →  #b33a3a                 胭脂红
--color-warning         →  #c98a2e                 琥珀黄
--color-info            →  #4a7fb5                 青花蓝
```

### 3.2 品质色（保持辨识度，调中国古器物色调）

```
--quality-1: #b0a898    白瓷·普通
--quality-2: #5d8a48    翠玉·优秀
--quality-3: #4a7fb5    青花·精锐
--quality-4: #8b5ea8    紫檀·史诗
--quality-5: #d4a849    鎏金·传说
```

### 3.3 字体

```css
--font-title: 'STZhongsong', 'SimSun', 'Noto Serif SC', serif;
--font-main: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif;
```

- 面板标题、武将名、章节名 → `--font-title`（宋体/楷体）
- 正文、按钮、数值 → `--font-main`（无衬线，保持可读性）

### 3.4 阴影与质感

```css
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(212, 168, 73, 0.08);
--shadow-glow-gold: 0 0 12px rgba(212, 168, 73, 0.3);
--border-ornament: 2px solid #4a3728;
--bg-parchment: repeating-linear-gradient(
  0deg,
  transparent,
  transparent 3px,
  rgba(212, 168, 73, 0.03) 3px,
  rgba(212, 168, 73, 0.03) 4px
);  /* 竹简纹理 */
```

---

## 4. 组件规范

### 4.1 顶部资源栏（Header）

| 属性 | 规范 |
|------|------|
| 背景 | `linear-gradient(180deg, #2a2018 0%, #1a1410 100%)`，底部 2px 朱红描线 |
| 装饰 | 左右各一个 CSS 回纹角饰（`::before`/`::after` 伪元素） |
| 资源图标 | 保持 Emoji，外包 `border-bottom: 1px dotted var(--color-gold)` |
| 资源数值 | `color: var(--color-gold); font-weight: 700` |

#### WHEN/THEN

- WHEN 页面加载 THEN 顶部栏显示墨底+鎏金资源数值，底部有朱红描线，两角有回纹装饰
- WHEN 资源变动 THEN 数值更新，无视觉风格变化

### 4.2 底部导航栏（BottomNav）

| 属性 | 规范 |
|------|------|
| 背景 | `#2a2018`，顶部 1px `#4a3728` 描线 |
| 按钮 | 上方 Emoji 图标，下方古风标签文字 |
| 激活态 | 图标下方出现鎏金小横线，文字变鎏金色 |
| 更多菜单 | 背景 `#2a2018`，卡片圆角 `8px`，顶部朱红描线 |
| 形态 | 仿"铜镜底座"视觉感，按钮间有竖线分隔 `1px solid #4a3728` |

#### WHEN/THEN

- WHEN 点击底部导航按钮 THEN 激活按钮显示鎏金下划线和鎏金文字
- WHEN 点击"更多" THEN 弹出菜单背景为暖褐色，条目悬停显示朱红左边框

### 4.3 浮层面板（OverlayPanel）

| 属性 | 规范 |
|------|------|
| 背景 | `#1a1410` 主体，顶部 `#2a2018` 标题栏 |
| 标题栏 | 鎏金文字居中，左右各一个"︾"形云纹装饰（CSS 画） |
| 拖拽手柄 | 鎏金色短横线，宽 40px，高 3px |
| 关闭按钮 | `✕` 改为鎏金色，hover 朱红色 |
| 边框 | 顶部 2px 朱红描线，两侧 1px `#4a3728` |
| 内容区 | 可选竹简纹理背景 `var(--bg-parchment)` |

#### WHEN/THEN

- WHEN 面板滑出 THEN 背景为墨色，标题鎏金，顶部朱红描线
- WHEN 点击关闭或下拉 THEN 面板滑下关闭，无视觉残留

### 4.4 卡片（Card）

| 属性 | 规范 |
|------|------|
| 背景 | `var(--color-surface)` 暖褐 |
| 边框 | `1px solid #4a3728`，四角用 `::before`/`::after` 画回纹角饰 |
| 圆角 | `4px`（古风偏方正） |
| 标题 | 鎏金色，`font-family: var(--font-title)` |
| 阴影 | `0 2px 8px rgba(0,0,0,0.5)` |
| 悬停 | 边框变 `#d4a849` 鎏金描边 |

回纹角饰 CSS 实现方案：

```css
.card {
  position: relative;
}
.card::before,
.card::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--color-gold);
  opacity: 0.4;
}
.card::before {
  top: -1px; left: -1px;
  border-top: 2px solid;
  border-left: 2px solid;
}
.card::after {
  bottom: -1px; right: -1px;
  border-bottom: 2px solid;
  border-right: 2px solid;
}
```

#### WHEN/THEN

- WHEN 卡片渲染 THEN 四角显示鎏金回纹角饰，背景为暖褐色
- WHEN 鼠标悬停卡片 THEN 边框变为鎏金色

### 4.5 按钮（Button）

| 类型 | 背景 | 边框 | 文字 | 语义 |
|------|------|------|------|------|
| `.btn`（主操作） | `linear-gradient(180deg, #d4392b, #a02820)` | `1px solid #e8513a` 顶高光 | 白色 | 朱红木令 |
| `.btn-gold`（重要） | `linear-gradient(180deg, #d4a849, #a07830)` | `1px solid #e8c870` 顶高光 | `#1a1410` 墨色 | 鎏金玉令 |
| `.btn-outline` | 透明 | `1px solid #4a3728` | `#a09080` | 古铜框 |
| `.btn-success` | `linear-gradient(180deg, #5d8a48, #3d6a30)` | `1px solid #7daa68` | 白色 | 松柏绿令 |
| `.btn-danger` | `linear-gradient(180deg, #b33a3a, #8a2020)` | `1px solid #d05050` | 白色 | 胭脂红令 |

所有按钮：
- `border-radius: 2px`（方正，仿木牍/令牌）
- `text-shadow: 0 1px 2px rgba(0,0,0,0.4)`
- `active: transform: scale(0.97); filter: brightness(0.9)`
- 禁用态：`opacity: 0.4; filter: grayscale(0.6)`

#### WHEN/THEN

- WHEN 主按钮渲染 THEN 显示朱红渐变背景，近方形圆角
- WHEN 点击按钮 THEN 轻微缩放+变暗反馈
- WHEN 按钮禁用 THEN 灰度化+低透明度

### 4.6 武将卡（Hero Card）

| 属性 | 规范 |
|------|------|
| 左边框 | 保持品质色 3px，但质感调整（普通→白瓷、传说→鎏金） |
| 武将名 | `font-family: var(--font-title); font-size: 0.92rem` |
| 品质标签 | 仿"印章"样式：`border: 1px solid; border-radius: 2px; font-size: 0.6rem; padding: 1px 4px;` |
| 等级 | 仿铜镜圆形标记：`background: #4a3728; border-radius: 50%; width: 20px; height: 20px;` |
| 经验条 | 保持 pill 形状，填充色改为鎏金→朱红渐变 |
| 操作按钮 | `.btn-small` 仿令牌大小 |

#### WHEN/THEN

- WHEN 传说品质武将卡渲染 THEN 左边框鎏金色，卡片有鎏金辉光
- WHEN 史诗品质武将卡渲染 THEN 左边框紫檀色，卡片有紫檀辉光

### 4.7 阵容格（Team Slots）

| 属性 | 规范 |
|------|------|
| 空格 | 虚线边框 `1px dashed #4a3728`，背景 `#120e0a` |
| 已填充 | 实线边框品质色，背景 `#2a2018` |
| 形态 | 改为**六角形裁切**或保持方形 + 回纹角饰（推荐保持方形，实现简单） |

#### WHEN/THEN

- WHEN 阵容格为空 THEN 显示虚线古铜边框，深墨底
- WHEN 阵容格已填充 THEN 实线品质色边框，暖褐底

### 4.8 进度条（Progress Bar）

| 属性 | 规范 |
|------|------|
| 轨道 | `#120e0a` 深墨底，`1px inset` 阴影 |
| 填充 | 保持品质/语义色，但加入 `background-image: linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.05) 50%)` 竹节纹理 |
| 圆角 | `2px`（更方正） |
| 标签 | 居中白字带墨色描边 |

#### WHEN/THEN

- WHEN 进度条渲染 THEN 轨道为深墨色，填充带竹节纹理

### 4.9 模态框（Modal）

| 属性 | 规范 |
|------|------|
| 背景 | `#2a2018` 暖褐 |
| 边框 | `2px solid #4a3728`，四角回纹装饰 |
| 标题 | 鎏金色，`font-family: var(--font-title)` |
| 遮罩 | `rgba(0, 0, 0, 0.7)`（比当前更暗，突出弹窗） |
| 按钮区 | 底部朱红描线分隔 |

#### WHEN/THEN

- WHEN 模态框弹出 THEN 遮罩层暗色，弹窗暖褐底+回纹角饰+鎏金标题

### 4.10 Toast 通知

| 属性 | 规范 |
|------|------|
| 背景 | `#2a2018` 暖褐 |
| 边框 | 左侧 3px 语义色（成功=松柏绿，错误=胭脂红，警告=琥珀黄，信息=青花蓝） |
| 形态 | 偏方正 `border-radius: 2px` |
| 文字 | `var(--color-text)` 绢帛白 |

#### WHEN/THEN

- WHEN 成功 Toast 弹出 THEN 暖褐底+松柏绿左边框
- WHEN 错误 Toast 弹出 THEN 暖褐底+胭脂红左边框

### 4.11 战斗场景（Battle Scene）

| 属性 | 规范 |
|------|------|
| 容器背景 | `linear-gradient(180deg, #120e0a 0%, #1a1410 100%)` 墨色渐变 |
| 关卡信息条 | 仿卷轴展开形态，左右卷轴头装饰（`::before`/`::after`） |
| 战斗日志 | 仿"竹简"形态：竖纹理背景，行间分隔线 |
| VS 标识 | 保持红色辉光脉冲 |
| 胜利结果 | 鎏金色标题 + 祥云背景装饰 |
| 失败结果 | 暗红色调 + 墨色背景 |

#### WHEN/THEN

- WHEN 战斗胜利 THEN 结果面板显示鎏金"大获全胜"标题
- WHEN 战斗日志渲染 THEN 日志区域显示竹简纹理背景

### 4.12 招募面板（Recruit）

| 属性 | 规范 |
|------|------|
| 招贤馆 | 仿古建筑门楼剪影（CSS 或 SVG），鎏金屋顶 |
| 按钮 | 单抽=朱红令牌，十连=鎏金令牌 |
| 保底进度 | 品质色填充 + 竹节纹理 |
| 传说结果 | 全屏鎏金光效 + 朱红祥云纹背景 |

#### WHEN/THEN

- WHEN 抽到传说武将 THEN 全屏鎏金爆炸光效+朱红祥云背景
- WHEN 抽到史诗武将 THEN 紫檀色光晕+放大展示

### 4.13 分割线（Divider）

```css
.divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    #4a3728 20%,
    #d4a849 50%,
    #4a3728 80%,
    transparent 100%
  );
  margin: 12px 0;
}
```

- 中间鎏金高光、两端渐隐 → 仿古卷轴分割

#### WHEN/THEN

- WHEN 分割线渲染 THEN 显示中间鎏金、两端渐隐的古风分割线

### 4.14 滚动条

```css
::-webkit-scrollbar-thumb {
  background: #4a3728;  /* 古铜色 */
}
::-webkit-scrollbar-thumb:hover {
  background: #6a5738;
}
```

---

## 5. 装饰性 CSS 元素

### 5.1 回纹角饰 Mixin（CSS class）

适用于：卡片、模态框、面板标题栏。

```css
.ornament-corners {
  position: relative;
}
.ornament-corners::before,
.ornament-corners::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
}
.ornament-corners::before {
  top: 0; left: 0;
  border-top: 2px solid var(--color-gold);
  border-left: 2px solid var(--color-gold);
  opacity: 0.5;
}
.ornament-corners::after {
  bottom: 0; right: 0;
  border-bottom: 2px solid var(--color-gold);
  border-right: 2px solid var(--color-gold);
  opacity: 0.5;
}
```

### 5.2 祥云纹分割线

```css
.divider-cloud {
  height: 20px;
  background: url("data:image/svg+xml,...") center/auto 100% repeat-x;
  opacity: 0.15;
}
```

> 具体 SVG 内联数据在实现时由 CSS 编码 Agent 生成。

### 5.3 竹简纹理背景

```css
.bg-bamboo {
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 11px,
    rgba(74, 55, 40, 0.12) 11px,
    rgba(74, 55, 40, 0.12) 12px
  );
}
```

---

## 6. 影响范围

### 6.1 需修改的文件

| 文件 | 修改内容 |
|------|---------|
| `css/main.css` | 全局 Design Tokens 替换、所有组件样式更新 |
| `js/ui/bottom-nav.js` | 渲染 HTML 模板更新（添加分隔线、装饰 class） |
| `js/ui/overlay-panel.js` | 标题栏装饰 class |
| `js/ui/hero-panel.js` | 武将卡模板添加 `font-title` class |
| `js/ui/battle-panel.js` | 战斗场景背景/日志样式 class |
| `js/ui/recruit-panel.js` | 招募展示区+按钮模板 |
| `js/ui/toast.js` | Toast 样式调整（如有 inline style） |
| `js/ui/modal.js` | Modal 标题字体 class |
| `js/ui/resources-bar.js` | 资源栏装饰 class |
| `js/ui/town-panel.js` | 城镇面板卡片 class |
| `js/ui/settings-panel.js` | 设置面板标题字体 |

### 6.2 不受影响

- `js/modules/*`：纯逻辑，无 UI 依赖
- `js/core/*`：引擎层，无 UI 依赖
- `js/data/*`：数据层
- Canvas 绘制（`town-world.js`、`sprite-engine.js`）：地图渲染独立于 CSS 主题

---

## 7. 实施策略

### 阶段 1：Design Tokens + 全局基础（最高优先）

1. 替换 `:root` 下全部 CSS 变量为新色彩系统
2. 添加 `--font-title` 变量
3. 更新 `body` 背景、文字颜色
4. 更新滚动条色

**预期效果**：一次性改变全局色调——从深蓝赛博变为墨色古风。

### 阶段 2：核心组件古风化

1. 卡片：加回纹角饰 + 方正圆角
2. 按钮：渐变背景 + 方正圆角 + 文字描边
3. 分割线：鎏金渐隐效果
4. 进度条：竹节纹理

### 阶段 3：面板装饰

1. Header 朱红描线 + 回纹角
2. OverlayPanel 标题鎏金 + 云纹装饰
3. BottomNav 仿铜镜视觉
4. Modal 回纹角饰 + 鎏金标题

### 阶段 4：面板内容古风化

1. 武将卡 font-title + 印章品质标签
2. 战斗场景墨色渐变 + 竹简日志
3. 招募面板古建筑剪影 + 鎏金光效
4. 各面板小标题统一 font-title

---

## 8. 约束与注意事项

- **纯 CSS 实现**：所有装饰效果必须用 CSS（伪元素、渐变、border）实现，**不引入图片资源**（保持"无图片依赖"原则）
- **性能**：伪元素装饰不超过 2 层（`::before` + `::after`），避免重绘压力
- **可读性**：正文字体保持无衬线，`font-title` 仅用于标题/武将名/章节名
- **兼容性**：所有 CSS 特性须兼容 Chrome 90+、Safari 14+、Firefox 88+
- **渐进增强**：如 `font-title` 字体栈缺失，回退到无衬线字体，不影响功能
- **品质色辨识度**：虽然调色，但 5 级品质的色相差异（白/绿/蓝/紫/橙）必须保持明显区分
- **暗色主调**：虽然从"赛博蓝"转"古风褐"，仍保持暗色主题——不做亮色/白底设计

---

## 9. 验收场景汇总

| # | 场景 | 验收标准 |
|---|------|---------|
| 1 | 全局色调 | WHEN 打开游戏 THEN 整体色调为墨色+暖褐，无蓝色残留 |
| 2 | 标题字体 | WHEN 面板标题渲染 THEN 使用宋体/衬线字体 |
| 3 | 朱红主色 | WHEN 主按钮渲染 THEN 背景为朱红渐变，非粉红 |
| 4 | 鎏金高亮 | WHEN 资源数值、卡片标题渲染 THEN 显示暖金色，非冷黄 |
| 5 | 卡片角饰 | WHEN 卡片渲染 THEN 左上和右下角显示鎏金角饰 |
| 6 | 分割线 | WHEN 分割线渲染 THEN 中间鎏金、两端渐隐 |
| 7 | 按钮形态 | WHEN 按钮渲染 THEN 近方形（2px 圆角），非圆角矩形 |
| 8 | 品质区分 | WHEN 5 种品质并排展示 THEN 颜色差异明显，可一眼区分 |
| 9 | 竹简纹理 | WHEN 战斗日志渲染 THEN 背景有竖条纹竹简效果 |
| 10 | 底部导航 | WHEN 导航栏渲染 THEN 暖褐底+按钮间竖线分隔+激活鎏金下划线 |
| 11 | 无图片依赖 | WHEN 审查 CSS THEN 无 `url()` 引用外部图片文件（内联 SVG data URI 例外） |
| 12 | 移动端适配 | WHEN 390px 宽屏幕查看 THEN 所有装饰和布局正常，无溢出 |

---

## 10. 导航链接

- 父级：[specs/README.md](../README.md)
- 相关：[ai-docs/07-ui-design.md](../../ai-docs/07-ui-design.md) — 原 UI 设计文档
- 系统契约：[specs/system/core-contracts.md](../system/core-contracts.md) — 品质等级、资源枚举
