# PRD Workflow CLI

> 产品需求管理规范命令行工具  
> 基于 **基线→规划→IT→版本** 流程的需求管理系统

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)

---

## 📖 目录

- [简介](#-简介)
- [快速开始](#-快速开始)
- [核心工作流程](#-核心工作流程)
- [文档体系](#-文档体系)
- [命令参考](#-命令参考)
- [与 AI IDE 集成](#-与-ai-ide-集成)
- [FAQ](#-faq)

---

## 🎯 简介

PRD-CLI 是一套**规范化的产品需求管理工具**，解决的核心问题：

> 让 AI 从"陪你写需求"变成"帮你挡住不该写的需求"

### 核心价值

- **防止幻觉** - AI 不编造 API/SQL/算法，技术细节由技术负责人确认
- **防止越界** - 每个阶段有明确边界，防止需求蔓延
- **对话驱动** - 文档通过对话逐步完成，而非一次性填充

---

## 🚀 快速开始

### 安装

```bash
npm install -g prd-workflow-cli
```

### 初始化项目

```bash
prd init my-project
cd my-project
```

### 核心流程

```bash
# 1. 基线阶段 - 建立产品现状
prd baseline create 产品定义    # PM 填写
prd baseline create 代码快照    # AI 扫描生成

# 2. 规划阶段 - 确定要做什么
prd iteration new               # 创建迭代
prd plan create                 # 创建需求规划
prd plan freeze                 # 冻结规划

# 3. IT 阶段 - 细化用户故事
prd it create "功能名称"        # 创建用户故事

# 4. 版本阶段 - 完成冻结
prd version freeze              # 冻结版本，交付研发
```

---

## 🔄 核心工作流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   基线阶段   │ ─→ │   规划阶段   │ ─→ │   IT 阶段   │ ─→ │   版本阶段   │
│             │    │             │    │             │    │             │
│  产品定义    │    │  需求规划    │    │  业务需求    │    │  版本发布    │
│  代码快照    │    │  规划冻结    │    │  技术规格    │    │             │
│  用户反馈    │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      ↑                  ↑                  ↑                  ↑
   PM+AI 填写       PM+AI 对话          PM+AI 对话          自动生成
```

### 各阶段说明

| 阶段 | 目的 | 产出 |
|------|------|------|
| **基线** | 建立产品现状基线 | 产品定义.md、代码快照.md、用户反馈.md |
| **规划** | 确定本轮迭代目标 | 需求规划.md、规划冻结.md |
| **IT** | 细化可执行的用户故事 | 业务需求.md、技术规格.md |
| **版本** | 冻结需求，交付研发 | 版本发布.md |

---

## 📁 文档体系

### 目录结构

```
项目目录/
├── 00_项目总览/
│   └── 项目信息.md              # 项目元信息
├── 01_基线/
│   ├── 产品定义.md              # PM 填写
│   ├── 代码快照.md              # AI 扫描生成
│   └── 用户反馈.md              # AI 整理
├── 02_迭代记录/
│   └── 第01轮迭代/
│       ├── 需求规划.md          # PM+AI 对话
│       ├── 规划冻结.md          # 自动生成
│       ├── IT/
│       │   └── IT-001-功能名/
│       │       ├── 业务需求.md  # PM+AI 对话
│       │       └── 技术规格.md  # 技术负责人补充
│       └── 版本发布.md          # 自动生成
└── 99_归档区/                   # 历史文档
```

### 文档职责

| 文档 | 负责人 | 说明 |
|------|--------|------|
| 产品定义 | PM | 产品边界、红线约束 |
| 代码快照 | AI | 扫描代码生成功能清单 |
| 用户反馈 | PM/AI | 整理用户反馈和问题 |
| 需求规划 | PM+AI | 对话确定规划目标 |
| 规划冻结 | 系统 | `prd plan freeze` 自动生成 |
| 业务需求 | PM+AI | 用户故事、验收标准 |
| 技术规格 | 技术负责人 | 技术实现要点 |
| 版本发布 | 系统 | `prd version freeze` 自动生成 |

---

## ⌨️ 命令参考

### 项目管理

```bash
prd init <项目名>          # 初始化项目
prd status                 # 查看项目状态
prd upgrade                # 更新工作流文件
```

### 基线管理

```bash
prd baseline create 产品定义    # 创建产品定义
prd baseline create 代码快照    # 创建代码快照
prd baseline create 用户反馈    # 创建用户反馈
```

### 迭代管理

```bash
prd iteration new          # 新建迭代
prd iteration list         # 列出所有迭代
```

### 规划管理

```bash
prd plan create            # 创建需求规划
prd plan freeze            # 冻结规划（含自动审视）
prd plan freeze --force    # 强制冻结（跳过审视）
```

### IT 管理

```bash
prd it create "功能名"     # 创建 IT（业务需求+技术规格）
prd it list                # 列出所有 IT
prd it show <id>           # 查看 IT 详情
```

### 版本管理

```bash
prd version freeze         # 冻结版本（含自动审视）
prd version freeze --force # 强制冻结（跳过审视）
```

### 工具命令

```bash
prd check                  # 规则校验
prd stats                  # 统计报告
prd ui                     # 启动 A2UI 预览
```

---

## 🤖 与 AI IDE 集成

### 支持的 IDE

- **Cursor** - 自动读取 `.cursorrules`
- **Antigravity** - 自动读取 `.antigravity/rules.md`
- **其他 AI IDE** - 读取 `AI-GUIDE.md`

### AI 工作流

| 斜杠命令 | 用途 |
|---------|------|
| `/prd-代码快照` | AI 扫描代码生成代码快照 |
| `/prd-需求规划` | 需求规划填写引导 |
| `/prd-业务需求` | IT 业务需求编写 |
| `/prd-技术规格` | IT 技术规格编写 |

### AI 行为规则

| ❌ AI 禁止 | ✅ AI 应该 |
|-----------|-----------|
| 编造 API/SQL/算法 | 记录技术负责人的确认 |
| 替 PM 决定优先级 | 引导 PM 自己决策 |
| 一次性填充文档 | 通过对话逐项完成 |
| 在业务需求写技术细节 | 保持业务/技术分离 |

---

## ❓ FAQ

### Q: IT 是什么？

**A:** IT = INVEST User Story，是符合 INVEST 原则的用户故事：

- **I**ndependent（独立的）
- **N**egotiable（可协商的）
- **V**aluable（有价值的）
- **E**stimable（可估算的）
- **S**mall（小的）
- **T**estable（可测试的）

### Q: 为什么版本号从 1.5.0 跳到 2.0.0？

**A:** 2.0.0 是一个破坏性变更，主要变化：
- 采用中文命名体系
- 去除混乱的编号系统（A0/B3/C3/R0...）
- 简化文件和目录名

### Q: 旧项目能升级吗？

**A:** 可以手动重命名文件，或继续使用旧版本。旧参数（A0/A1/A2）仍然兼容。

### Q: 审视（R1/R2）去哪了？

**A:** 审视作为动作内化到 `freeze` 命令中：
- `prd plan freeze` 自动执行规划审视
- `prd version freeze` 自动执行版本审视

---

## 📚 更多文档

- [GUIDE.md](./GUIDE.md) - 快速使用指南
- [OVERVIEW.md](./OVERVIEW.md) - 一页式完整总览
- [CHANGELOG.md](./CHANGELOG.md) - 完整更新日志

---

## 📝 License

MIT
