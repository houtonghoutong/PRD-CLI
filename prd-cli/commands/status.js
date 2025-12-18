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

            const hasR1Start = files.some(f => f.includes('R1_规划启动'));
            const hasB1 = files.some(f => f.includes('B1'));
            const hasB2 = files.some(f => f.includes('B2'));
            const hasR1Review = files.some(f => f.includes('R1_规划审视'));
            const hasB3 = files.some(f => f.includes('B3'));
            const hasC0 = files.some(f => f.includes('C0'));
            const hasC1 = files.some(f => f.includes('C1'));
            const hasR2 = files.some(f => f.includes('R2'));
            const hasC3 = files.some(f => f.includes('C3'));

            console.log(`  R1 启动检查: ${hasR1Start ? chalk.green('✓') : chalk.gray('○')}`);
            console.log(`  B1 规划草案: ${hasB1 ? chalk.green('✓') : chalk.gray('○')}`);
            console.log(`  B2 规划拆解: ${hasB2 ? chalk.green('✓') : chalk.gray('○')}`);
            console.log(`  R1 规划审视: ${hasR1Review ? chalk.green('✓') : chalk.gray('○')}`);
            console.log(`  B3 规划冻结: ${hasB3 ? chalk.green('✓') : chalk.gray('○')}`);
            console.log(`  C0 版本范围: ${hasC0 ? chalk.green('✓') : chalk.gray('○')}`);
            console.log(`  C1 版本需求: ${hasC1 ? chalk.green('✓') : chalk.gray('○')}`);
            console.log(`  R2 版本审视: ${hasR2 ? chalk.green('✓') : chalk.gray('○')}`);
            console.log(`  C3 版本冻结: ${hasC3 ? chalk.green('✓') : chalk.gray('○')}`);

            // 判断当前阶段
            let currentStage = '';
            if (hasC3) {
                currentStage = chalk.green('✓ 已完成');
            } else if (hasC1) {
                currentStage = chalk.cyan('· 待 R2 审视');
            } else if (hasC0) {
                currentStage = chalk.cyan('· C1 创建中');
            } else if (hasB3) {
                currentStage = chalk.cyan('· 版本需求阶段');
            } else if (hasB2) {
                currentStage = chalk.cyan('· 待 R1 审视');
            } else if (hasB1) {
                currentStage = chalk.cyan('· B2 创建中');
            } else if (hasR1Start) {
                currentStage = chalk.cyan('· 规划阶段');
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

            if (!files.some(f => f.includes('B1'))) {
                console.log(chalk.cyan('  prd plan create B1  # 创建规划草案'));
            } else if (!files.some(f => f.includes('B2'))) {
                console.log(chalk.cyan('  prd plan create B2  # 创建规划拆解'));
            } else if (!files.some(f => f.includes('R1_规划审视'))) {
                console.log(chalk.cyan('  prd review r1  # 执行 R1 审视'));
            } else if (!files.some(f => f.includes('B3'))) {
                console.log(chalk.cyan('  prd plan freeze  # 冻结规划'));
            } else if (!files.some(f => f.includes('C0'))) {
                console.log(chalk.cyan('  prd version create C0  # 创建版本范围'));
            } else if (!files.some(f => f.includes('C1'))) {
                console.log(chalk.cyan('  prd version create C1  # 创建版本需求'));
            } else if (!files.some(f => f.includes('R2'))) {
                console.log(chalk.cyan('  prd review r2  # 执行 R2 审视'));
            } else if (!files.some(f => f.includes('C3'))) {
                console.log(chalk.cyan('  prd version freeze  # 冻结版本'));
            } else {
                console.log(chalk.green('  当前迭代已完成!'));
                console.log(chalk.cyan('  prd iteration new  # 开始新迭代'));
            }
        }
    }
    console.log('');
};
