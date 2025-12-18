const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

module.exports = async function (action) {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        return;
    }

    const config = await fs.readJSON(configPath);

    if (action === 'new') {
        await createNewIteration(config, configPath);
    } else if (action === 'list') {
        await listIterations();
    } else if (action === 'current') {
        console.log(chalk.cyan(`当前迭代: 第 ${config.currentIteration} 轮`));
    } else {
        console.log(chalk.red('✗ 未知操作'));
        console.log('可用操作: new, list, current');
    }
};

async function createNewIteration(config, configPath) {
    const newIteration = config.currentIteration + 1;
    const iterationName = `第${String(newIteration).padStart(2, '0')}轮迭代`;
    const iterationDir = path.join(process.cwd(), '02_迭代记录', iterationName);

    if (await fs.pathExists(iterationDir)) {
        console.log(chalk.yellow(`⚠ 迭代目录已存在: ${iterationName}`));
        return;
    }

    console.log(chalk.blue(`\n正在创建 ${iterationName}...\n`));

    // 创建迭代目录
    await fs.ensureDir(iterationDir);

    // 创建 R1 启动条件检查文档
    const r1StartTemplate = `# R1_规划启动条件检查

**检查时间**: ${new Date().toLocaleString('zh-CN')}
**迭代轮次**: ${iterationName}

---

## R1 启动条件检查

在开始 B1/B2 规划之前，必须确认以下三个条件全部满足。

### 启动条件一：问题是否被确认真实存在

**检查标准**:
该问题可以在以下至少一类中被指认:
- [ ] A1: 已上线功能/用户路径中的明确断点
- [ ] A2: 真实用户反馈/数据异常/业务投诉
- [ ] 明确的业务约束或合规要求变化

**检查结果**:
<!-- 填写检查结果 -->

**问题描述**:
<!-- 描述具体问题，并指向 A 类文档中的具体章节 -->

---

### 启动条件二：问题是否需要"单独一轮规划"来解决

**检查标准**:
该问题:
- [ ] 无法通过微调、修补、参数修改解决
- [ ] 会显著影响核心用户路径/核心目标

**检查结果**:
<!-- 说明为什么不能作为"顺带改一下" -->

---

### 启动条件三：问题是否已经被理解到"可规划"的程度

**检查标准**:
问题的边界已基本清楚:
- [ ] 是哪个用户
- [ ] 发生在哪个场景
- [ ] 影响到哪一段流程

不存在以下情况:
- [ ] 核心概念尚未统一
- [ ] 关键前提仍在争论

**检查结果**:
<!-- 描述问题的边界和范围 -->

---

## 最终判定

**三条条件检查结果**:
- [ ] 条件一: 通过 / 不通过
- [ ] 条件二: 通过 / 不通过
- [ ] 条件三: 通过 / 不通过

**结论**:
- [ ] ✅ 全部通过 - 允许启动 B1/B2
- [ ] ❌ 存在不满足 - 禁止创建 B1 文档

---

⚠️ **重要提醒**:
- 只有三条条件全部满足，才允许启动 B1/B2
- 任意一条不满足，禁止创建 B1 文档
- 没有"勉强通过"，没有"先写着看"
`;

    await fs.writeFile(
        path.join(iterationDir, 'R1_规划启动条件检查.md'),
        r1StartTemplate
    );

    // 更新配置
    config.currentIteration = newIteration;
    await fs.writeJSON(configPath, config, { spaces: 2 });

    console.log(chalk.green(`✓ ${iterationName} 创建成功!`));
    console.log(chalk.cyan(`\n目录位置: ${iterationDir}\n`));
    console.log(chalk.bold('下一步:'));
    console.log('1. 填写 R1_规划启动条件检查.md');
    console.log('2. 确认三个条件全部满足');
    console.log('3. 创建 B1: prd plan create B1');
    console.log('');

    console.log(chalk.yellow('📌 R1 启动条件快速参考:'));
    console.log('   条件一: 问题是否真实存在(基于 A 类文档)');
    console.log('   条件二: 是否值得单独一轮规划');
    console.log('   条件三: 问题是否已理解清楚');
    console.log('');
}

async function listIterations() {
    const iterationsDir = path.join(process.cwd(), '02_迭代记录');

    if (!await fs.pathExists(iterationsDir)) {
        console.log(chalk.yellow('还没有任何迭代'));
        return;
    }

    const iterations = await fs.readdir(iterationsDir);
    const validIterations = iterations.filter(name => name.startsWith('第') && name.includes('轮迭代'));

    if (validIterations.length === 0) {
        console.log(chalk.yellow('还没有任何迭代'));
        return;
    }

    console.log(chalk.bold('\n迭代列表:\n'));
    for (const iteration of validIterations.sort()) {
        const iterPath = path.join(iterationsDir, iteration);
        const files = await fs.readdir(iterPath);
        console.log(chalk.cyan(`📁 ${iteration}`));
        console.log(`   文档数: ${files.length}`);

        // 检查阶段完成情况
        const hasB3 = files.includes('B3_规划冻结归档.md');
        const hasC3 = files.includes('C3_版本冻结归档.md');

        if (hasC3) {
            console.log(chalk.green('   状态: ✓ 已完成'));
        } else if (hasB3) {
            console.log(chalk.yellow('   状态: · 规划已冻结，进行中'));
        } else {
            console.log(chalk.gray('   状态: · 规划中'));
        }
        console.log('');
    }
}
