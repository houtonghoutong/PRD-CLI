---
description: A2UI 可视化指南 - 架构图与界面原型
---

# A2UI 可视化指南

**本文档是所有阶段共享的 A2UI 组件库和规范。**

- **P0 阶段**：使用架构图组件生成项目架构图
- **B1/B2 阶段**：使用架构图组件生成模块架构图、需求结构图
- **C1 阶段**：使用界面原型组件生成交互界面

---

## 🚀 A2UI 工作流核心机制

1. **AI 生成数据**：根据 PM 描述生成标准 JSON 数据
2. **自动写入**：AI 将数据写入 `.a2ui/current.json` 文件
3. **实时预览**：PM 运行 `prd ui` 在浏览器中查看
4. **迭代修改**：PM 提出反馈，AI 修改 JSON，PM 刷新浏览器
5. **正式保存**：PM 确认后，AI 保存到正式目录

---

## 🏗️ 第一部分：架构图组件（P0/B1/B2 阶段）

### 适用场景

| 阶段 | 使用场景 |
|------|---------|
| **P0** | 项目整体架构、技术架构、干系人关系 |
| **B1** | 系统模块架构、功能结构 |
| **B2** | 需求结构图、依赖关系图、优先级矩阵 |

### 组件列表

| 组件 | 说明 | 属性 |
|------|------|------|
| **Diagram** | 架构图容器（紫色渐变背景） | `title`, `children` |
| **Layer** | 层级分区（水平排列子元素） | `title`, `children` |
| **DiagramGroup** | 虚线分组框 | `title`, `children` |
| **Box** | 模块方框 | `title`, `desc`, `color` |
| **Arrow** | 连接箭头 | `direction`, `label` |

### 基础 JSON 结构

```json
{
  "type": "Page",
  "title": "系统架构图",
  "children": [
    {
      "type": "Diagram",
      "title": "产品管理系统架构",
      "children": [
        {
          "type": "Layer",
          "title": "用户层",
          "children": [
            { "type": "Box", "title": "产品经理", "desc": "需求规划", "color": "#3b82f6" },
            { "type": "Box", "title": "开发团队", "desc": "技术实现", "color": "#10b981" }
          ]
        },
        { "type": "Arrow", "direction": "down", "label": "需求流转" },
        {
          "type": "DiagramGroup",
          "title": "核心模块",
          "children": [
            { "type": "Box", "title": "需求管理", "color": "#8b5cf6" },
            { "type": "Box", "title": "版本规划", "color": "#8b5cf6" }
          ]
        }
      ]
    }
  ]
}
```

### 保存规则

| 阶段 | 保存位置 |
|------|---------|
| **P0** | `00_项目总览/P0_架构图/` |
| **B1** | `02_迭代记录/第XX轮迭代/B1_架构图/` |
| **B2** | `02_迭代记录/第XX轮迭代/B2_架构图/` |

**保存文件**：`.json` + `.html`

---

## 🎨 第二部分：界面原型组件（C1 阶段）

### 适用场景

| 使用场景 |
|---------|
| 表单页面、列表页面、详情页面 |
| 按钮、输入框、文本展示 |
| 布局结构（水平/垂直） |

### 组件列表

#### 布局组件

| 组件 | 说明 | 属性 |
|------|------|------|
| **Page** | 根节点/页面 | `title`, `children` |
| **Panel** | 带边框面板 | `title`, `children` |
| **Row** | 水平布局 | `children` |
| **Col** | 垂直/列布局 | `children` |
| **Divider** | 分隔线 | - |

#### 表单组件

| 组件 | 说明 | 属性 |
|------|------|------|
| **Input** | 输入框 | `label`, `placeholder`, `type`, `required` |
| **Textarea** | 多行输入 | `label`, `placeholder`, `rows` |
| **Select** | 下拉选择 | `label`, `options` (数组) |
| **Button** | 按钮 | `text`, `variant` (primary/secondary/success/danger) |

#### 展示组件

| 组件 | 说明 | 属性 |
|------|------|------|
| **Text** | 纯文本 | `content` |
| **Badge** | 徽章标签 | `text`, `variant` (primary/success/warning/danger) |
| **Alert** | 提示信息框 | `content`, `variant` (info/success/warning/danger) |

#### 数据组件

| 组件 | 说明 | 属性 |
|------|------|------|
| **Table** | 表格 | `columns`, `data` |
| **Card** | 卡片列表项 | `title`, `desc`, `actions` |
| **Tabs** | 标签页导航 | `items` (字符串数组) |
| **Upload** | 文件上传区 | `text` |

### 基础 JSON 结构

```json
{
  "type": "Page",
  "title": "用户登录",
  "children": [
    {
      "type": "Panel",
      "title": "填写账户信息",
      "children": [
        { "type": "Input", "label": "用户名", "placeholder": "请输入用户名" },
        { "type": "Input", "label": "密码", "placeholder": "请输入密码" },
        { "type": "Button", "text": "登录" }
      ]
    }
  ]
}
```

### 保存规则

**保存位置**：`02_迭代记录/第XX轮迭代/C1_UI原型/`

**保存文件**：
- `REQ-001-界面名称.json` - 数据结构
- `REQ-001-界面名称.html` - 独立预览文件（内嵌渲染器）
- `index.md` - 索引目录

### AI 保存流程

```
1. PM 确认："这个界面可以了"
   ↓
2. AI 询问：请告诉我需求编号（如 REQ-001）
   ↓
3. AI 生成 3 个文件：.json + .html + 更新 index.md
   ↓
4. AI 确认：
   "✅ 界面原型已保存！
    📁 位置：02_迭代记录/第01轮迭代/C1_UI原型/"
```

### 🚀 生成独立预览文件 (HTML)

当 PM 确认原型后，AI 必须生成一个**独立 HTML 文件**，该文件可脱离环境直接打开，方便分享给相关方。

**生成步骤**：
1. 读取下方的 **[HTML 独立文件模板]** 代码
2. 替换以下占位符：
   - `{{TITLE}}` -> 需求编号+名称（如 "#REQ-001 用户登录"）
   - `{{REQ_ID}}` -> 需求编号
   - `{{NAME}}` -> 界面名称
   - `{{DATE}}` -> 当前日期 (YYYY-MM-DD)
   - `{{JSON_DATA}}` -> 完整的 A2UI JSON 数据（注意：不要加引号，直接作为 JS 对象插入）
3. **关键：必须保存两份文件**：
   - 📄 **原始数据**：保存为 `.json` (如 `REQ-001-登录页.json`) -> **用于后续溯源和修改**
   - 👁️ **预览页面**：保存为 `.html` (如 `REQ-001-登录页.html`) -> **用于交付和查看**
   - 路径统一为：`02_迭代记录/第XX轮迭代/C1_UI原型/`

**[HTML 独立文件模板]**：

请读取文件：`prd-cli/templates/a2ui-standalone.html` 获取完整模板代码（包含 HTML/CSS/React/AntD 逻辑）。

⚠️ **注意**：AI 在生成文件时，必须先读取上述模板文件的内容，然后执行替换操作。不要自己编造 HTML 结构。

### 👀 历史溯源与多文件预览

**方法 A：命令行指定文件**
```bash
prd ui ./path/to/specific.json
```

**方法 B：浏览器 URL 参数（推荐）**
启动服务后，直接在浏览器地址栏添加 `?file=` 参数：
```
http://localhost:3333/?file=02_迭代记录/第01轮迭代/C1_UI原型/REQ-001.json
```

> 💡 **提示**：你可以在 Markdown 文档中直接复制文件的相对路径，粘贴到 `file=` 后面。

### 📂 多原型文件管理指南

一个项目中通常会有多个需求点，建议按以下方式管理：

1. **命名规范**：`REQ-{编号}-{名称}.html` (如 `REQ-003-用户反馈.html`)
2. **索引文件**：务必更新 `index.md`，提供所有原型的入口列表
3. **版本控制**：如果需求变更，直接覆盖旧文件，或另存为 `_v2.html`

---

## 🚫 AI 避坑指南

1. **不要编造组件**：只能使用本文档定义的组件
2. **不要忘记写入**：必须调用 `write_to_file` 写入 `.a2ui/current.json`
3. **不要跳过保存**：PM 确认后必须正式保存
4. **不要混淆阶段**：架构图用于 P0/B1/B2，界面原型用于 C1

---

**本文档是所有阶段的 A2UI 统一规范，AI 在任何阶段使用 A2UI 时都应参考此文档。**
