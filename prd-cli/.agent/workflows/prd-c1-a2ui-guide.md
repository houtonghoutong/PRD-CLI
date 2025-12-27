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
3. **实时预览**：用户运行 `prd ui`，CLI 启动本地服务，网页自动读取并渲染界面。

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

---

## 📝 交互流程规范

### 第一步：生成并写入预览数据

**当 PM 描述完界面需求后，AI 必须执行：**

1. **构思 JSON 结构**：在思维链中构建符合 Schema 的 JSON。
2. **写入文件**：使用 `write_to_file` 工具将 JSON 写入 `.a2ui/current.json`。
3. **提示预览**：告知 PM 运行命令查看。

**AI 对话示例：**

```
AI: "明白了，这个用户详情页需要包含基本信息表单和操作按钮。

     我已生成 A2UI 预览数据。
     
     👉 请运行命令查看实时预览：
     prd ui
     
     （如果不方便运行命令，您可以看下方的 JSON 结构...）"
```

### 第二步：根据反馈迭代

**当 PM 提出修改意见（如"把按钮移到左边"）时：**

1. **修改 JSON**：调整 `.a2ui/current.json` 中的数据结构。
2. **覆盖写入**：再次使用 `write_to_file` 覆盖原文件。
3. **提示刷新**：告知 PM 刷新浏览器即可看到变化。

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
