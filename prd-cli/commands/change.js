const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const dialog = require('./dialog');

/**
 * 需求变更命令
 * 自动判断当前项目状态，引导用户正确记录变更
 */
module.exports = async function () {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        console.log('请先运行: prd init <项目名>');
        return;
    }

    const config = await fs.readJSON(configPath);

    if (config.currentIteration === 0) {
        console.log(chalk.red('✗ 还没有开始任何迭代'));
        console.log('请先运行: prd iteration new');
        return;
    }

    console.log(chalk.bold.blue('\n━━━ 需求变更检查 ━━━\n'));

    // 检查当前迭代的文档状态
    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
    );

    const c3Path = path.join(iterationDir, 'C3_版本冻结归档.md');
    const c1Path = path.join(iterationDir, 'C1_版本需求清单.md');
    const c0Path = path.join(iterationDir, 'C0_版本范围声明.md');
    const b3Path = path.join(iterationDir, 'B3_规划冻结归档.md');
    const b2Path = path.join(iterationDir, 'B2_规划拆解与范围界定.md');
    const b1Path = path.join(iterationDir, 'B1_需求规划草案.md');

    const hasC3 = await fs.pathExists(c3Path);
    const hasC1 = await fs.pathExists(c1Path);
    const hasC0 = await fs.pathExists(c0Path);
    const hasB3 = await fs.pathExists(b3Path);
    const hasB2 = await fs.pathExists(b2Path);
    const hasB1 = await fs.pathExists(b1Path);

    console.log(chalk.gray('当前文档状态:'));
    console.log(`  B1: ${hasB1 ? '✅' : '❌'}  B2: ${hasB2 ? '✅' : '❌'}  B3: ${hasB3 ? '✅' : '❌'}`);
    console.log(`  C0: ${hasC0 ? '✅' : '❌'}  C1: ${hasC1 ? '✅' : '❌'}  C3: ${hasC3 ? '✅' : '❌'}`);
    console.log('');

    // 根据状态给出不同的引导
    if (hasC3) {
        // 版本已冻结，需要创建 C2 记录变更
        console.log(chalk.yellow('⚠️  版本已冻结 (C3 已存在)'));
        console.log(chalk.bold('\n这种情况下的变更需要：'));
        console.log('1. 创建 C2_版本变更说明.md 记录变更');
        console.log('2. 评估变更对版本目标的影响');
        console.log('3. 如果变更较大，可能需要重新执行 R2 审视\n');

        const answer = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'createC2',
                message: '是否创建 C2 记录此次变更？',
                default: true
            }
        ]);

        if (answer.createC2) {
            // 调用 version 模块创建 C2
            const version = require('./version');
            await version('create', 'C2', {});

            // 记录到对话归档
            await dialog.logDialog('change', 'create_c2', {
                type: 'change_request',
                stage: 'after_c3_freeze',
                action: '创建 C2 记录变更'
            });
        }

    } else if (hasC1 || hasC0) {
        // 在 C 阶段但未冻结
        console.log(chalk.yellow('⚠️  当前在 C 阶段（版本需求阶段）'));
        console.log(chalk.bold('\n根据规范，C 阶段禁止新增规划外的需求。\n'));

        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'changeType',
                message: '您的变更属于哪种类型？',
                choices: [
                    { name: '细化现有需求（补充验收标准/边界情况）- 允许', value: 'refine' },
                    { name: '新增规划外需求 - 禁止，需解冻 B3', value: 'new_requirement' },
                    { name: '调整需求优先级 - 需记录并评估', value: 'priority' },
                    { name: '删除/裁剪需求 - 需记录并评估', value: 'remove' }
                ]
            }
        ]);

        if (answer.changeType === 'refine') {
            console.log(chalk.green('\n✓ 细化现有需求是允许的'));
            console.log('请直接修改 C1_版本需求清单.md');
            console.log('修改后建议重新执行 R2 审视: prd review r2\n');
        } else if (answer.changeType === 'new_requirement') {
            console.log(chalk.red('\n✗ C 阶段禁止新增规划外需求！\n'));
            console.log('您有两个选择：');
            console.log('1. 将新需求放入下一轮迭代的 B1 规划');
            console.log('2. 解冻当前 B3，重新走 R1 审视流程\n');
            console.log(chalk.yellow('建议：如果不是紧急需求，推荐放入下一轮迭代。'));
        } else {
            console.log(chalk.yellow('\n⚠️  此类变更需要记录'));
            console.log('1. 先在 C1 中做相应修改');
            console.log('2. 重新执行 R2 审视: prd review r2');
            console.log('3. 如果已有 C3，需要创建 C2 记录变更\n');
        }

        // 记录到对话归档
        await dialog.logDialog('change', 'change_request', {
            type: 'change_request',
            stage: 'c_phase',
            changeType: answer.changeType
        });

    } else if (hasB3) {
        // B3 已冻结，正准备进入 C 阶段
        console.log(chalk.yellow('⚠️  规划已冻结 (B3 已存在)，尚未开始版本需求'));
        console.log(chalk.bold('\n如果需要变更规划，您需要：'));
        console.log('1. 解冻 B3（删除 B3 文件）');
        console.log('2. 修改 B1/B2');
        console.log('3. 重新执行 R1 审视');
        console.log('4. 重新冻结 B3\n');
        console.log(chalk.yellow('建议：除非必要，不建议解冻已冻结的规划。'));

    } else if (hasB1 || hasB2) {
        // 还在规划阶段
        console.log(chalk.green('✓ 当前在规划阶段（B1/B2），可以自由调整'));
        console.log('\n直接修改 B1 或 B2 即可，无需特殊流程。');
        console.log('修改后需要重新执行 R1 审视: prd review r1\n');

    } else {
        // 还没开始
        console.log(chalk.green('✓ 当前迭代刚开始，可以自由规划'));
        console.log('\n请先创建 B1: prd plan create B1\n');
    }
};
