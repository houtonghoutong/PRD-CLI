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

    // 检查规划冻结是否存在（支持新旧文件名）
    const freezePath = path.join(iterationDir, '规划冻结.md');
    const oldB3Path = path.join(iterationDir, 'B3_规划冻结归档.md');
    if (!await fs.pathExists(freezePath) && !await fs.pathExists(oldB3Path)) {
        console.log(chalk.red('✗ 请先完成规划冻结'));
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

    // 读取模板（优先使用新的中文模板）
    let bizTemplatePath = path.join(__dirname, '../templates/业务需求.md');
    let devTemplatePath = path.join(__dirname, '../templates/技术规格.md');

    // 兼容旧模板
    if (!await fs.pathExists(bizTemplatePath)) {
        bizTemplatePath = path.join(__dirname, '../templates/it-biz.md');
    }
    if (!await fs.pathExists(devTemplatePath)) {
        devTemplatePath = path.join(__dirname, '../templates/it-dev.md');
    }

    const bizTemplate = await fs.readFile(bizTemplatePath, 'utf-8');
    const devTemplate = await fs.readFile(devTemplatePath, 'utf-8');

    // 替换模板变量
    const createTime = new Date().toLocaleString('zh-CN');
    const replacements = {
        '{{IT_ID}}': itId,
        '{{IT_NAME}}': name,
        '{{CREATE_TIME}}': createTime
    };

    let bizContent = bizTemplate;
    let devContent = devTemplate;

    Object.entries(replacements).forEach(([key, value]) => {
        bizContent = bizContent.replace(new RegExp(key, 'g'), value);
        devContent = devContent.replace(new RegExp(key, 'g'), value);
    });

    // 生成文件（使用中文文件名）
    const bizFilePath = path.join(itPath, '业务需求.md');
    const devFilePath = path.join(itPath, '技术规格.md');

    await fs.writeFile(bizFilePath, bizContent);
    await fs.writeFile(devFilePath, devContent);

    console.log(chalk.green(`✓ 创建 IT: ${itFolderName}\n`));
    console.log(chalk.cyan(`📁 位置: ${itPath}`));
    console.log(chalk.gray(`   业务需求.md`));
    console.log(chalk.gray(`   技术规格.md`));
    console.log('');
    console.log(chalk.bold('下一步:'));
    console.log('1. 填写业务需求.md（与 AI 对话）');
    console.log('2. 填写技术规格.md（技术负责人补充）');
    console.log('3. 查看所有 IT: prd it list');
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

    console.log(chalk.bold.cyan(`\n=== 当前迭代 IT 列表 ( 共 ${itFolders.length} 个 ) ===\n`));

    // 模板文件用于对比
    const bizTemplatePath = path.join(__dirname, '../templates/it-biz.md');
    const devTemplatePath = path.join(__dirname, '../templates/it-dev.md');
    const bizTemplate = await fs.readFile(bizTemplatePath, 'utf-8');
    const devTemplate = await fs.readFile(devTemplatePath, 'utf-8');
    // 提取模板特征（用于简单判断是否修改）
    const bizFeature = "### 1. 用户故事";
    const devFeature = "### 1.1 用户故事";

    for (const itFolder of itFolders) {
        const itPath = path.join(itDir, itFolder);
        const itId = itFolder.split('-').slice(0, 2).join('-');
        const bizPath = path.join(itPath, `${itId}-BIZ.md`);
        const devPath = path.join(itPath, `${itId}-DEV.md`);

        const hasBiz = await fs.pathExists(bizPath);
        const hasDev = await fs.pathExists(devPath);

        let bizStatus = chalk.gray('缺失');
        let devStatus = chalk.gray('缺失');

        if (hasBiz) {
            const content = await fs.readFile(bizPath, 'utf-8');
            // 简单判断：如果内容长度比模板由明显变化，或者关键部分被修改
            // 这里用简单逻辑：只要文件存在且不仅仅是模板替换后的初始状态
            // 更好的方式是检查是否有 "[用户角色]" 这样的占位符
            const isDefault = content.includes('[用户角色]');
            bizStatus = isDefault ? chalk.yellow('待填写') : chalk.green('已填写');
        }

        if (hasDev) {
            const content = await fs.readFile(devPath, 'utf-8');
            const isDefault = content.includes('<!-- 从 BIZ 复制 -->');
            devStatus = isDefault ? chalk.yellow('待填写') : chalk.green('已填写');
        }

        console.log(chalk.bold(`${itFolder}`));
        console.log(`  BIZ: ${bizStatus}`);
        console.log(`  DEV: ${devStatus}`);
        console.log(chalk.gray('-'.repeat(40)));
    }
    console.log('');
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

    // BIZ 文件信息
    const itId = targetIT.split('-').slice(0, 2).join('-');
    const bizFileName = `${itId}-BIZ.md`;
    const bizPath = path.join(itPath, bizFileName);

    if (await fs.pathExists(bizPath)) {
        const content = await fs.readFile(bizPath, 'utf-8');
        const isDefault = content.includes('[用户角色]');
        const status = isDefault ? chalk.yellow('待填写') : chalk.green('已填写');
        console.log(`📄 ${chalk.bold('BIZ 业务需求')} (${bizFileName})`);
        console.log(`   状态: ${status}`);
        console.log(`   路径: ${bizPath}`);
    } else {
        console.log(`📄 ${chalk.bold('BIZ 业务需求')} (${bizFileName})`);
        console.log(`   状态: ${chalk.red('缺失')}`);
    }
    console.log('');

    // DEV 文件信息
    const devFileName = `${itId}-DEV.md`;
    const devPath = path.join(itPath, devFileName);

    if (await fs.pathExists(devPath)) {
        const content = await fs.readFile(devPath, 'utf-8');
        const isDefault = content.includes('<!-- 从 BIZ 复制 -->');
        const status = isDefault ? chalk.yellow('待填写') : chalk.green('已填写');
        console.log(`🛠️  ${chalk.bold('DEV 功能规格')} (${devFileName})`);
        console.log(`   状态: ${status}`);
        console.log(`   路径: ${devPath}`);
    } else {
        console.log(`🛠️  ${chalk.bold('DEV 功能规格')} (${devFileName})`);
        console.log(`   状态: ${chalk.red('缺失')}`);
    }
    console.log('');

    // 操作提示
    console.log(chalk.gray('-'.repeat(40)));
    console.log(chalk.bold('提示:'));
    console.log(`- 编辑业务需求: code "${bizPath}"`);
    console.log(`- 编辑开发规格: code "${devPath}"`);
    console.log('');
}
