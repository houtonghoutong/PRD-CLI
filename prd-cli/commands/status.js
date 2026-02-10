const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

module.exports = async function () {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        console.log('请先运行: prd init <项目名>');
        return;
    }

    const config = await fs.readJSON(configPath);

    console.log(chalk.bold.cyan('\n=== 项目状态 ===\n'));

    console.log(chalk.bold('项目信息:'));
    console.log(`  名称: ${config.projectName}`);
    console.log(`  创建时间: ${new Date(config.createdAt).toLocaleString('zh-CN')}`);
    console.log(`  当前迭代: 第 ${config.currentIteration} 轮`);
    console.log('');

    // 检查基线完成情况
    console.log(chalk.bold('基线状态:'));
    const baselineDir = path.join(process.cwd(), '01_产品基线');
    if (await fs.pathExists(baselineDir)) {
        const files = await fs.readdir(baselineDir);
        const hasA0 = files.some(f => f.includes('A0'));
        const hasA1 = files.some(f => f.includes('A1'));
        const hasA2 = files.some(f => f.includes('A2'));
        const hasR0 = files.some(f => f.includes('R0'));

        console.log(`  A0 产品基础: ${hasA0 ? chalk.green('✓') : chalk.gray('○')}`);
        console.log(`  A1 功能清单: ${hasA1 ? chalk.green('✓') : chalk.gray('○')}`);
        console.log(`  A2 反馈汇总: ${hasA2 ? chalk.green('✓') : chalk.gray('○')}`);
        console.log(`  R0 基线审视: ${hasR0 ? chalk.green('✓') : chalk.gray('○')}`);

        const baselineComplete = hasA0 && hasA1 && hasA2 && hasR0;
        console.log(`  状态: ${baselineComplete ? chalk.green('已完成') : chalk.yellow('进行中')}`);
    } else {
        console.log(chalk.gray('  尚未开始'));
    }
    console.log('');

    // 检查当前迭代状态
    if (config.currentIteration > 0) {
        console.log(chalk.bold('当前迭代:'));
        const iterationDir = path.join(
            process.cwd(),
            '02_迭代记录',
            `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
        );

        if (await fs.pathExists(iterationDir)) {
            const files = await fs.readdir(iterationDir);

            const hasB = files.some(f => f.includes('B_规划文档'));
            const hasB3 = files.some(f => f.includes('B3'));

            // 检查 IT 目录
            const itDir = path.join(iterationDir, 'IT');
            let hasIT = false;
            let itCount = 0;
            if (await fs.pathExists(itDir)) {
                const folders = await fs.readdir(itDir);
                itCount = folders.filter(f => f.startsWith('IT-')).length;
                hasIT = itCount > 0;
            }

            const hasR2 = files.some(f => f.includes('R2'));
            const hasC3 = files.some(f => f.includes('C3'));

            console.log(`  B  规划文档: ${hasB ? chalk.green('✓') : chalk.gray('○')}`);
            console.log(`  B3 规划冻结: ${hasB3 ? chalk.green('✓') : chalk.gray('○')}`);
            console.log(`  IT 用户故事: ${hasIT ? chalk.green(`✓ (${itCount}个)`) : chalk.gray('○')}`);
            console.log(`  R2 版本审视: ${hasR2 ? chalk.green('✓') : chalk.gray('○')} ${!hasR2 && hasIT ? chalk.gray('(自动执行)') : ''}`);
            console.log(`  C3 版本冻结: ${hasC3 ? chalk.green('✓') : chalk.gray('○')}`);;

            // 判断当前阶段
            let currentStage = '';
            if (hasC3) {
                currentStage = chalk.green('✓ 已完成');
            } else if (hasIT) {
                currentStage = chalk.cyan('· 待版本冻结');
            } else if (hasB3) {
                currentStage = chalk.cyan('· 需求开发中 (IT)');
            } else if (hasB) {
                currentStage = chalk.cyan('· 待规划冻结');
            } else {
                currentStage = chalk.yellow('· 已创建');
            }

            console.log(`  状态: ${currentStage}`);
        }
    } else {
        console.log(chalk.gray('尚未开始迭代'));
    }
    console.log('');

    // 下一步建议
    console.log(chalk.bold('下一步建议:'));
    if (config.currentIteration === 0) {
        console.log(chalk.cyan('  prd baseline create A0  # 创建基线文档'));
    } else {
        const iterationDir = path.join(
            process.cwd(),
            '02_迭代记录',
            `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
        );

        if (await fs.pathExists(iterationDir)) {
            const files = await fs.readdir(iterationDir);
            const itDir = path.join(iterationDir, 'IT');
            const hasIT = await fs.pathExists(itDir) &&
                (await fs.readdir(itDir)).some(f => f.startsWith('IT-'));

            if (!files.some(f => f.includes('B_规划文档'))) {
                console.log(chalk.cyan('  prd plan create B  # 创建规划文档'));
            } else if (!files.some(f => f.includes('B3'))) {
                console.log(chalk.cyan('  prd plan freeze  # 冻结规划'));
            } else if (!hasIT) {
                console.log(chalk.cyan('  prd it create "需求名称"  # 创建 IT 用户故事'));
            } else if (!files.some(f => f.includes('C3'))) {
                console.log(chalk.cyan('  prd version freeze  # 冻结版本（自动R2审视）'));
            } else {
                console.log(chalk.green('  当前迭代已完成!'));
                console.log(chalk.cyan('  prd iteration new  # 开始新迭代'));
            }
        }
    }
    console.log('');
};
