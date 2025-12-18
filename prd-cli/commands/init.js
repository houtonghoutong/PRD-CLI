const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

module.exports = async function (projectName) {
    const projectPath = path.join(process.cwd(), projectName);

    try {
        // 检查目录是否已存在
        if (await fs.pathExists(projectPath)) {
            console.log(chalk.red(`✗ 目录 ${projectName} 已存在`));
            return;
        }

        console.log(chalk.blue(`正在创建项目: ${projectName}...`));

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
            projectName,
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

        // 创建 P0 项目基本信息模板
        const p0Template = `# P0_项目基本信息

## 项目名称
${projectName}

## 项目创建时间
${new Date().toLocaleDateString('zh-CN')}

## 项目目标
<!-- 请填写项目的核心目标 -->

## 主要干系人
<!-- 请列出主要干系人及其角色 -->

## 项目状态
- 当前阶段: 初始化
- 迭代轮次: 0

## 备注
<!-- 其他重要信息 -->
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

        // 创建 README
        const readme = `# ${projectName}

本项目采用规范化的产品需求管理流程

## 📁 目录结构

\`\`\`
${projectName}/
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
        console.log(chalk.bold('下一步操作:'));
        console.log(`  cd ${projectName}`);
        console.log('  prd baseline create A0  # 开始创建基线文档');
        console.log('');

    } catch (error) {
        console.log(chalk.red('✗ 创建项目失败:'), error.message);
    }
};
