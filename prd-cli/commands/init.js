const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

module.exports = async function (projectName) {
    // 支持 "." 表示在当前目录初始化
    const isCurrentDir = projectName === '.';
    const projectPath = isCurrentDir ? process.cwd() : path.join(process.cwd(), projectName);
    const displayName = isCurrentDir ? path.basename(process.cwd()) : projectName;

    try {
        // 检查目录是否已存在（仅当创建新目录时）
        if (!isCurrentDir && await fs.pathExists(projectPath)) {
            console.log(chalk.red(`✗ 目录 ${projectName} 已存在`));
            return;
        }

        // 检查当前目录是否已经是 PRD 项目
        if (isCurrentDir && await fs.pathExists(path.join(projectPath, '.prd-config.json'))) {
            console.log(chalk.red('✗ 当前目录已经是 PRD 项目'));
            return;
        }

        console.log(chalk.blue(`正在${isCurrentDir ? '在当前目录' : '创建项目: ' + projectName}初始化...`));

        // 创建项目目录结构
        const directories = [
            '00_项目总览',
            '01_产品基线',
            '02_迭代记录',
            '98_对话归档',
            '99_归档区/历史参考与废弃文档',
            '.agent/workflows'
        ];

        for (const dir of directories) {
            await fs.ensureDir(path.join(projectPath, dir));
        }

        // 创建项目配置文件
        const config = {
            projectName: displayName,
            createdAt: new Date().toISOString(),
            currentIteration: 0,
            workflow: 'A → R → B → C',
            stages: {
                baseline: { completed: false, documents: [] },
                planning: { completed: false, documents: [] },
                version: { completed: false, documents: [] }
            }
        };

        await fs.writeJSON(
            path.join(projectPath, '.prd-config.json'),
            config,
            { spaces: 2 }
        );

        // 创建 package.json（让其他用户可以通过 npm install 安装 CLI）
        const packageJson = {
            name: displayName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            version: '1.0.0',
            description: `${displayName} - PRD 需求管理项目`,
            private: true,
            scripts: {
                prd: 'prd',
                status: 'prd status',
                help: 'prd --help'
            },
            dependencies: {
                'prd-workflow-cli': '^1.1.29'
            }
        };

        await fs.writeJSON(
            path.join(projectPath, 'package.json'),
            packageJson,
            { spaces: 2 }
        );

        // 创建 P0 项目基本信息模板
        const p0Template = `# P0_项目基本信息

**创建时间**: ${new Date().toLocaleString('zh-CN')}
**项目名称**: ${displayName}
**文档状态**: 草案

---

## 文档说明

**目的**: 
- 明确项目是否应该存在
- 确认项目目标是否成立
- 识别关键干系人

**填写要求**:
- 只填写事实，不填愿景
- 目标要可检验
- 干系人要具体到人

---

## 1. 项目基本信息

### 1.1 项目定位

**项目全称**: ${displayName}

**项目简述**:
<!-- 一句话说明这个项目是什么 -->

**所属产品线**: 
<!-- 例如：核心业务系统、辅助工具、创新试点 -->

**项目级别**: 
- [ ] 战略级（公司级重点）
- [ ] 业务级（部门级重点）
- [ ] 支撑级（基础能力）

---

## 2. 项目目标

### 2.1 核心目标

**要解决的主要问题**:
<!-- 不超过 3 个核心问题 -->
1. 
2. 
3. 

**成功标准**:
<!-- 如何判断项目成功？用可衡量的指标 -->
- 指标 1: ______
- 指标 2: ______
- 指标 3: ______

### 2.2 目标合理性确认

**为什么现在做这个项目？**
<!-- 时机/背景/触发因素 -->

**不做会怎样？**
<!-- 说明紧迫性 -->

---

## 3. 干系人

### 3.1 核心干系人

**PM（产品负责人）**:
- 姓名: ____________
- 职责: 项目最终决策
- 联系方式: ____________

**技术负责人**:
- 姓名: ____________
- 职责: 技术可行性把关
- 联系方式: ____________

**业务方**:
- 部门: ____________
- 联系人: ____________
- 职责: 业务需求确认

### 3.2 相关方

**可能受影响的团队/系统**:
<!-- 列出会受此项目影响的其他团队或系统 -->

---

## 4. 项目约束

### 4.1 时间约束

**期望启动时间**: ____________
**期望交付时间**: ____________

### 4.2 资源约束

**已知的资源限制**:
<!-- 人力/预算/技术限制 -->

### 4.3 依赖条件

**项目依赖**:
<!-- 需要其他项目/系统先完成什么？ -->

---

## 5. 项目状态

**当前状态**: 初始化
**当前迭代**: 0 轮
**下一步**: 创建 A 类基线文档

---

## 6. PM 确认

- [ ] 项目目标已明确且合理
- [ ] 干系人已确认
- [ ] 约束条件已记录
- [ ] 可以开始基线建立

**PM 签字**: _____________
**日期**: _____________

---

## 备注

<!-- 其他需要说明的重要信息 -->
`;

        await fs.writeFile(
            path.join(projectPath, '00_项目总览/P0_项目基本信息.md'),
            p0Template
        );

        // 复制工作流模板
        const workflowsDir = path.join(__dirname, '../.agent/workflows');
        if (await fs.pathExists(workflowsDir)) {
            await fs.copy(
                workflowsDir,
                path.join(projectPath, '.agent/workflows')
            );
        }

        // 复制对话归档模板
        const dialogTemplateSource = path.join(__dirname, '../templates/dialog-template.md');
        if (await fs.pathExists(dialogTemplateSource)) {
            await fs.copy(
                dialogTemplateSource,
                path.join(projectPath, '98_对话归档/AI_对话归档模板.md')
            );
        }

        // 复制 AI 规则文件
        // .cursorrules (Cursor IDE)
        const cursorrules = path.join(__dirname, '../.cursorrules');
        if (await fs.pathExists(cursorrules)) {
            await fs.copy(
                cursorrules,
                path.join(projectPath, '.cursorrules')
            );
        }

        // .antigravity/rules.md (Antigravity)
        const antigravityDir = path.join(__dirname, '../.antigravity');
        if (await fs.pathExists(antigravityDir)) {
            await fs.copy(
                antigravityDir,
                path.join(projectPath, '.antigravity')
            );
        }

        // AI-GUIDE.md (通用 AI 指引)
        const aiGuide = path.join(__dirname, '../AI-GUIDE.md');
        if (await fs.pathExists(aiGuide)) {
            await fs.copy(
                aiGuide,
                path.join(projectPath, 'AI-GUIDE.md')
            );
        }

        // 创建 README
        const readme = `# ${displayName}

本项目采用规范化的产品需求管理流程

## 📁 目录结构

\`\`\`
${displayName}/
├── 00_项目总览/          # 项目基本信息
├── 01_产品基线/          # A 类文档：现状基线
├── 02_迭代记录/          # 各轮迭代的 B、C 类文档
│   ├── 第01轮迭代/
│   ├── 第02轮迭代/
│   └── ...
└── 99_归档区/            # 历史文档归档
\`\`\`

## 🔄 工作流程

1. **A 类 - 建立基线** (01_产品基线/)
   - A0: 产品基础与范围说明
   - A1: 已上线功能与流程清单
   - A2: 存量反馈与数据汇总
   - R0: 基线审视报告

2. **B 类 - 需求规划** (02_迭代记录/第N轮迭代/)
   - R1: 规划前审视（启动条件检查）
   - B1: 需求规划草案
   - B2: 规划拆解与范围界定
   - R1: 规划审视（冻结前审查）
   - B3: 规划冻结归档

3. **C 类 - 版本需求** (02_迭代记录/第N轮迭代/)
   - R2: 版本审视
   - C0: 版本范围声明
   - C1: 版本需求清单
   - C3: 版本冻结归档

## 🛠️ 使用 CLI 工具

\`\`\`bash
# 查看项目状态
prd status

# 创建基线文档
prd baseline create A0

# 开始新迭代
prd iteration new

# 创建规划文档
prd plan create B1

# 执行 R1 审视
prd review r1

# 冻结规划
prd plan freeze
\`\`\`

## 📝 关键原则

- **R1 是启动闸门**: 必须满足三个条件才能开始规划
- **B3 是决策冻结**: 规划一旦冻结不可随意更改
- **C 类不讨论方向**: 只执行已冻结的规划
- **审视是强制的**: R1/R2 必须通过才能进入下一阶段

---
创建时间: ${new Date().toLocaleString('zh-CN')}
`;

        await fs.writeFile(
            path.join(projectPath, 'README.md'),
            readme
        );

        console.log(chalk.green('✓ 项目创建成功!'));
        console.log('');

        // 显示 AI 集成信息
        console.log(chalk.bold('🤖 AI 集成已配置:'));
        console.log(chalk.gray('   ✓ .agent/workflows/  - PRD 工作流指引（包含所有阶段的详细步骤）'));
        console.log(chalk.gray('   ✓ .cursorrules       - Cursor AI 规则'));
        console.log(chalk.gray('   ✓ .antigravity/      - Antigravity AI 规则'));
        console.log('');
        console.log(chalk.yellow('   💡 现在你可以直接与 AI 助手对话，AI 已经知道如何协助你完成 PRD 流程！'));
        console.log(chalk.gray('   例如：告诉 AI "我要创建一个新项目的需求文档"'));
        console.log('');

        console.log(chalk.bold('📋 下一步操作（请按顺序执行）:'));
        console.log('');
        if (!isCurrentDir) {
            console.log(chalk.cyan('第 1 步: 进入项目目录'));
            console.log(`  cd ${displayName}`);
            console.log('');
            console.log(chalk.cyan('第 2 步: 完善 P0_项目基本信息.md'));
        } else {
            console.log(chalk.cyan('第 1 步: 完善 P0_项目基本信息.md'));
        }
        console.log(chalk.gray('  文件位置: 00_项目总览/P0_项目基本信息.md'));
        console.log(chalk.gray('  填写内容: 项目目标、干系人、约束条件等'));
        console.log(chalk.yellow('  ⚠️  必须完成 P0 填写后才能开始创建 A 类基线文档'));
        console.log('');
        console.log(chalk.cyan(`第 ${isCurrentDir ? '2' : '3'} 步: 创建 A0 基线文档`));
        console.log('  prd baseline create A0  # P0 填写完成后执行');
        console.log('');

    } catch (error) {
        console.log(chalk.red('✗ 创建项目失败:'), error.message);
    }
};
