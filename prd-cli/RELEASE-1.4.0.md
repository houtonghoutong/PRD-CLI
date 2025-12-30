# 📦 PRD-CLI v1.4.0 发布说明

> 发布日期：2024-12-29

## 🎉 重大更新：规则系统改造

本版本完成了 AI 行为规则的系统化改造，将自然语言规则升级为机器可检验的契约。

---

## ✨ 新功能

### 1. 规则索引系统
- 新增 `rules/index.json` - 37 条结构化规则，按 rule_id 标识
- 规则分为 9 类：G(全局)、D(文档)、F(流程)、S(范围)、V(可视化)、I(保存)、U(用户)、C(完整性)、W(启动)
- 每条规则包含严重程度、适用范围、校验方式等元数据

### 2. 规则校验命令 `prd check`
- 自动检查项目是否符合 PRD 规则
- 5 个内置校验器：
  - 冻结状态保护 (D001-D004)
  - 流程顺序检查 (F001-F003)
  - A2UI 文件成对/命名/索引检查 (V003-V006)
  - A2UI 组件类型校验 (V007)
  - 需求范围对比检查 (S002-S003)
- 支持 `--json` 输出供 AI 读取
- 自动记录校验日志

### 3. 统计报告命令 `prd stats`
- 基于历史日志生成规则遵守情况报告
- 显示通过率、高频违规 Top 5、7 天趋势
- 提供改进建议

### 4. AI 自检强化
- 每个 workflow 文件自动注入该阶段的规则子集表
- 规则注入工具 `scripts/inject-rules.js`
- AI 输出时需包含规则自检清单

### 5. JSON Schema
- 新增 `rules/schemas/a2ui.schema.json` - 21 种 A2UI 组件类型定义
- 新增 `rules/schemas/rules.schema.json` - 规则索引结构定义

---

## 📁 新增文件

```
prd-cli/
├── rules/
│   ├── index.json                    # 37 条规则索引
│   └── schemas/
│       ├── a2ui.schema.json          # A2UI 组件 Schema
│       └── rules.schema.json         # 规则索引 Schema
├── commands/
│   ├── check.js                      # prd check 命令
│   └── stats.js                      # prd stats 命令
├── scripts/
│   └── inject-rules.js               # 规则注入工具
└── docs/
    └── RULE-SYSTEM-ROADMAP.md        # 改造路线图
```

---

## 🔧 改进

- `.cursorrules` 和 `.antigravity/rules.md` 添加规则系统概述
- 6 个 workflow 文件注入规则表和自检清单模板
- 修复 `a2ui-standalone.html` 中的语法错误

---

## 📋 命令速查

```bash
# 检查项目规则
prd check

# 输出 JSON 格式（供 AI 读取）
prd check --json

# 不记录日志
prd check --no-log

# 查看统计报告
prd stats

# 输出 JSON 格式统计
prd stats --json
```

---

## 🚀 下一版本预告 (1.5.0)

- iOS/Android 原生控件精确模拟
- A2UI 支持 `platform` 字段区分平台
- 移动端预览外框

---

## 升级方式

```bash
npm update -g prd-workflow-cli
# 或
prd upgrade  # 更新项目中的 workflows
```
