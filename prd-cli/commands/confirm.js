const inquirer = require('inquirer');
const chalk = require('chalk');
const dialog = require('./dialog');

/**
 * PM 确认模块
 * 强制要求 PM 做决策，防止 AI 越权
 */

module.exports = {
    /**
     * 文档创建前确认
     */
    async confirmDocumentCreation(docType, purpose) {
        console.log(chalk.yellow('\n⚠️  PM 确认点\n'));
        console.log(chalk.bold(`准备创建文档: ${docType}`));
        console.log(`目的: ${purpose}\n`);

        console.log(chalk.cyan('【权责说明】'));
        console.log('- PM 职责: 确认是否需要创建此文档');
        console.log('- AI 职责: 提供模板和填写指引\n');

        const answer = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'proceed',
                message: '确认创建此文档？',
                default: false
            }
        ]);

        await dialog.logPMConfirmation('document', `create_${docType}`,
            answer.proceed ? 'approved' : 'rejected',
            answer.proceed ? '确认创建' : '取消创建'
        );

        return answer.proceed;
    },

    /**
     * R0 基线审视创建确认
     * ⚠️ 重要：必须由 PM 确认才能创建 R0
     */
    async confirmR0Creation() {
        console.log(chalk.bold.yellow('\n━━━ PM 决策点：R0 基线审视创建 ━━━\n'));

        console.log(chalk.cyan('【权责说明】'));
        console.log('- PM 职责: ');
        console.log('  1. 确认 A0/A1 已填写完成且内容准确');
        console.log('  2. 确认需要进行基线审视');
        console.log('  3. 对基线内容负责\n');

        console.log('- AI 职责: ');
        console.log('  1. 辅助执行审视');
        console.log('  2. 梳理用户路径');
        console.log('  3. 识别问题和机会\n');

        console.log(chalk.red('- AI 禁止: '));
        console.log('  ❌ 在未经 PM 确认的情况下创建 R0');
        console.log('  ❌ R0 完成后自动创建后续文档\n');

        const checks = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'baselineReady',
                message: '确认 A0、A1 基线文档已填写完成？',
                default: false
            },
            {
                type: 'confirm',
                name: 'proceedR0',
                message: 'PM 确认：现在开始 R0 基线审视？',
                default: false
            }
        ]);

        if (!checks.baselineReady || !checks.proceedR0) {
            await dialog.logPMConfirmation('r0_baseline', 'create_r0', 'rejected',
                `基线就绪:${checks.baselineReady}, PM确认:${checks.proceedR0}`
            );
            return false;
        }

        await dialog.logPMConfirmation('r0_baseline', 'create_r0', 'approved',
            'PM确认基线文档已完成，开始R0审视'
        );

        return true;
    },

    /**
     * R1 启动条件确认
     */
    async confirmR1Start() {
        console.log(chalk.bold.yellow('\n━━━ PM 决策点：R1 启动条件检查 ━━━\n'));

        console.log(chalk.cyan('【权责说明】'));
        console.log('- PM 职责: 判断是否满足三个启动条件（不可替代）');
        console.log('- AI 职责: 帮助校验，但不得替 PM 做"值得做"的判断\n');

        console.log(chalk.bold('请 PM 确认以下三个条件:\n'));

        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'condition1',
                message: '条件1: 问题是否真实存在（可在A类文档中找到依据）？',
                choices: [
                    { name: '✓ 满足 - 问题真实存在', value: true },
                    { name: '✗ 不满足 - 问题不够明确', value: false }
                ]
            },
            {
                type: 'list',
                name: 'condition2',
                message: '条件2: 是否值得单独一轮规划（不是小修小补）？',
                choices: [
                    { name: '✓ 满足 - 值得独立规划', value: true },
                    { name: '✗ 不满足 - 不需要独立规划', value: false }
                ]
            },
            {
                type: 'list',
                name: 'condition3',
                message: '条件3: 问题是否已理解清楚（边界明确）？',
                choices: [
                    { name: '✓ 满足 - 边界清晰', value: true },
                    { name: '✗ 不满足 - 还需要进一步理解', value: false }
                ]
            }
        ]);

        const allPassed = answers.condition1 && answers.condition2 && answers.condition3;

        if (!allPassed) {
            console.log(chalk.red('\n✗ 启动条件未全部满足\n'));
            console.log(chalk.yellow('根据规范，必须三个条件全部满足才能开始规划'));

            await dialog.logPMConfirmation('r1_start', 'check_conditions', 'rejected',
                `条件1:${answers.condition1}, 条件2:${answers.condition2}, 条件3:${answers.condition3}`
            );

            return false;
        }

        console.log(chalk.green('\n✓ 三个条件全部满足\n'));

        const finalConfirm = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'proceed',
                message: 'PM 最终确认：是否开启本轮规划？',
                default: true
            }
        ]);

        await dialog.logPMConfirmation('r1_start', 'final_decision',
            finalConfirm.proceed ? 'approved' : 'rejected',
            `PM决定${finalConfirm.proceed ? '开启' : '不开启'}规划`
        );

        return finalConfirm.proceed;
    },

    /**
     * R1 规划审视前确认
     */
    async confirmR1Review() {
        console.log(chalk.bold.yellow('\n━━━ 关键提醒：R1 规划审视的角色分工 ━━━\n'));

        console.log(chalk.cyan('【权责说明】'));
        console.log('- PM 职责: ');
        console.log('  1. 已完成 B1、B2 的填写（这是PM的责任）');
        console.log('  2. 给出最终结论：通过/不通过');
        console.log('  3. 对"是否冻结规划"负责\n');

        console.log('- AI 职责: ');
        console.log('  1. 按5个维度进行审视');
        console.log('  2. 指出问题和风险');
        console.log('  3. 给出结构化审视意见\n');

        console.log(chalk.red('- AI 禁止: '));
        console.log('  1. ❌ 替 PM 填写 B1、B2 内容');
        console.log('  2. ❌ 自行判定"可以冻结"');
        console.log('  3. ❌ 越权做任何决策\n');

        const checks = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'b1b2Ready',
                message: '确认 B1、B2 已由 PM 填写完成（非 AI 代填）？',
                default: false
            },
            {
                type: 'confirm',
                name: 'understand',
                message: '确认理解：AI 只审视，最终决策由 PM 做？',
                default: false
            }
        ]);

        if (!checks.b1b2Ready || !checks.understand) {
            console.log(chalk.red('\n✗ 前置条件未满足，无法进行 R1 审视\n'));

            await dialog.logPMConfirmation('r1_review', 'pre_check', 'rejected',
                `B1B2就绪:${checks.b1b2Ready}, 理解分工:${checks.understand}`
            );

            return false;
        }

        await dialog.logPMConfirmation('r1_review', 'pre_check', 'approved',
            'PM确认B1B2已填写完成，理解角色分工'
        );

        return true;
    },

    /**
     * R2 版本审视前确认
     */
    async confirmR2Review() {
        console.log(chalk.bold.yellow('\n━━━ 关键提醒：R2 版本审视的角色分工 ━━━\n'));

        console.log(chalk.cyan('【权责说明】'));
        console.log('- PM 职责: ');
        console.log('  1. 对"是否背叛规划"负责');
        console.log('  2. 给出最终放行/否决\n');

        console.log('- AI 职责: ');
        console.log('  1. 做一致性比对');
        console.log('  2. 标出偏移点');
        console.log('  3. 给出审视报告\n');

        console.log(chalk.red('- AI 禁止: '));
        console.log('  1. ❌ 替 PM 填写 C0、C1 内容');
        console.log('  2. ❌ 替 PM 放行版本');
        console.log('  3. ❌ 隐瞒与B3的不一致\n');

        const checks = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'c0c1Ready',
                message: '确认 C0、C1 已由 PM 填写完成？',
                default: false
            },
            {
                type: 'confirm',
                name: 'understand',
                message: '确认理解：AI 只做一致性检查，不替PM放行？',
                default: false
            }
        ]);

        if (!checks.c0c1Ready || !checks.understand) {
            console.log(chalk.red('\n✗ 前置条件未满足\n'));

            await dialog.logPMConfirmation('r2_review', 'pre_check', 'rejected',
                `C0C1就绪:${checks.c0c1Ready}, 理解分工:${checks.understand}`
            );

            return false;
        }

        await dialog.logPMConfirmation('r2_review', 'pre_check', 'approved',
            'PM确认C0C1已填写完成，理解角色分工'
        );

        return true;
    },

    /**
     * B3 冻结前确认
     */
    async confirmB3Freeze() {
        console.log(chalk.bold.yellow('\n━━━ PM 决策点：B3 规划冻结 ━━━\n'));

        console.log(chalk.cyan('【权责说明】'));
        console.log('- PM 职责（必须由人签名）:');
        console.log('  1. 确认规划正式成立');
        console.log('  2. 承担规划决策责任');
        console.log('  3. 对"不做的部分"负责\n');

        console.log('- AI 职责:');
        console.log('  1. 检查冻结条件是否满足');
        console.log('  2. 引用 R1 结论');
        console.log('  3. 标注未解决问题\n');

        console.log(chalk.red('- AI 禁止:'));
        console.log('  ❌ 单方面宣布冻结\n');

        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'signature',
                message: 'PM 签名确认（输入你的名字）:',
                validate: (input) => input.trim().length > 0 || '必须输入签名'
            },
            {
                type: 'confirm',
                name: 'confirmed',
                message: '确认承担规划决策责任，执行冻结？',
                default: false
            }
        ]);

        await dialog.logPMConfirmation('b3_freeze', 'freeze_decision',
            answer.confirmed ? 'approved' : 'rejected',
            `PM签名: ${answer.signature}`
        );

        if (answer.confirmed) {
            return answer.signature;
        }

        return false;
    },

    /**
     * C3 冻结前确认
     */
    async confirmC3Freeze() {
        console.log(chalk.bold.yellow('\n━━━ PM 决策点：C3 版本冻结 ━━━\n'));

        console.log(chalk.cyan('【权责说明】'));
        console.log('- PM 职责（最终责任人）:');
        console.log('  1. 对版本需求最终负责');
        console.log('  2. 对外承诺的唯一依据\n');

        console.log('- AI 职责:');
        console.log('  1. 校验冻结条件');
        console.log('  2. 生成冻结记录');
        console.log('  3. 阻止后续修改\n');

        console.log(chalk.red('- AI 禁止:'));
        console.log('  ❌ 在冻结后继续生成需求\n');

        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'signature',
                message: 'PM 签名确认（输入你的名字）:',
                validate: (input) => input.trim().length > 0 || '必须输入签名'
            },
            {
                type: 'confirm',
                name: 'confirmed',
                message: '确认对版本需求最终负责，执行冻结？',
                default: false
            }
        ]);

        await dialog.logPMConfirmation('c3_freeze', 'freeze_decision',
            answer.confirmed ? 'approved' : 'rejected',
            `PM签名: ${answer.signature}`
        );

        if (answer.confirmed) {
            return answer.signature;
        }

        return false;
    }
};
