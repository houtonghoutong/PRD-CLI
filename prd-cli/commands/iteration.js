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

    // 创建 IT 目录（用于存放用户故事）
    await fs.ensureDir(path.join(iterationDir, 'IT'));

    // 更新配置
    config.currentIteration = newIteration;
    await fs.writeJSON(configPath, config, { spaces: 2 });

    console.log(chalk.green(`✓ ${iterationName} 创建成功!`));
    console.log(chalk.cyan(`\n目录位置: ${iterationDir}\n`));

    // 检查 A2 是否有待下版事项
    const a2Path = path.join(process.cwd(), '01_产品基线', 'A2_存量反馈与数据汇总.md');
    if (await fs.pathExists(a2Path)) {
        const a2Content = await fs.readFile(a2Path, 'utf-8');
        if (a2Content.includes('待下版事项') && !a2Content.includes('待下版事项 #1: [需求标题]')) {
            console.log(chalk.yellow.bold('📌 提醒：A2 中有待下版事项！\n'));
            console.log(chalk.yellow('   请检查 01_产品基线/A2_存量反馈与数据汇总.md'));
            console.log(chalk.yellow('   的"五、待下版事项"章节，'));
            console.log(chalk.yellow('   将需要处理的事项纳入本轮规划。\n'));
        }
    }

    console.log(chalk.bold('下一步:'));
    console.log('1. 创建规划文档: prd plan create B');
    console.log('2. 与 AI 对话填写规划（启动检查 + 需求拆解）');
    console.log('3. 冻结规划: prd plan freeze');
    console.log('4. 创建 IT 用户故事: prd it create "需求名称"');
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
