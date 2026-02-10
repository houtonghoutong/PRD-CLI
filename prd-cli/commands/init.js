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
            console.log(chalk.yellow('   如需更新规则文件，请运行: prd upgrade'));
            return;
        }

        // ⚠️ 检查是否在已有 PRD 项目中创建子项目（常见错误）
        if (!isCurrentDir && await fs.pathExists(path.join(process.cwd(), '.prd-config.json'))) {
            console.log(chalk.yellow('⚠️ 警告：当前目录已经是一个 PRD 项目！'));
            console.log(chalk.yellow(`   你正在尝试在 PRD 项目中创建子项目 "${projectName}"。`));
            console.log('');
            console.log(chalk.cyan('   建议操作：'));
            console.log(chalk.gray('   1. 如果要在当前项目工作，直接使用 prd baseline create 产品定义 等命令'));
            console.log(chalk.gray('   2. 如果确实要创建独立新项目，请先 cd 到其他目录'));
            console.log(chalk.gray('   3. 如果要更新规则文件，请运行: prd upgrade'));
            console.log('');
            console.log(chalk.red('   已取消操作。'));
            return;
        }

        console.log(chalk.blue(`正在${isCurrentDir ? '在当前目录' : '创建项目: ' + projectName}初始化...`));

        // 创建项目目录结构（使用新的中文命名）
        const directories = [
            '00_项目总览',
            '01_基线',           // 原 01_产品基线
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
            cliVersion: '2.0.0',
            currentIteration: 0,
            workflow: '基线 → 规划 → IT → 版本',
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
                'prd-workflow-cli': '^2.0.0'
            }
        };

        await fs.writeJSON(
            path.join(projectPath, 'package.json'),
            packageJson,
            { spaces: 2 }
        );

        // 创建项目信息模板（原 P0）
        const projectInfoTemplate = `# 项目信息

**创建时间**: ${new Date().toLocaleString('zh-CN')}
**项目名称**: ${displayName}

---

> ⚠️ **这是业务的"宪法"** - 只记录代码无法表达的决策
> 
> 功能清单由 AI 扫描代码自动生成（见代码快照），无需在此重复

---

## 1. 产品定位

**一句话说明这个产品是什么**:
<!-- 例如：面向企业用户的项目管理工具 -->


**核心价值主张**:
<!-- 用户为什么选择你而不是竞品？ -->


---

## 2. 边界声明

### 2.1 明确不做的事情

<!-- 这是最重要的部分！列出被拒绝的需求/方向 -->

| 不做的事情 | 原因 |
|-----------|------|
| 例：第三方登录 | 数据安全考虑 |
| 例：移动端 App | 资源限制，优先 Web |
| | |

### 2.2 核心约束（红线）

<!-- 不可妥协的限制 -->

- [ ] 安全约束: ___________
- [ ] 合规约束: ___________
- [ ] 性能约束: ___________
- [ ] 其他: ___________

---

## 3. 责任人

| 角色 | 姓名 | 职责 |
|-----|------|------|
| **产品负责人 (PM)** | _____ | 最终决策 |
| **技术负责人** | _____ | 技术可行性 |
| **业务方** | _____ | 业务验收 |

---

## 4. 成功标准

<!-- 如何判断项目成功？必须可衡量 -->

| 指标 | 当前值 | 目标值 | 截止日期 |
|-----|-------|-------|---------| 
| 例：注册转化率 | 30% | 60% | 2024-Q2 |
| | | | |

---

## PM 确认

- [ ] 边界声明已明确
- [ ] 责任人已确认
- [ ] 成功标准可衡量

**PM 签字**: _____________
**日期**: _____________
`;

        await fs.writeFile(
            path.join(projectPath, '00_项目总览/项目信息.md'),
            projectInfoTemplate
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

        // 复制 A2UI 预览器
        const a2uiViewerDir = path.join(__dirname, '../a2ui-viewer');
        if (await fs.pathExists(a2uiViewerDir)) {
            await fs.copy(
                a2uiViewerDir,
                path.join(projectPath, 'a2ui-viewer')
            );
        }

        // 创建 .a2ui 目录（用于临时预览数据）
        await fs.ensureDir(path.join(projectPath, '.a2ui'));

        // 创建 README（使用新的中文命名）
        const readme = `# ${displayName}

本项目采用规范化的产品需求管理流程 (PRD-CLI v2.0.0)

## 📁 目录结构

\`\`\`
${displayName}/
├── 00_项目总览/          # 项目信息
│   └── 项目信息.md
├── 01_基线/              # 产品基线
│   ├── 产品定义.md       # PM 填写
│   ├── 代码快照.md       # AI 扫描生成
│   └── 用户反馈.md       # AI 整理
├── 02_迭代记录/          # 各轮迭代
│   └── 第01轮迭代/
│       ├── 需求规划.md   # PM + AI 对话
│       ├── 规划冻结.md   # 自动生成
│       ├── IT/           # 用户故事
│       │   └── IT-001-功能名/
│       │       ├── 业务需求.md
│       │       └── 技术规格.md
│       └── 版本发布.md   # 自动生成
└── 99_归档区/            # 历史文档归档
\`\`\`

## 🔄 工作流程

\`\`\`
基线阶段 → 规划阶段 → IT阶段 → 版本阶段
    ↓          ↓          ↓          ↓
  AI生成   PM+AI对话   PM+AI对话   自动生成
\`\`\`

## 🛠️ 常用命令

\`\`\`bash
# 查看项目状态
prd status

# 创建基线文档
prd baseline create 产品定义
prd baseline create 代码快照
prd baseline create 用户反馈

# 开始新迭代
prd iteration new

# 创建规划文档
prd plan create

# 冻结规划（自动审视）
prd plan freeze

# 创建 IT 用户故事
prd it create "功能名称"

# 冻结版本（自动审视）
prd version freeze
\`\`\`

## 📝 核心原则

- **PM 决策，AI 执行**：AI 不替 PM 做决策
- **对话驱动**：文档通过对话逐步完成，不一次填充
- **审视内化**：审视作为动作内化到 freeze 命令中
- **防止幻觉**：AI 不编造技术细节

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
        console.log(chalk.gray('   ✓ .agent/workflows/  - PRD 工作流指引'));
        console.log(chalk.gray('   ✓ .cursorrules       - Cursor AI 规则'));
        console.log(chalk.gray('   ✓ .antigravity/      - Antigravity AI 规则'));
        console.log(chalk.gray('   ✓ a2ui-viewer/       - A2UI 界面预览器'));
        console.log('');
        console.log(chalk.yellow('   💡 现在你可以直接与 AI 助手对话，AI 已经知道如何协助你完成 PRD 流程！'));
        console.log('');

        console.log(chalk.bold('📋 下一步操作:'));
        console.log('');
        if (!isCurrentDir) {
            console.log(chalk.cyan('1. 进入项目目录'));
            console.log(`   cd ${displayName}`);
            console.log('');
            console.log(chalk.cyan('2. 完善项目信息'));
        } else {
            console.log(chalk.cyan('1. 完善项目信息'));
        }
        console.log(chalk.gray('   文件位置: 00_项目总览/项目信息.md'));
        console.log(chalk.yellow('   ⚠️  必须完成项目信息后才能开始创建基线文档'));
        console.log('');
        console.log(chalk.cyan(`${isCurrentDir ? '2' : '3'}. 创建产品定义`));
        console.log('   prd baseline create 产品定义');
        console.log('');

    } catch (error) {
        console.log(chalk.red('✗ 创建项目失败:'), error.message);
    }
};
