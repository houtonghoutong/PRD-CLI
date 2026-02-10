/**
 * freeze-checks.js
 * 
 * freeze 命令的前置检查模块
 * 将 R1/R2 审视集成到 freeze 流程中
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * 执行 B3 冻结前的所有检查
 * @param {string} iterationDir - 迭代目录路径
 * @returns {Object} { pass: boolean, results: Array, summary: string }
 */
async function runPlanFreezeChecks(iterationDir) {
    const results = [];

    console.log(chalk.bold('\n📋 B3 规划冻结前置检查\n'));
    console.log(chalk.gray('─'.repeat(50)));

    // ===== 阶段 1: 文档存在性检查 =====
    console.log(chalk.bold('\n📁 文档存在性检查\n'));

    const bPlanPath = path.join(iterationDir, 'B_规划文档.md');
    const bPlanExists = await fs.pathExists(bPlanPath);

    results.push({
        category: '文档存在性',
        item: 'B_规划文档.md',
        pass: bPlanExists,
        message: bPlanExists ? '文件存在' : '文件不存在，请运行 prd plan create B'
    });

    printCheckResult('B_规划文档.md', bPlanExists);

    // 如果文档不存在，提前返回
    if (!bPlanExists) {
        return {
            pass: false,
            results,
            summary: '文档不完整，无法继续检查'
        };
    }

    // ===== 阶段 2: 必填项检查 =====
    console.log(chalk.bold('\n📝 必填项检查\n'));

    const bPlanContent = await fs.readFile(bPlanPath, 'utf-8');

    // B_规划文档 必填项检查
    const bPlanChecks = [
        { field: '启动检查', pattern: /\[x\].*问题真实存在/i },
        { field: '核心问题', pattern: /要解决的问题[\s\S]*?(?=\n##|\n---|$)/i },
        { field: '需求拆解', pattern: /REQ-\d{3}/i },
        { field: 'PM 确认', pattern: /\[x\].*核心问题已明确/i }
    ];

    for (const check of bPlanChecks) {
        const match = bPlanContent.match(check.pattern);
        const hasContent = match && (check.pattern.toString().includes('[x]') ? true : match[0].length > 30);
        results.push({
            category: '必填项',
            item: `B - ${check.field}`,
            pass: hasContent,
            message: hasContent ? '已填写' : `请在 B_规划文档 中完成「${check.field}」`
        });
        printCheckResult(`B - ${check.field}`, hasContent);
    }

    // ===== 阶段 3: R1 审视（5 维度） =====
    console.log(chalk.bold('\n📊 R1 规划审视（5 维度）\n'));

    const r1Checks = await runR1Review(b1Content, b2Content, iterationDir);
    results.push(...r1Checks);

    for (const check of r1Checks) {
        printCheckResult(check.item, check.pass, check.message);
    }

    // ===== 汇总结果 =====
    console.log(chalk.gray('\n' + '─'.repeat(50)));

    const failures = results.filter(r => !r.pass);
    const pass = failures.length === 0;

    let summary;
    if (pass) {
        summary = '所有检查通过，可以执行冻结';
        console.log(chalk.bold.green('\n✅ ' + summary + '\n'));
    } else {
        summary = `${failures.length} 项检查未通过`;
        console.log(chalk.bold.red(`\n❌ ${summary}\n`));
        console.log(chalk.yellow('未通过的检查项：\n'));
        failures.forEach(f => {
            console.log(`  ⚠️  ${f.item}`);
            console.log(chalk.gray(`      ${f.message}\n`));
        });
    }

    return { pass, results, summary };
}

/**
 * 执行 R1 审视（5 维度）
 */
async function runR1Review(b1Content, b2Content, iterationDir) {
    const results = [];

    // 读取 A 类文档用于对比
    const baselineDir = path.join(path.dirname(iterationDir), '..', '01_产品基线');
    let a2Content = '';
    try {
        const a2Path = path.join(baselineDir, 'A2_存量反馈与数据汇总.md');
        if (await fs.pathExists(a2Path)) {
            a2Content = await fs.readFile(a2Path, 'utf-8');
        }
    } catch (e) {
        // 忽略读取错误
    }

    // 1. 目标清晰性
    const hasGoal = /要解决的核心问题[\s\S]{20,}/.test(b1Content);
    const hasMeasurable = /成功标准[\s\S]*?(提升|降低|达到|\d+%)/.test(b1Content);
    results.push({
        category: 'R1审视',
        item: '1. 目标清晰性',
        pass: hasGoal,
        message: hasGoal
            ? (hasMeasurable ? '目标明确且可衡量' : '目标明确，建议补充可衡量指标')
            : '请在 B1 中明确描述核心问题'
    });

    // 2. 场景真实性
    const hasScenario = /场景\d|触发条件|用户目标/.test(b1Content);
    const hasA2Reference = /A2|用户反馈|真实反馈/.test(b1Content);
    results.push({
        category: 'R1审视',
        item: '2. 场景真实性',
        pass: hasScenario,
        message: hasScenario
            ? (hasA2Reference ? '场景真实，有用户反馈支撑' : '场景已描述，建议关联 A2 用户反馈')
            : '请在 B1 中描述具体使用场景'
    });

    // 3. 现状一致性
    const hasA1Reference = /A1|A0|现有功能|已上线/.test(b1Content);
    results.push({
        category: 'R1审视',
        item: '3. 现状一致性',
        pass: hasA1Reference,
        message: hasA1Reference
            ? '规划与现状文档一致'
            : '建议在 B1 中引用 A0/A1 说明现状依据'
    });

    // 4. 范围收敛性
    const hasNotDo = /不包含|明确不做|不做/.test(b1Content);
    const hasScope = /首版包含|进入首版/.test(b2Content);
    const hasPriority = /P0|P1|P2/.test(b2Content);
    const scopePass = hasNotDo && hasScope && hasPriority;
    results.push({
        category: 'R1审视',
        item: '4. 范围收敛性',
        pass: scopePass,
        message: scopePass
            ? '范围边界清晰'
            : `请确保：${!hasNotDo ? '说明不做什么、' : ''}${!hasScope ? '明确首版范围、' : ''}${!hasPriority ? '标注优先级' : ''}`
    });

    // 5. 版本化准备度
    const hasRequirements = (b2Content.match(/需求项 #\d/g) || []).length;
    const canVersion = hasRequirements >= 1 && hasScope;
    results.push({
        category: 'R1审视',
        item: '5. 版本化准备度',
        pass: canVersion,
        message: canVersion
            ? `可拆分为版本，共 ${hasRequirements} 个需求项`
            : '请在 B2 中拆分需求项并标注首版范围'
    });

    return results;
}

/**
 * 执行 C3 冻结前的所有检查
 */
/**
 * 执行 C3 冻结前的所有检查
 */
async function runVersionFreezeChecks(iterationDir) {
    const results = [];

    console.log(chalk.bold('\n📋 C3 版本冻结前置检查 (自动 R2 审视)\n'));
    console.log(chalk.gray('─'.repeat(50)));

    // ===== 阶段 1: IT 完整性检查 =====
    console.log(chalk.bold('\n📁 IT 文档检查\n'));

    const b3Path = path.join(iterationDir, 'B3_规划冻结归档.md');
    const itDir = path.join(iterationDir, 'IT');

    const b3Exists = await fs.pathExists(b3Path);
    let itExists = await fs.pathExists(itDir);
    let itFolders = [];

    if (itExists) {
        const items = await fs.readdir(itDir);
        itFolders = items.filter(name => name.startsWith('IT-'));
        if (itFolders.length === 0) {
            itExists = false;
        }
    }

    results.push({
        category: '文档准备',
        item: 'B3_规划冻结归档.md',
        pass: b3Exists,
        message: b3Exists ? '规划已冻结' : '请先执行 prd plan freeze'
    });

    results.push({
        category: '文档准备',
        item: 'IT 用户故事',
        pass: itExists,
        message: itExists ? `发现 ${itFolders.length} 个 IT 故事` : '请先运行 prd it create 创建用户故事'
    });

    printCheckResult('B3_规划冻结归档.md', b3Exists);
    printCheckResult('IT 用户故事', itExists, itExists ? `共 ${itFolders.length} 个` : '目录为空或不存在');

    if (!b3Exists || !itExists) {
        return {
            pass: false,
            results,
            summary: '文档不完整，无法继续检查'
        };
    }

    // 检查每个 IT 的文件完整性
    let allFilesCompleted = true;
    for (const folder of itFolders) {
        const itPath = path.join(itDir, folder);
        const itId = folder.split('-').slice(0, 2).join('-');
        const bizPath = path.join(itPath, `${itId}-BIZ.md`);
        const devPath = path.join(itPath, `${itId}-DEV.md`);

        // 检查 BIZ
        if (await fs.pathExists(bizPath)) {
            const content = await fs.readFile(bizPath, 'utf-8');
            const isDefault = content.includes('[用户角色]');
            if (isDefault) {
                allFilesCompleted = false;
                results.push({ category: 'IT完整性', item: `${itId}-BIZ`, pass: false, message: '文件待填写' });
                printCheckResult(`${itId}-BIZ.md`, false, '文件包含默认模板内容');
            }
        } else {
            allFilesCompleted = false;
            results.push({ category: 'IT完整性', item: `${itId}-BIZ`, pass: false, message: '文件缺失' });
            printCheckResult(`${itId}-BIZ.md`, false, '文件不存在');
        }

        // 检查 DEV
        if (await fs.pathExists(devPath)) {
            const content = await fs.readFile(devPath, 'utf-8');
            const isDefault = content.includes('<!-- 从 BIZ 复制 -->');
            if (isDefault) {
                allFilesCompleted = false;
                results.push({ category: 'IT完整性', item: `${itId}-DEV`, pass: false, message: '文件待填写' });
                printCheckResult(`${itId}-DEV.md`, false, '文件包含默认模板内容');
            }
        } else {
            allFilesCompleted = false;
            results.push({ category: 'IT完整性', item: `${itId}-DEV`, pass: false, message: '文件缺失' });
            printCheckResult(`${itId}-DEV.md`, false, '文件不存在');
        }
    }

    if (!allFilesCompleted) {
        return {
            pass: false,
            results,
            summary: 'IT 文档未填写完整'
        };
    }

    // ===== 阶段 2: R2 审视（5 维度） =====
    console.log(chalk.bold('\n📊 R2 版本审视（5 维度）\n'));

    // 读取所有 IT 内容汇总
    let allBizContent = '';
    let allDevContent = '';
    let hasUI = false;

    for (const folder of itFolders) {
        const itPath = path.join(itDir, folder);
        const itId = folder.split('-').slice(0, 2).join('-');

        allBizContent += await fs.readFile(path.join(itPath, `${itId}-BIZ.md`), 'utf-8') + '\n';
        allDevContent += await fs.readFile(path.join(itPath, `${itId}-DEV.md`), 'utf-8') + '\n';

        // 检查是否有 UI 原型文件
        const uiDir = path.join(itPath, 'UI原型');
        if (await fs.pathExists(uiDir)) {
            const uis = await fs.readdir(uiDir);
            if (uis.some(f => f.endsWith('.json') || f.endsWith('.html'))) {
                hasUI = true;
            }
        }
    }

    const b3Content = await fs.readFile(b3Path, 'utf-8');
    const r2Checks = await runR2Review(b3Content, allBizContent, allDevContent, hasUI);
    results.push(...r2Checks);

    for (const check of r2Checks) {
        printCheckResult(check.item, check.pass, check.message);
    }

    // ===== 汇总结果 =====
    console.log(chalk.gray('\n' + '─'.repeat(50)));

    const failures = results.filter(r => !r.pass);
    const pass = failures.length === 0;

    let summary;
    if (pass) {
        summary = '所有检查通过，可以执行冻结';
        console.log(chalk.bold.green('\n✅ ' + summary + '\n'));
    } else {
        summary = `${failures.length} 项检查未通过`;
        console.log(chalk.bold.red(`\n❌ ${summary}\n`));
        console.log(chalk.yellow('未通过的检查项：\n'));
        failures.forEach(f => {
            console.log(`  ⚠️  ${f.item}`);
            console.log(chalk.gray(`      ${f.message}\n`));
        });
    }

    return { pass, results, summary };
}

/**
 * 执行 R2 审视（5 维度）
 * 针对 IT 架构
 */
async function runR2Review(b3Content, allBizContent, allDevContent, hasUI) {
    const results = [];

    // 1. 版本目标一致性
    // 检查 BIZ 中是否包含场景描述
    const hasScenario = /### 场景|触发条件/i.test(allBizContent);
    results.push({
        category: 'R2审视',
        item: '1. 业务场景闭环',
        pass: hasScenario,
        message: hasScenario ? '已定义业务场景' : '请在 BIZ 文档中描述具体应用场景'
    });

    // 2. 范围偏移检查
    // 检查是否有关联 B3 的痕迹
    const hasTrace = /关联 BIZ|来源追溯/i.test(allDevContent) || /来源/i.test(allBizContent);
    results.push({
        category: 'R2审视',
        item: '2. 规划范围一致性',
        pass: hasTrace,
        message: hasTrace ? '已包含来源追溯' : '建议在文档中明确与 B3 的关联'
    });

    // 3. 规划覆盖完整性
    const hasAcceptance = /验收标准|### 4\. 验收/i.test(allBizContent);
    results.push({
        category: 'R2审视',
        item: '3. 验收标准完整性',
        pass: hasAcceptance,
        message: hasAcceptance ? '已定义验收标准' : '请在 BIZ 文档中完善验收标准'
    });

    // 4. 需求粒度成熟度
    const hasDetail = /功能描述|交互规则|状态变化/i.test(allDevContent);
    const hasBoundary = /边界|异常|特殊情况/i.test(allBizContent + allDevContent);
    results.push({
        category: 'R2审视',
        item: '4. 细节与边界',
        pass: hasDetail,
        message: hasDetail
            ? (hasBoundary ? '细节与边界定义完整' : '有功能描述，建议补充边界/异常情况')
            : '请在 DEV 文档中完善功能细节'
    });

    // 5. 进入执行准备度
    // IT 架构下，UI 原型是加分项，但 DEV 必须有
    const isReady = hasDetail && hasAcceptance;
    results.push({
        category: 'R2审视',
        item: '5. 开发就绪状态',
        pass: isReady,
        // message: `${hasUI ? '包含 UI 原型，' : ''}技术规格已就绪`
        message: isReady ? '技术规格已就绪' : '请确保完善验收标准和功能细节'
    });

    return results;
}

/**
 * 打印检查结果
 */
function printCheckResult(item, pass, detail = '') {
    const icon = pass ? chalk.green('✓') : chalk.red('✗');
    const status = pass ? chalk.green('通过') : chalk.red('未通过');
    console.log(`  ${icon} ${item}: ${status}`);
    if (detail && !pass) {
        console.log(chalk.gray(`     → ${detail}`));
    }
}

module.exports = {
    runPlanFreezeChecks,
    runVersionFreezeChecks,
    runR1Review,
    runR2Review
};
