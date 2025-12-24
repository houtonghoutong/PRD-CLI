# PRD Workflow CLI

> 产品需求管理规范命令行工具  
> 基于 A→R→B→C 流程的严格需求管理系统

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)

## 📖 简介

这是一个基于严格产品需求管理规范的 CLI 工具,帮助产品团队和 AI 编程助手按照规范化流程完成需求管理工作。

### 核心特点

✅ **强制审视机制** - R1/R2 作为"闸门",必须通过才能进入下一阶段  
✅ **文档模板化** - 每个阶段都有明确的文档结构和填写指引  
✅ **AI 可执行** - 配合 Cursor、Codeium 等 AI IDE 使用  
✅ **阶段清晰** - A(基线) → R(审视) → B(规划) → C(版本) 流程明确  
✅ **防止失控** - 通过强制约束防止规划膨胀和需求蔓延  

## 🎯 核心理念

### 工作流程

```
A 类(现状基线)
    ↓
R1 启动条件检查 → 不通过则停止
    ↓ 通过
B1/B2(需求规划)
    ↓
R1 规划审视 → 不通过则返回修改
    ↓ 通过
B3(规划冻结)
    ↓
C0/C1(版本需求)
    ↓
R2 版本审视 → 不通过则返回修改
    ↓ 通过
C3(版本冻结)
```

### 关键原则

1. **R1 是启动闸门**: 必须满足三个条件才能开始规划
   - 问题真实存在(基于 A 类现状)
   - 值得单独规划(不是小修小补)
   - 问题已理解清楚(不用规划来想问题)

2. **B3 是决策冻结**: 规划一旦冻结不可随意更改

3. **C 类不讨论方向**: 只执行已冻结的规划，不再讨论"该不该做"

4. **审视是强制的**: R1/R2 必须通过才能进入下一阶段

## 🚀 安装

### 方式1：从 GitHub 安装（推荐）

```bash
# 全局安装
npm install -g github:houtonghoutong/PRD-CLI#main

# 或使用 yarn
yarn global add github:houtonghoutong/PRD-CLI#main
```

### 方式2：从源码安装

```bash
# 1. 克隆仓库
git clone https://github.com/houtonghoutong/PRD-CLI.git
cd PRD-CLI/prd-cli

# 2. 安装依赖
npm install

# 3. 全局链接
npm link
```

### 方式3：npm 安装（即将上线）

```bash
# 稍后可用
npm install -g prd-workflow-cli
```


## 📝 快速开始

### 1. 初始化项目

```bash
prd init my-product
cd my-product
```

这将创建标准的目录结构:

```
my-product/
├── 00_项目总览/
│   └── P0_项目基本信息.md
├── 01_产品基线/
├── 02_迭代记录/
├── 99_归档区/
└── .agent/workflows/
```

### 2. 建立产品基线(A 类文档)

```bash
# 创建基础文档
prd baseline create A0  # 产品基础与范围说明
prd baseline create A1  # 已上线功能与流程清单
prd baseline create A2  # 存量反馈与数据汇总
prd baseline create R0  # 基线审视报告
```

### 3. 开始第一轮迭代

```bash
# 创建新迭代
prd iteration new

# 这会创建 R1_规划启动条件检查.md
# 填写并确认三个启动条件全部满足后，才能继续
```

### 4. 需求规划(B 类文档)

```bash
# 创建规划文档
prd plan create B1  # 需求规划草案
prd plan create B2  # 规划拆解与范围界定

# 执行 R1 审视
prd review r1

# 如果通过，冻结规划
prd plan freeze  # 生成 B3 规划冻结归档
```

### 5. 版本需求(C 类文档)

```bash
# 创建版本文档
prd version create C0  # 版本范围声明
prd version create C1  # 版本需求清单

# 执行 R2 审视
prd review r2

# 如果通过，冻结版本
prd version freeze  # 生成 C3 版本冻结归档
```

### 6. 查看项目状态

```bash
prd status          # 查看当前项目状态
prd iteration list  # 查看所有迭代
```

## 📚 命令参考

### 项目管理

| 命令 | 说明 |
|------|------|
| `prd init <name>` | 初始化新项目 |
| `prd status` | 查看项目状态 |

### 基线管理(A 类)

| 命令 | 说明 |
|------|------|
| `prd baseline create A0` | 创建产品基础与范围说明 |
| `prd baseline create A1` | 创建已上线功能与流程清单 |
| `prd baseline create A2` | 创建存量反馈与数据汇总 |
| `prd baseline create R0` | 创建基线审视报告 |

### 迭代管理

| 命令 | 说明 |
|------|------|
| `prd iteration new` | 开始新迭代 |
| `prd iteration list` | 列出所有迭代 |
| `prd iteration current` | 查看当前迭代 |

### 规划管理(B 类)

| 命令 | 说明 |
|------|------|
| `prd plan create B1` | 创建需求规划草案 |
| `prd plan create B2` | 创建规划拆解与范围界定 |
| `prd plan freeze` | 冻结规划(生成 B3) |

### 版本管理(C 类)

| 命令 | 说明 |
|------|------|
| `prd version create C0` | 创建版本范围声明 |
| `prd version create C1` | 创建版本需求清单 |
| `prd version freeze` | 冻结版本(生成 C3) |

### 审视管理(R 类)

| 命令 | 说明 |
|------|------|
| `prd review r1` | 执行 R1 规划审视 |
| `prd review r2` | 执行 R2 版本审视 |

## 🤖 与 AI IDE 集成

本工具专门设计用于与 AI 编程助手配合使用。

### Cursor / Windsurf / Codeium

工具会自动在项目中创建 `.agent/workflows/` 目录,包含可被 AI 调用的工作流文件。

在 AI 对话中使用:

```
// 执行 R1 审视
/prd-r1-review

// 执行 R2 审视
/prd-r2-review
```

### AI 指令示例

**R1 规划审视**:
```
请按照 .agent/workflows/prd-r1-review.md 中的指令，
对当前的 B1、B2 文档执行 R1 规划审视。
```

**R2 版本审视**:
```
请按照 .agent/workflows/prd-r2-review.md 中的指令，
检查 C0、C1 是否忠实执行了 B3 的规划。
```

### 使用 ChatGPT / Claude / Kimi 等在线 AI

如果你使用的不是 IDE 内置的 AI，可以复制以下提示词到对话开始处：

<details>
<summary>📋 点击展开完整提示词</summary>

```
你是一个产品需求管理助手，帮助产品经理（PM）按照规范化流程完成需求文档。

# 你的角色
你是战略思维导师，不是自动化工具或速记员。

# 核心原则
PM 决策，AI 执行。你的职责是引导、提问、建议，不是替 PM 做决策。

# 工作流程
产品需求遵循 A → R → B → C 流程：
- A 类文档：产品基线（A0 产品基础、A1 功能清单、A2 用户反馈）
- R0：基线审视
- B 类文档：规划（B1 规划草案、B2 需求拆解、B3 规划冻结）
- R1：规划审视
- C 类文档：版本（C0 版本范围、C1 需求清单、C3 版本冻结）
- R2：版本审视

# 绝对禁止的行为

1. ❌ 禁止"快速完成模式"
   如果 PM 说"帮我快速完成"，你必须拒绝跳过流程。

2. ❌ 禁止未经对话就填充文档
   创建 B1/B2/C1 后，必须通过对话逐项引导 PM 填写。

3. ❌ 禁止替 PM 做决策
   优先级（P0/P1/P2）、首版范围、目标定义都由 PM 决定。

4. ❌ 禁止允许跳过必填内容
   C1 的前 5 个维度（背景/描述/规则/验收/边界）是必填的。

5. ❌ 禁止在 C1 阶段加入新需求
   C1 阶段发现新需求时，只能暂存到 A2，因为 B3 已冻结。

现在，请告诉我你想从哪个阶段开始，我会引导你完成。
```

</details>

**简化版提示词**（适合快速开始）:

```
你是产品需求管理助手，帮助 PM 按照 A→R→B→C 流程完成需求文档。
核心规则：PM 决策，AI 执行，不替 PM 做决策，每个阶段都要充分对话。
请告诉我你想从哪个阶段开始。
```

## 📂 文档结构说明

### A 类 - 现状基线文档

用于建立产品现状的共识,不写规划和愿景。

- **A0**: 产品基础与范围说明
- **A1**: 已上线功能与流程清单
- **A2**: 存量反馈与数据汇总
- **R0**: 基线审视报告

### B 类 - 需求规划文档

定义"要不要做、做什么、做到什么程度"。

- **R1**: 规划启动条件检查
- **B1**: 需求规划草案
- **B2**: 规划拆解与范围界定
- **R1**: 规划审视报告(冻结前)
- **B3**: 规划冻结归档

### C 类 - 版本需求文档

将规划转化为可执行的版本需求。

- **C0**: 版本范围声明
- **C1**: 版本需求清单
- **R2**: 版本审视报告(冻结前)
- **C3**: 版本冻结归档

## 🔍 典型使用场景

### 场景一: 启动新产品

```bash
prd init new-product
cd new-product
prd baseline create A0
# 填写产品基础信息...
prd baseline create A1
# 梳理现有功能...
prd iteration new
# 开始第一轮规划...
```

### 场景二: 现有产品新增功能

```bash
cd existing-product
prd iteration new
# 填写 R1 启动条件检查
# 确认满足三个条件后...
prd plan create B1
# 与 AI 讨论规划草案...
prd review r1
# AI 执行审视并通过后...
prd plan freeze
```

### 场景三: 多轮迭代

```bash
prd iteration list     # 查看历史迭代
prd iteration current  # 确认当前迭代
prd iteration new      # 开始新一轮
```

## ⚠️ 重要约束

### R1 启动条件(三个必须同时满足)

1. ✅ 问题真实存在(可在 A 类文档中找到依据)
2. ✅ 值得单独规划(不是小修小补)
3. ✅ 问题已理解清楚(边界明确)

### R1 规划审视(五个维度)

1. 目标清晰性
2. 场景真实性
3. 现状一致性
4. 范围收敛性
5. 版本化准备度

### R2 版本审视(五个维度)

1. 版本目标一致性
2. 版本范围偏移检查
3. 规划覆盖完整性
4. 需求粒度成熟度
5. 进入执行准备度

## 🛠️ 开发

```bash
git clone <repository>
cd prd-cli
npm install
npm link  # 本地测试
```

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📮 反馈

如有问题或建议,请提交 Issue。

---

**核心价值**: 让 AI 从"陪你写需求"变成"帮你挡住不该写的需求"
