# PRD-CLI 2.0 重构计划

> 📅 创建日期：2026-01-07
> 
> 🎯 目标：引入 IT（INVEST）架构，用 N 个独立的用户故事替代原来的大 C1 文档

---

## 目录

1. [重构背景](#1-重构背景)
2. [核心变化](#2-核心变化)
3. [重构范围](#3-重构范围)
4. [实施计划](#4-实施计划)
5. [风险评估](#5-风险评估)

---

## 1. 重构背景

### 1.1 当前问题

| 问题 | 影响 |
|------|------|
| C1 文档太大 | 一个版本功能多时，文档臃肿难维护 |
| 不便于逐项确认 | 业务方需要逐个功能确认，但 C1 是一个整体 |
| 不便于 AI 开发 | 开发需要拆分，但 C1 粒度太粗 |
| 业务和技术混杂 | C1 既有业务描述又有技术要求 |

### 1.2 解决方案

引入 **IT（INVEST）** 架构：
- 每个可闭环的用户故事独立成文档
- 一个 IT 对应两份文档：BIZ（业务）+ DEV（功能规格）
- N 个 IT 替代原来的 1 个 C1

---

## 2. 核心变化

### 2.1 文档结构变化

```
旧结构：
02_迭代记录/第01轮迭代/
├── B1_需求规划草案.md
├── B2_规划拆解与范围界定.md
├── B3_规划冻结归档.md
├── C0_版本范围声明.md    ← 已合并到 C1
├── C1_版本需求清单.md    ← 被 IT 替代
└── C3_版本冻结归档.md

新结构：
02_迭代记录/第01轮迭代/
├── B1_需求规划草案.md
├── B2_规划拆解与范围界定.md
├── B3_规划冻结归档.md
├── IT/                    ← 新增目录
│   ├── IT-001-用户反馈/
│   │   ├── IT-001-BIZ.md  ← 业务方文档
│   │   └── IT-001-DEV.md  ← 功能规格文档
│   ├── IT-002-数据导出/
│   │   ├── IT-002-BIZ.md
│   │   └── IT-002-DEV.md
│   └── ...
└── C3_版本冻结归档.md    ← 保留，汇总所有 IT
```

### 2.2 流程变化

```
旧流程（6 步）：
init → B1 → B2 → plan freeze → C1 → version freeze

新流程（N+5 步）：
init → B1 → B2 → plan freeze → IT-001 → IT-002 → ... → version freeze
                               ↑                        ↑
                         N 个 IT 创建            检查所有 IT 完整
```

### 2.3 命令变化

| 旧命令 | 新命令 | 说明 |
|--------|--------|------|
| `prd version create C1` | `prd it create <name>` | 创建 IT |
| - | `prd it list` | 列出所有 IT |
| - | `prd it show <id>` | 查看 IT 详情 |
| `prd version freeze` | `prd version freeze` | 保留，但检查逻辑变化 |

### 2.4 两种文档定位

| 文档 | 受众 | 内容 | 目的 |
|------|------|------|------|
| **IT-xxx-BIZ.md** | 业务方 | 场景、验收标准、功能描述 | 线下确认 |
| **IT-xxx-DEV.md** | 全栈工程师 | 详细功能规格、布局、交互、状态 | 理解后拆 RT |

---

## 3. 重构范围

### 3.1 需要新增的文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `commands/it.js` | 命令 | IT 管理命令（create/list/show） |
| `templates/it-biz.md` | 模板 | BIZ 文档模板 |
| `templates/it-dev.md` | 模板 | DEV 文档模板 |
| `.agent/workflows/prd-it-biz.md` | 工作流 | BIZ 填写指引（AI 指导） |
| `.agent/workflows/prd-it-dev.md` | 工作流 | DEV 填写指引（AI 指导） |
| `tests/unit/it.test.js` | 测试 | IT 命令单元测试 |

### 3.2 需要修改的文件（命令层）

| 文件 | 修改内容 | 优先级 |
|------|----------|--------|
| `bin/prd-cli.js` | 添加 `it` 命令注册 | P0 |
| `commands/version.js` | 修改 freeze 检查逻辑（检查 IT 而非 C1） | P0 |
| `commands/planning.js` | B3 后提示创建 IT（而非 C1） | P0 |
| `commands/status.js` | 显示 IT 状态和列表 | P0 |
| `commands/index.js` | P1 迭代索引生成（包含 IT 信息） | P1 |

### 3.3 需要修改的文件（工作流）

| 文件 | 修改内容 | 影响 |
|------|----------|------|
| `.agent/workflows/prd-c1-requirement-list.md` | **重命名或废弃**，替换为 prd-it-biz + prd-it-dev | 🔴 高 |
| `.agent/workflows/prd-a2ui-guide.md` | 更新保存路径（C1_UI原型 → IT-xxx/UI原型） | 🟡 中 |
| `.agent/workflows/prd-b2-planning-breakdown.md` | 更新下一步提示（创建 IT 而非 C1） | 🟡 中 |
| `.agent/workflows/prd-r2-review.md` | 更新审视对象（C1 → IT-xxx-BIZ/DEV） | 🔴 高 |
| `.agent/workflows/prd-dialog-archive.md` | 更新对话记录路径 | 🟢 低 |

### 3.4 需要修改的文件（AI 规则）

| 文件 | 修改内容 | 行数 |
|------|----------|------|
| `.cursorrules` | 更新工作流程图（C1 → IT） | ~487 行 |
| `.antigravity/rules.md` | 更新流程说明、冻结规则、C1 相关章节 | ~353 行 |

**具体修改点**：
- 第 28 行：`禁止在 C1 阶段加入新需求` → `禁止在 IT 阶段加入新需求`
- 第 142-161 行：`A2UI 界面原型（C1 阶段职责）` → `IT-DEV 阶段职责`
- 第 290-306行：流程图更新
- 第 319-334 行：C1 阶段文件使用规则 → IT 阶段规则

### 3.5 需要修改的文件（规则系统）

| 文件 | 修改内容 | 规则数量 |
|------|----------|----------|
| `rules/index.json` | 更新所有涉及 C1 的规则 | ~20 条 |

**涉及的规则 ID**：
- `D002`: C3 冻结后禁止修改 C0/C1 → 修改为禁止修改 IT
- `F007`: 禁止跳过 R2（C1 后必须 R2） → IT-BIZ 后必须 R2
- `F008`: 多批次流程（C0→C1→R2→C3） → IT→IT→...→R2→C3
- `S001`: 禁止在 C1 加入新需求 → 禁止在 IT 加入新需求
- `S003`: C1 需求必须在 B3 范围 → IT 需求必须在 B3 范围
- `V001`: PM 描述界面时必须生成 A2UI（C1 阶段） → IT-DEV 阶段
- `V002`: A2UI 正式保存（C1_UI原型/） → IT-xxx/UI原型/
- `U002`: C1 记录前审计用户角度 → IT-BIZ 记录前审计
- `U003`: PM 说完成时检查 5 维度（C1） → IT-DEV
- `C001`: PM 说完成时检查完整性（C1） → IT-DEV

### 3.6 需要修改的文件（文档）

| 文件 | 修改内容 |
|------|----------|
| `README.md` | 更新流程说明、命令表 |
| `GUIDE.md` | 更新使用指南、FAQ |
| `docs/流程简化设计方案.md` | 更新设计文档反映 IT 架构 |

### 3.7 需要修改的测试

| 文件 | 修改内容 |
|------|----------|
| `tests/unit/version.test.js` | 更新 version freeze 测试 |
| `tests/integration/workflow-r0-r1.test.js` | 可能需要更新集成测试 |
| `tests/contract/ai-behavior.test.js` | 更新 AI 行为测试 |

### 3.8 需要废弃的功能

| 功能 | 处理方式 |
|------|----------|
| `prd version create C1` | **保留但标记废弃**，输出警告提示使用 `prd it create` |
| `prd version create C0` | 已在之前版本废弃 |

---

## 4. 实施计划

### Phase 1：基础框架（预计 2 小时）

#### Step 1.1：创建分支
- **操作**：从 main 创建 `feature/it-structure` 分支
- **验收**：`git branch` 显示新分支

#### Step 1.2：创建 IT 命令框架
- **操作**：创建 `commands/it.js`，实现基础框架
- **验收**：`prd it --help` 显示帮助信息

#### Step 1.3：注册 IT 命令
- **操作**：在 `bin/prd-cli.js` 中注册 it 命令
- **验收**：`prd it create test --help` 可执行

---

### Phase 2：IT 创建功能（预计 3 小时）

#### Step 2.1：创建 BIZ 模板
- **操作**：创建 `templates/it-biz.md`
- **验收**：模板文件存在，内容正确

#### Step 2.2：创建 DEV 模板
- **操作**：创建 `templates/it-dev.md`
- **验收**：模板文件存在，内容正确

#### Step 2.3：实现 `prd it create` 命令
- **操作**：实现创建逻辑，生成目录和两个文件
- **验收**：
  - `prd it create 用户反馈` 创建 `IT/IT-001-用户反馈/` 目录
  - 目录下有 `IT-001-BIZ.md` 和 `IT-001-DEV.md`

#### Step 2.4：实现 IT 编号自增
- **操作**：自动生成 IT-001, IT-002, ... 编号
- **验收**：连续创建两个 IT，编号分别为 001 和 002

---

### Phase 3：IT 查看功能（预计 1 小时）

#### Step 3.1：实现 `prd it list` 命令
- **操作**：列出当前迭代所有 IT
- **验收**：显示 IT 列表，包含编号、名称、状态

#### Step 3.2：实现 `prd it show` 命令
- **操作**：显示指定 IT 的详情
- **验收**：显示 IT 信息、BIZ 和 DEV 的完成度

---

### Phase 4：流程集成（预计 2 小时）

#### Step 4.1：修改 B3 冻结后提示
- **操作**：提示用户创建 IT 而非 C1
- **验收**：`prd plan freeze` 后显示 `prd it create` 提示

#### Step 4.2：修改 version freeze 检查
- **操作**：检查 IT 目录是否存在，BIZ 是否填写
- **验收**：
  - 无 IT 时：freeze 失败，提示创建 IT
  - 有 IT 但 BIZ 未填写：freeze 失败，提示填写
  - BIZ 已填写：freeze 成功

#### Step 4.3：修改 C3 生成逻辑
- **操作**：C3 汇总所有 IT 信息
- **验收**：C3 中包含所有 IT 的索引

---

### Phase 5：工作流更新（预计 3 小时）

#### Step 5.1：创建 IT-BIZ 工作流
- **操作**：创建 `.agent/workflows/prd-it-biz.md`
- **内容**：BIZ 填写的 AI 指导规则
- **验收**：工作流包含规则自检、填写步骤、示例

#### Step 5.2：创建 IT-DEV 工作流
- **操作**：创建 `.agent/workflows/prd-it-dev.md`
- **内容**：DEV 填写的 AI 指导规则（详细功能规格）
- **验收**：工作流包含 9 个维度、A2UI 触发规则

#### Step 5.3：更新 prd-r2-review.md
- **操作**：修改 R2 审视对象（C1 → IT-BIZ/DEV）
- **变更点**：
  - 审视对象从"C0/C1"改为"IT-xxx-BIZ/DEV"
  - 5 维度检查逻辑适配 IT 结构
- **验收**：R2 工作流正确引用 IT

#### Step 5.4：更新 prd-a2ui-guide.md
- **操作**：修改 A2UI 保存路径
- **变更点**：
  - `C1_UI原型/` → `IT/IT-xxx/UI原型/`
  - 触发时机从"C1 阶段"改为"IT-DEV 阶段"
- **验收**：路径引用正确

#### Step 5.5：更新 prd-b2-planning-breakdown.md
- **操作**：修改下一步提示
- **变更点**：完成 B2 后提示创建 IT 而非 C1
- **验收**：提示信息正确

#### Step 5.6：标记废弃 prd-c1-requirement-list.md
- **操作**：添加废弃声明，指引到新工作流
- **验收**：文件开头有明显的废弃提示

---

### Phase 6：AI 规则更新（预计 2.5 小时）

#### Step 6.1：更新 .cursorrules
- **操作**：修改流程图和规则描述
- **变更点**：
  - 第 290-306 行：流程图（C0→C1 改为 IT）
  - 第 319-334 行：C1 阶段规则 → IT 阶段规则
- **验收**：流程图和规则表述正确

#### Step 6.2：更新 .antigravity/rules.md
- **操作**：全面更新 C1 相关章节
- **变更点**：
  - 第 28 行：红线规则
  - 第 142-161 行：A2UI 章节
  - 第 290-306 行：工作流程图
  - 第 319-334 行：详细工作流
- **验收**：所有 C1 引用改为 IT

---

### Phase 7：规则系统更新（预计 2 小时）

#### Step 7.1：更新 rules/index.json
- **操作**：修改所有涉及 C1 的规则
- **涉及规则**：~20 条（见 3.5）
- **验收**：
  - 所有 rule_id 的 description 正确
  - applicable_stages 包含 "it"
  - checkLogic 描述正确

#### Step 7.2：更新 rules schema（如需要）
- **操作**：检查是否需要更新 schema
- **验收**：schema 支持 "it" 阶段

---

### Phase 8：状态和帮助（预计 1 小时）

#### Step 8.1：更新 status 命令
- **操作**：显示 IT 创建和填写状态
- **验收**：`prd status` 显示 IT 列表和状态

#### Step 8.2：更新 CLI 帮助
- **操作**：更新帮助信息反映新流程
- **验收**：`prd --help` 显示新流程

---

### Phase 9：文档更新（预计 1.5 小时）

#### Step 9.1：更新 README.md
- **操作**：反映 IT 架构
- **验收**：文档描述正确

#### Step 9.2：更新 GUIDE.md
- **操作**：更新使用指南
- **验收**：指南步骤正确

#### Step 9.3：更新设计文档
- **操作**：更新 `docs/流程简化设计方案.md`
- **验收**：设计文档反映最新架构

---

### Phase 10：测试和验收（预计 2.5 小时）

#### Step 8.1：单元测试
- **操作**：为 it.js 编写测试
- **验收**：`npm test` 全部通过

#### Step 8.2：集成测试
- **操作**：完整流程测试
- **验收**：从 init 到 freeze 全流程成功

#### Step 8.3：本地安装测试
- **操作**：`npm pack` 并本地安装测试
- **验收**：本地测试通过

---

## 5. 风险评估

### 5.1 向后兼容

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 旧项目无 IT 目录 | version freeze 失败 | 检测并提示迁移 |
| 用户习惯 C1 命令 | 误操作 | 保留 C1 命令但标记废弃 |

### 5.2 迁移策略

```
旧项目升级路径：
1. prd upgrade 更新工具
2. 如已有 C1，手动拆分为 IT（或保留 C1）
3. 新迭代使用 IT 流程
```

---

## 6. 验收清单

### 6.1 功能验收

- [ ] `prd it create <name>` 正常工作
- [ ] `prd it list` 正常工作
- [ ] `prd it show <id>` 正常工作
- [ ] `prd plan freeze` 后提示创建 IT
- [ ] `prd version freeze` 检查 IT 完整性
- [ ] `prd status` 显示 IT 状态

### 6.2 文档验收

- [ ] IT-BIZ 模板内容正确
- [ ] IT-DEV 模板内容正确
- [ ] README 更新完成
- [ ] GUIDE 更新完成
- [ ] .cursorrules 更新完成

### 6.3 测试验收

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 本地安装测试通过

---

## 7. 开始执行

**执行方式**：按 Phase 顺序，每完成一个 Step 后验收，验收通过再进入下一步。

**当前状态**：待执行

**下一步**：Phase 1 - Step 1.1 创建分支

---

> 📌 **注意**：每一步完成后，我会报告执行结果和验收状态，确认通过后再进入下一步。
