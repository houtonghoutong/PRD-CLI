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

### HTML 预览文件要求

1. 包含完整的 CSS 样式
2. 包含完整的渲染引擎 JS 代码
3. 内嵌 JSON 数据（不依赖外部文件）
4. 顶部显示需求编号、界面名称、确认时间
5. 可以脱离服务器，双击直接打开

---

## 📝 第三部分：通用规范

### AI 触发流程

```
1. PM 描述结构/界面
   ↓
2. AI 识别关键词（"系统模块"、"页面"、"表单"等）
   ↓
3. AI 主动提议："让我生成一个可视化的图..."
   ↓
4. AI 生成 JSON 并写入 `.a2ui/current.json`
   ↓
5. AI 提示：👉 请刷新浏览器 (http://localhost:3333) 查看
   ↓
6. PM 反馈 → AI 迭代修改 → PM 确认 → AI 正式保存
```

### 在 Markdown 中嵌入预览

```markdown
## 系统架构图

> 查看 [系统架构图](./B1_架构图/架构图-系统架构.html)

<!-- 或使用 iframe（部分编辑器支持）-->
<iframe src="./B1_架构图/架构图-系统架构.html" width="100%" height="400"></iframe>
```

### index.md 索引文件格式

```markdown
# UI 原型索引

| 编号 | 名称 | 👁️ 预览 | 📄 数据 | 确认时间 |
|------|------|--------|--------|---------|
| REQ-001 | 登录页 | [.html](./REQ-001-登录页.html) | [.json](./REQ-001-登录页.json) | 2025-12-28 |
```

---

## 🚫 AI 避坑指南

1. **不要编造组件**：只能使用本文档定义的组件
2. **不要忘记写入**：必须调用 `write_to_file` 写入 `.a2ui/current.json`
3. **不要跳过保存**：PM 确认后必须正式保存
4. **不要混淆阶段**：架构图用于 P0/B1/B2，界面原型用于 C1

---

**本文档是所有阶段的 A2UI 统一规范，AI 在任何阶段使用 A2UI 时都应参考此文档。**
