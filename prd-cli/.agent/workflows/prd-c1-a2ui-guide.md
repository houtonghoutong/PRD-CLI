---
description: C1 A2UI 界面示意专项指南 (Web Preview 版)
---

# C1 A2UI 界面示意专项指南

**本文档是 prd-c1-requirement-list.md 的补充，专注于界面示意环节的详细指导。**

---

## 🚀 新一代 A2UI 工作流 (Web Preview)

我们已经升级了 A2UI 能力！现在支持通过 `prd ui` 命令在浏览器中实时预览可交互的界面原型。

### 核心机制

1. **AI 生成数据**：AI 根据需求生成标准 JSON 数据。
2. **自动写入**：AI 将数据写入 `.a2ui/current.json` 文件。
3. **实时预览**：预览服务 (`prd ui`) 应在 C1 开始前启动，之后 PM 只需刷新浏览器即可看到更新。

---

## 🛠️ A2UI 标准组件库 (Schema)

为了确保 Web 预览器能正确渲染，AI **必须** 严格遵守以下 Schema。

### 1. 基础结构
```json
{
  "type": "Page",
  "title": "页面标题",
  "children": [ ... ]
}
```

### 2. 布局组件
- **Page**: 根节点
  - `title`: 页面标题 (string)
  - `children`: 子组件数组
- **Row**: 水平布局
  - `children`: 子组件数组
- **Col**: 垂直/列布局
  - `children`: 子组件数组
- **Panel**: 带边框的面板
  - `title`: 面板标题 (可选)
  - `children`: 子组件数组

### 3. 表单与交互组件
- **Input**: 输入框
  - `label`: 标签 (string)
  - `placeholder`: 占位符 (string)
- **Button**: 按钮
  - `text`: 按钮文字 (string)
- **Text**: 纯文本
  - `content`: 文本内容 (string)

### 4. 架构图组件 (用于 B1/P0 阶段)

**适用于规划阶段生成系统框架图、模块关系图等**

- **Diagram**: 架构图容器（紫色渐变背景）
  - `title`: 图表标题 (string)
  - `children`: 子组件数组
- **Layer**: 层级分区（水平排列子元素）
  - `title`: 层级标题 (string, 可选)
  - `children`: 子组件数组
- **DiagramGroup**: 虚线分组框
  - `title`: 分组标题 (string)
  - `children`: 子组件数组
- **Box**: 模块方框
  - `title`: 模块名称 (string)
  - `desc`: 模块描述 (string, 可选)
  - `color`: 左边框颜色 (string, 可选, 如 "#3b82f6")
- **Arrow**: 连接箭头
  - `direction`: 方向 ("up" | "down" | "left" | "right")
  - `label`: 箭头说明 (string, 可选)

---

## 📝 交互流程规范

### 第一步：生成并写入预览数据

**当 PM 描述完界面需求后，AI 必须执行：**

1. **构思 JSON 结构**：在思维链中构建符合 Schema 的 JSON。
2. **写入文件**：使用 `write_to_file` 工具将 JSON 写入 `.a2ui/current.json`。
3. **提示预览**：告知 PM 刷新浏览器查看（假设预览服务已启动）。

**AI 对话示例：**

```
AI: "明白了，这个用户详情页需要包含基本信息表单和操作按钮。

     我已生成 A2UI 预览数据。
     
     👉 请刷新浏览器 (http://localhost:3333) 查看实时预览。
     
     （如果预览服务未启动，请先运行 prd ui）"
```

### 第二步：根据反馈迭代

**当 PM 提出修改意见（如"把按钮移到左边"）时：**

1. **修改 JSON**：调整 `.a2ui/current.json` 中的数据结构。
2. **覆盖写入**：再次使用 `write_to_file` 覆盖原文件。
3. **提示刷新**：告知 PM 刷新浏览器即可看到变化。

### 第三步：正式保存（PM 确认后必须执行！）

**当 PM 确认界面原型后，AI 必须将其保存到正式目录，作为交付物给开发参考。**

#### 保存位置

```
02_迭代记录/第XX轮迭代/C1_UI原型/
    ├── REQ-001-登录页.html       ← 👁️ 开发双击直接看界面
    ├── REQ-001-登录页.json       ← 📄 数据结构
    ├── REQ-002-首页看板.html
    ├── REQ-002-首页看板.json
    └── index.md                   ← 📋 索引目录
```

#### AI 保存流程

```
1. PM 确认："这个界面可以了"
   ↓
2. AI 询问需求编号：
   "好的，界面已确认。请告诉我这个界面对应的需求编号，如 REQ-001。"
   ↓
3. PM 回答："REQ-001"
   ↓
4. AI 正式保存（必须生成 3 个文件）：
   a) REQ-001-界面名称.json  - JSON 数据文件
   b) REQ-001-界面名称.html  - 独立 HTML 预览文件（内嵌渲染器和数据）
   c) 更新 index.md 索引文件
   ↓
5. AI 确认：
   "✅ 界面原型已正式保存！
    
    📁 文件位置：
    - 👁️ 预览: 02_迭代记录/第01轮迭代/C1_UI原型/REQ-001-登录页.html
    - 📄 数据: 02_迭代记录/第01轮迭代/C1_UI原型/REQ-001-登录页.json
    
    开发可以双击 .html 文件直接在浏览器查看界面效果。"
```

#### HTML 预览文件要求

**AI 生成的 HTML 文件必须：**
1. 包含完整的 CSS 样式（复制 a2ui-viewer 的样式）
2. 包含完整的渲染引擎 JS 代码
3. 内嵌 JSON 数据（不依赖外部文件）
4. 顶部显示需求编号、界面名称、确认时间
5. 可以脱离服务器，双击直接在浏览器打开

#### index.md 索引文件格式

```markdown
# C1 UI 原型索引

| 需求编号 | 界面名称 | 👁️ 预览 | 📄 数据 | 确认时间 |
|---------|---------|--------|--------|---------|
| REQ-001 | 登录页 | [.html](./REQ-001-登录页.html) | [.json](./REQ-001-登录页.json) | 2025-12-27 |
```

#### 在 Markdown 文档中嵌入预览

**AI 可以在 B1/B2/C1 文档中直接嵌入 HTML 预览，让用户无需切换文件夹：**

```markdown
## 系统架构图

<iframe src="./架构图/系统架构.html" width="100%" height="400" frameborder="0"></iframe>

> 💡 如果 iframe 无法显示，请直接打开 [系统架构.html](./架构图/系统架构.html)
```

**注意**：不是所有 Markdown 编辑器都支持 iframe。如果不支持，AI 应该：
1. 提供 HTML 文件的链接
2. 或者将关键内容以 ASCII 图的形式展示在 Markdown 中

---

## 💻 完整示例：用户注册页

### 场景描述
PM: "做一个简单的注册页，要有用户名、密码，下面是注册按钮，右边放个帮助说明。"

### AI 生成的 JSON (写入 .a2ui/current.json)

```json
{
  "type": "Page",
  "title": "用户注册",
  "children": [
    {
      "type": "Row",
      "children": [
        {
          "type": "Col",
          "children": [
            {
              "type": "Panel",
              "title": "填写账户信息",
              "children": [
                { "type": "Input", "label": "用户名", "placeholder": "请输入用户名" },
                { "type": "Input", "label": "密码", "placeholder": "请输入密码" },
                { "type": "Button", "text": "立即注册" }
              ]
            }
          ]
        },
        {
          "type": "Col",
          "children": [
            {
              "type": "Panel",
              "title": "帮助中心",
              "children": [
                { "type": "Text", "content": "密码必须包含字母和数字。" },
                { "type": "Text", "content": "遇到问题请联系客服。" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🚫 AI 避坑指南

1. **不要编造组件**：只能使用 `Page`, `Panel`, `Row`, `Col`, `Input`, `Button`, `Text`。不要用 `Table` (暂不支持), `Chart` 等。
2. **不要忘记写入**：必须调用 `write_to_file`，否则 `prd ui` 读不到数据。
3. **不要只给 JSON**：生成 JSON 的同时，最好也简单描述一下布局，照顾无法运行命令的场景。

---

**参考**：C1 主流程请查看 `prd-c1-requirement-list.md`
