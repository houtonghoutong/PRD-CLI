const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * IT (INVEST) 管理命令
 * 替代原来的 C1 大文档，每个 IT 是一个独立的用户故事
 */

module.exports = async function (action, name, options = {}) {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        console.log('请先运行: prd init <项目名>');
        return;
    }

    const config = await fs.readJSON(configPath);

    if (action === 'create') {
        await createIT(config, name, options);
    } else if (action === 'list') {
        await listITs(config, options);
    } else if (action === 'show') {
        await showIT(config, name, options);
    } else {
        console.log(chalk.red('✗ 未知的操作'));
        console.log('可用操作: create, list, show');
    }
};

async function createIT(config, name, options = {}) {
    if (config.currentIteration === 0) {
        console.log(chalk.red('✗ 请先创建迭代'));
        console.log('运行: prd iteration new');
        return;
    }

    if (!name) {
        console.log(chalk.red('✗ 请提供 IT 名称'));
        console.log('示例: prd it create 用户反馈');
        return;
    }

    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
    );

    // 检查 B3 是否存在
    const b3Path = path.join(iterationDir, 'B3_规划冻结归档.md');
    if (!await fs.pathExists(b3Path)) {
        console.log(chalk.red('✗ 请先完成规划冻结 (B3)'));
        console.log('运行: prd plan freeze');
        return;
    }

    const itDir = path.join(iterationDir, 'IT');
    await fs.ensureDir(itDir);

    // 获取下一个 IT 编号
    const existingITs = await fs.readdir(itDir);
    const itNumbers = existingITs
        .filter(dir => dir.startsWith('IT-'))
        .map(dir => parseInt(dir.split('-')[1]))
        .filter(n => !isNaN(n));

    const nextNumber = itNumbers.length > 0 ? Math.max(...itNumbers) + 1 : 1;
    const itId = `IT-${String(nextNumber).padStart(3, '0')}`;
    const itFolderName = `${itId}-${name}`;
    const itPath = path.join(itDir, itFolderName);

    if (await fs.pathExists(itPath)) {
        console.log(chalk.yellow(`⚠ IT 已存在: ${itFolderName}`));
        return;
    }

    await fs.ensureDir(itPath);

    console.log(chalk.green(`✓ 创建 IT: ${itFolderName}\n`));
    console.log(chalk.cyan(`📁 位置: ${itPath}`));
    console.log('');
    console.log(chalk.bold('下一步:'));
    console.log('1. 填写 IT-BIZ.md（给业务方确认）');
    console.log('2. 填写 IT-DEV.md（给开发团队）');
    console.log('');
}

async function listITs(config, options = {}) {
    if (config.currentIteration === 0) {
        console.log(chalk.red('✗ 尚未创建迭代'));
        return;
    }

    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
    );

    const itDir = path.join(iterationDir, 'IT');

    if (!await fs.pathExists(itDir)) {
        console.log(chalk.yellow('尚未创建任何 IT'));
        console.log('运行: prd it create <名称>');
        return;
    }

    const its = await fs.readdir(itDir);
    const itFolders = its.filter(name => name.startsWith('IT-'));

    if (itFolders.length === 0) {
        console.log(chalk.yellow('尚未创建任何 IT'));
        return;
    }

    console.log(chalk.bold.cyan(`\n=== 当前迭代 IT 列表 ===\n`));

    for (const itFolder of itFolders) {
        const itPath = path.join(itDir, itFolder);
        const bizPath = path.join(itPath, `${itFolder.split('-')[0]}-${itFolder.split('-')[1]}-BIZ.md`);
        const devPath = path.join(itPath, `${itFolder.split('-')[0]}-${itFolder.split('-')[1]}-DEV.md`);

        const hasBiz = await fs.pathExists(bizPath);
        const hasDev = await fs.pathExists(devPath);

        console.log(chalk.bold(itFolder));
        console.log(`  BIZ: ${hasBiz ? chalk.green('✓') : chalk.gray('○')}`);
        console.log(`  DEV: ${hasDev ? chalk.green('✓') : chalk.gray('○')}`);
        console.log('');
    }
}

async function showIT(config, idOrName, options = {}) {
    if (!idOrName) {
        console.log(chalk.red('✗ 请提供 IT 编号或名称'));
        console.log('示例: prd it show 001');
        return;
    }

    if (config.currentIteration === 0) {
        console.log(chalk.red('✗ 尚未创建迭代'));
        return;
    }

    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
    );

    const itDir = path.join(iterationDir, 'IT');

    if (!await fs.pathExists(itDir)) {
        console.log(chalk.yellow('尚未创建任何 IT'));
        return;
    }

    const its = await fs.readdir(itDir);
    const targetIT = its.find(name =>
        name.includes(idOrName) || name.startsWith(`IT-${idOrName}`)
    );

    if (!targetIT) {
        console.log(chalk.red(`✗ 未找到 IT: ${idOrName}`));
        return;
    }

    const itPath = path.join(itDir, targetIT);
    console.log(chalk.bold.cyan(`\n=== ${targetIT} ===\n`));
    console.log(`路径: ${itPath}\n`);

    const files = await fs.readdir(itPath);
    files.forEach(file => {
        console.log(`  ${file}`);
    });
    console.log('');
}
