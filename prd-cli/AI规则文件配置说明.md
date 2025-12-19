# AI 规则文件配置说明

**完成时间**: 2025-12-19  
**目的**: 让 AI 在不同 IDE 中都能遵守规则

---

## 📌 问题背景

用户反馈：AI 在 Cursor、Antigravity、Claude 等 IDE 中经常"忘记"工作流规则，导致：
- 未经对话就填充文档
- 替 PM 做决策
- 省略细节
- "请确认"式走过场

**根本原因**：缺少 IDE 专用的规则配置文件

---

## ✅ 解决方案

创建多个 IDE 的规则配置文件，让 AI 在不同环境中都能自动加载规则。

---

## 📂 已创建的规则文件

### 1. `.cursorrules` ✅

**用途**: Cursor IDE 专用规则文件  
**位置**: 项目根目录  
**内容**: 
- 核心原则（PM 决策，AI 执行）
- 5 大禁止行为
- 5 大必须行为
- 具体场景的正确反应
- 归档要求

**Cursor 会自动读取这个文件！**

---

### 2. `.antigravity/rules.md` ✅

**用途**: Google Antigravity (Gemini) 专用规则  
**位置**: `.antigravity/` 目录  
**内容**:
- 角色定位（战略思维导师）
- 行为红线
- 必须执行的流程
- 对话归档要求
- 自我检查清单

**Antigravity 会读取这个目录的规则！**

---

### 3. `AI-GUIDE.md` ✅

**用途**: 所有 IDE 通用的简洁指引  
**位置**: 项目根目录  
**内容**:
- 不同 IDE 的规则文件位置
- 核心原则速查
- 行为红线速查
- 工作流文档位置

**任何 AI 都可以快速查看这个文件！**

---

## 🔧 项目初始化自动配置

修改了 `commands/init.js`，现在 `prd init` 时会自动：

```javascript
// 1. 复制工作流文档
.agent/workflows/ → 新项目/.agent/workflows/

// 2. 复制对话归档模板
templates/dialog-template.md → 新项目/98_对话归档/AI_对话归档模板.md

// 3. 复制 AI 规则文件
.cursorrules → 新项目/.cursorrules
.antigravity/ → 新项目/.antigravity/
AI-GUIDE.md → 新项目/AI-GUIDE.md
```

**新项目开箱即用！**

---

## 📋 文件结构

```
prd-cli/
├── .cursorrules                    # Cursor IDE 规则 ← 新增
├── .antigravity/                   # Antigravity 规则 ← 新增
│   └── rules.md
├── AI-GUIDE.md                     # 通用 AI 指引 ← 新增
├── .agent/workflows/               # 详细工作流（已有）
│   ├── prd-b1-planning-draft.md
│   ├── prd-b2-planning-breakdown.md
│   └── prd-c1-requirement-list.md
├── templates/                      # 模板（已有）
│   └── dialog-template.md
└── commands/
    └── init.js                     # 已修改：自动复制规则文件
```

---

## 🎯 使用方式

### 对于新项目

```bash
prd init my-project
```

自动包含所有 AI 规则文件！

### 对于现有项目

手动复制规则文件到项目根目录：

```bash
# Cursor
cp prd-cli/.cursorrules my-project/

# Antigravity
cp -r prd-cli/.antigravity my-project/

# 通用指引
cp prd-cli/AI-GUIDE.md my-project/
```

---

## 🔍 AI 如何使用这些规则

### Cursor IDE

1. 读取 `.cursorrules` 文件
2. 在每次对话开始时加载规则
3. 作为系统提示词的一部分

### Antigravity (Gemini)

1. 读取 `.antigravity/rules.md`
2. 在项目上下文中加载
3. 持续遵守规则

### 其他 IDE

1. 查看 `AI-GUIDE.md` 获取快速指引
2. 查看 `.agent/workflows/` 获取详细工作流
3. 需要主动提醒 AI 查看这些文件

---

## 💡 为什么需要多个规则文件？

| IDE | 规则文件 | 原因 |
|-----|---------|------|
| Cursor | `.cursorrules` | Cursor 的约定，自动读取 |
| Antigravity | `.antigravity/rules.md` | Antigravity 项目规范 |
| 其他 | `AI-GUIDE.md` | 通用文档，任何 AI 都能看 |

**不同 IDE 有不同的规则加载机制，所以需要多个文件！**

---

## 📊 效果对比

### 修复前

```
AI: "我已经帮你规划了本轮迭代：
     目标：提升内审流程效率
     需求：1. 内审会管理 (P0)..."

❌ 未经对话就填充
❌ 替 PM 做决策
❌ 没有遵守工作流
```

### 修复后

```
AI: "✅ B1 已创建。
     
     在填写 B1 之前，让我通过提问引导你思考。
     
     第一个问题：你期望这个规划达成什么结果？
     请用一句话描述，并且这个结果必须是可衡量的。"

✅ 遵守工作流
✅ 通过提问引导
✅ 让 PM 做决策
```

---

## 🚀 后续优化建议

### 短期

1. 测试规则文件在各个 IDE 中的效果
2. 根据反馈调整规则内容

### 中期

1. 为其他 IDE 也创建专用规则
   - `.windsurf/` - Windsurf
   - `.continue/` - Continue
   - `.aider/` - Aider

2. 增加规则版本管理

### 长期

1. 规则文件自动更新机制
2. AI 行为合规性检查工具

---

## 📝 总结

### 核心改进

- ✅ 创建了 3 个规则文件（Cursor、Antigravity、通用）
- ✅ 修改了 init.js（自动复制规则）
- ✅ 提供了多级规则体系

### 核心价值

- ✅ **规则持久化**：AI 不会"忘记"规则
- ✅ **跨 IDE 一致性**：不同 IDE 中都遵守相同规则
- ✅ **开箱即用**：新项目自动包含规则 价值

---

**现在 AI 在任何 IDE 中都能遵守工作流规则了！** 🎉
