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

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - PRD UI 原型</title>
    <!-- React -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <!-- Ant Design -->
    <link rel="stylesheet" href="https://unpkg.com/antd@5/dist/reset.css">
    <script src="https://unpkg.com/dayjs@1/dayjs.min.js"></script>
    <script src="https://unpkg.com/antd@5/dist/antd.min.js"></script>
    <!-- Icons -->
    <script src="https://unpkg.com/@ant-design/icons@5/dist/index.umd.min.js"></script>
    <style>
        body { margin: 0; padding: 24px; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        #root { max-width: 1400px; margin: 0 auto; }
        .page-header { margin-bottom: 16px; }
        .page-title { font-size: 20px; font-weight: 600; color: rgba(0,0,0,0.88); margin: 0; }
        .meta-info { background: #fff; border: 1px solid #d9d9d9; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: rgba(0,0,0,0.65); }
        .meta-info span { margin-right: 24px; }
        .meta-info strong { color: rgba(0,0,0,0.88); }
    </style>
</head>
<body>
    <div class="meta-info">
        <span><strong>需求编号：</strong>{{REQ_ID}}</span>
        <span><strong>界面名称：</strong>{{NAME}}</span>
        <span><strong>确认时间：</strong>{{DATE}}</span>
    </div>
    <div id="root"></div>

    <script>
        // UI 数据（内嵌）
        const UI_DATA = {{JSON_DATA}};

        // A2UI 渲染器
        const { ConfigProvider, Card, Button, Input, Select, Table, Tabs, Tag, Badge, Space, Row, Col, Typography, Divider, Alert, Upload, Form } = antd;
        const { Title, Text } = Typography;
        const { TextArea } = Input;
        const { PlusOutlined, InboxOutlined } = icons;
        const { Dragger } = Upload;

        const A2UIRenderer = ({ data }) => {
            const renderNode = (node) => {
                if (!node) return null;
                const { type, children, ...props } = node;

                switch (type) {
                    case 'Page': return React.createElement('div', { key: props.id }, props.title && React.createElement('div', { className: 'page-header' }, React.createElement('h1', { className: 'page-title' }, props.title)), children && children.map((child, i) => renderNode({ ...child, key: i })));
                    case 'Panel': return React.createElement(Card, { key: props.key, title: props.title, extra: props.extra && React.createElement(Space, null, props.extra.map((btn, i) => React.createElement(Button, { key: i, type: btn.variant === 'primary' ? 'primary' : 'default' }, btn.text || btn))), style: { marginBottom: 16 } }, children && children.map((child, i) => renderNode({ ...child, key: i })));
                    case 'Row': return React.createElement(Row, { key: props.key, gutter: 16 }, children && children.map((child, i) => renderNode({ ...child, key: i })));
                    case 'Col': return React.createElement(Col, { key: props.key, flex: 1 }, children && children.map((child, i) => renderNode({ ...child, key: i })));
                    case 'Input': return React.createElement(Form.Item, { key: props.key, label: props.label, required: props.required, style: { marginBottom: 16 } }, React.createElement(Input, { placeholder: props.placeholder }));
                    case 'Textarea': return React.createElement(Form.Item, { key: props.key, label: props.label, style: { marginBottom: 16 } }, React.createElement(TextArea, { placeholder: props.placeholder, rows: props.rows || 4 }));
                    case 'Select': return React.createElement(Form.Item, { key: props.key, label: props.label, style: { marginBottom: 16 } }, React.createElement(Select, { placeholder: '请选择', options: (props.options || []).map(opt => ({ value: typeof opt === 'string' ? opt : opt.value, label: typeof opt === 'string' ? opt : opt.label })), style: { width: '100%' } }));
                    case 'Button': return React.createElement(Button, { key: props.key, type: props.variant === 'secondary' ? 'default' : props.variant === 'danger' ? 'primary' : 'primary', danger: props.variant === 'danger', style: { marginRight: 8 } }, props.text);
                    case 'Text': return React.createElement(Text, { key: props.key, style: { display: 'block', marginBottom: 8 } }, props.content);
                    case 'Tabs': return React.createElement(Tabs, { key: props.key, items: (props.items || []).map((item, i) => ({ key: String(i), label: item })), style: { marginBottom: 16 } });
                    case 'Table': 
                        const columns = (props.columns || []).map(col => {
                            const column = { key: col.key || col, dataIndex: col.key || col, title: col.title || col };
                            if (col.type === 'link') column.render = (text) => React.createElement('a', null, text);
                            else if (col.type === 'badge') column.render = (text) => React.createElement(Tag, { color: col.variantMap?.[text] === 'success' ? 'green' : col.variantMap?.[text] === 'warning' ? 'orange' : col.variantMap?.[text] === 'danger' ? 'red' : 'blue' }, text);
                            else if (col.type === 'status') column.render = (text) => React.createElement(Badge, { status: text === '已发布' ? 'success' : 'default', text });
                            else if (col.type === 'actions') column.render = () => React.createElement(Space, null, React.createElement('a', null, '编辑'), React.createElement('a', null, '复制'), React.createElement('a', { style: { color: '#ff4d4f' } }, '删除'));
                            return column;
                        });
                        return React.createElement(Table, { key: props.key, columns, dataSource: (props.data || []).map((row, i) => ({ ...row, key: i })), pagination: false, size: 'middle' });
                    case 'Badge': return React.createElement(Tag, { key: props.key, color: props.variant === 'success' ? 'green' : props.variant === 'warning' ? 'orange' : props.variant === 'danger' ? 'red' : 'blue' }, props.text);
                    case 'Card': return React.createElement(Card, { key: props.key, size: 'small', style: { marginBottom: 12 } }, React.createElement(Row, { justify: 'space-between', align: 'middle' }, React.createElement(Col, null, React.createElement(Space, { direction: 'vertical', size: 0 }, React.createElement(Text, { strong: true }, props.title), props.status && React.createElement(Badge, { status: props.status === '已发布' ? 'success' : 'default', text: props.status }))), props.actions && React.createElement(Col, null, React.createElement(Space, null, props.actions.map((action, i) => React.createElement(Button, { key: i, size: 'small' }, action.text || action))))));
                    case 'Upload': return React.createElement(Dragger, { key: props.key }, React.createElement('p', { className: 'ant-upload-drag-icon' }, React.createElement(InboxOutlined)), React.createElement('p', { className: 'ant-upload-text' }, props.text || '点击或拖拽文件上传'));
                    case 'Divider': return React.createElement(Divider, { key: props.key });
                    case 'Alert': return React.createElement(Alert, { key: props.key, type: props.variant === 'danger' ? 'error' : props.variant || 'info', message: props.content || props.text, showIcon: true, style: { marginBottom: 16 } });
                    case 'Diagram': return React.createElement('div', { key: props.key, style: { background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)', borderRadius: 8, padding: 32, minHeight: 300 } }, props.title && React.createElement('div', { style: { color: 'white', fontSize: 18, fontWeight: 600, textAlign: 'center', marginBottom: 24 } }, props.title), React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 } }, children && children.map((child, i) => renderNode({ ...child, key: i }))));
                    case 'Box': return React.createElement(Card, { key: props.key, size: 'small', style: { minWidth: 120, textAlign: 'center', borderLeft: props.color ? `3px solid ${props.color}` : undefined } }, React.createElement(Text, { strong: true }, props.title), props.desc && React.createElement('div', null, React.createElement(Text, { type: 'secondary', style: { fontSize: 12 } }, props.desc)));
                    case 'Arrow': return React.createElement('div', { key: props.key, style: { color: 'white', fontSize: 24, textAlign: 'center' } }, (props.direction === 'up' ? '↑' : props.direction === 'left' ? '←' : props.direction === 'right' ? '→' : '↓'), props.label && React.createElement('span', { style: { fontSize: 12, marginLeft: 8 } }, props.label));
                    case 'Layer': return React.createElement('div', { key: props.key, style: { display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' } }, props.title && React.createElement('div', { style: { width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 8 } }, props.title), children && children.map((child, i) => renderNode({ ...child, key: i })));
                    case 'DiagramGroup': return React.createElement('div', { key: props.key, style: { background: 'rgba(255,255,255,0.1)', border: '1px dashed rgba(255,255,255,0.3)', borderRadius: 8, padding: 16, width: '100%' } }, props.title && React.createElement('div', { style: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 12 } }, props.title), React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' } }, children && children.map((child, i) => renderNode({ ...child, key: i })));
                    default: return React.createElement(Alert, { key: props.key, type: 'warning', message: `未知组件: ${type}` });
                }
            };
            return React.createElement(ConfigProvider, { theme: { token: { colorPrimary: '#1677ff', borderRadius: 6 } } }, renderNode(data));
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(A2UIRenderer, { data: UI_DATA }));
    </script>
</body>
</html>
```

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
