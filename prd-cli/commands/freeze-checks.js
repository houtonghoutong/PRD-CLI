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

    const b1Path = path.join(iterationDir, 'B1_需求规划草案.md');
    const b2Path = path.join(iterationDir, 'B2_规划拆解与范围界定.md');

    const b1Exists = await fs.pathExists(b1Path);
    const b2Exists = await fs.pathExists(b2Path);

    results.push({
        category: '文档存在性',
        item: 'B1_需求规划草案.md',
        pass: b1Exists,
        message: b1Exists ? '文件存在' : '文件不存在，请运行 prd plan create B1'
    });

    results.push({
        category: '文档存在性',
        item: 'B2_规划拆解与范围界定.md',
        pass: b2Exists,
        message: b2Exists ? '文件存在' : '文件不存在，请运行 prd plan create B2'
    });

    printCheckResult('B1_需求规划草案.md', b1Exists);
    printCheckResult('B2_规划拆解与范围界定.md', b2Exists);

    // 如果文档不存在，提前返回
    if (!b1Exists || !b2Exists) {
        return {
            pass: false,
            results,
            summary: '文档不完整，无法继续检查'
        };
    }

    // ===== 阶段 2: 必填项检查 =====
    console.log(chalk.bold('\n📝 必填项检查\n'));

    const b1Content = await fs.readFile(b1Path, 'utf-8');
    const b2Content = await fs.readFile(b2Path, 'utf-8');

    // B1 必填项检查
    const b1Checks = [
        { field: '规划目标', pattern: /要解决的核心问题[\s\S]*?(?=\n##|\n---|$)/i },
        { field: '不做什么', pattern: /本轮规划不包含[\s\S]*?(?=\n##|\n---|$)/i },
        { field: '问题来源', pattern: /问题来源[\s\S]*?\[x\]/i }
    ];

    for (const check of b1Checks) {
        const match = b1Content.match(check.pattern);
        const hasContent = match && match[0].length > 50 && !match[0].includes('<!-- 填写');
        results.push({
            category: '必填项',
            item: `B1 - ${check.field}`,
            pass: hasContent,
            message: hasContent ? '已填写' : `请在 B1 中填写「${check.field}」`
        });
        printCheckResult(`B1 - ${check.field}`, hasContent);
    }

    // B2 必填项检查
    const b2Checks = [
        { field: '需求清单', pattern: /需求项 #\d/i },
        { field: '优先级排序', pattern: /P0.*必须做|P1.*重要/i },
        { field: '首版范围', pattern: /首版包含[\s\S]*?需求项/i }
    ];

    for (const check of b2Checks) {
        const hasContent = check.pattern.test(b2Content);
        results.push({
            category: '必填项',
            item: `B2 - ${check.field}`,
            pass: hasContent,
            message: hasContent ? '已填写' : `请在 B2 中填写「${check.field}」`
        });
        printCheckResult(`B2 - ${check.field}`, hasContent);
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
async function runVersionFreezeChecks(iterationDir) {
    const results = [];

    console.log(chalk.bold('\n📋 C3 版本冻结前置检查\n'));
    console.log(chalk.gray('─'.repeat(50)));

    // ===== 阶段 1: 文档存在性检查 =====
    console.log(chalk.bold('\n📁 文档存在性检查\n'));

    const b3Path = path.join(iterationDir, 'B3_规划冻结归档.md');
    const c1Path = path.join(iterationDir, 'C1_版本需求清单.md');

    const b3Exists = await fs.pathExists(b3Path);
    const c1Exists = await fs.pathExists(c1Path);

    results.push({
        category: '文档存在性',
        item: 'B3_规划冻结归档.md',
        pass: b3Exists,
        message: b3Exists ? '规划已冻结' : '请先执行 prd plan freeze'
    });

    results.push({
        category: '文档存在性',
        item: 'C1_版本需求清单.md',
        pass: c1Exists,
        message: c1Exists ? '文件存在' : '请运行 prd version create C1'
    });

    printCheckResult('B3_规划冻结归档.md', b3Exists);
    printCheckResult('C1_版本需求清单.md', c1Exists);

    if (!b3Exists || !c1Exists) {
        return {
            pass: false,
            results,
            summary: '文档不完整，无法继续检查'
        };
    }

    // ===== 阶段 2: R2 审视（5 维度） =====
    console.log(chalk.bold('\n📊 R2 版本审视（5 维度）\n'));

    const b3Content = await fs.readFile(b3Path, 'utf-8');
    const c1Content = await fs.readFile(c1Path, 'utf-8');

    // 可选：读取 C0
    let c0Content = '';
    const c0Path = path.join(iterationDir, 'C0_版本范围声明.md');
    if (await fs.pathExists(c0Path)) {
        c0Content = await fs.readFile(c0Path, 'utf-8');
    }

    const r2Checks = await runR2Review(b3Content, c0Content, c1Content);
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
 */
async function runR2Review(b3Content, c0Content, c1Content) {
    const results = [];

    // 1. 版本目标一致性
    const hasVersionGoal = /版本目标|本版本/.test(c0Content + c1Content);
    results.push({
        category: 'R2审视',
        item: '1. 版本目标一致性',
        pass: hasVersionGoal,
        message: hasVersionGoal
            ? '版本目标已定义'
            : '请在 C0/C1 中明确版本目标'
    });

    // 2. 范围偏移检查
    // 简化检查：确保 C1 中没有引入 B3 范围外的新需求
    const c1HasReq = /REQ-\d+|需求项/.test(c1Content);
    results.push({
        category: 'R2审视',
        item: '2. 范围偏移检查',
        pass: c1HasReq,
        message: c1HasReq
            ? '需求项已定义，请人工确认未超出 B3 范围'
            : '请在 C1 中定义需求项'
    });

    // 3. 规划覆盖完整性
    const hasAcceptance = /验收标准|验收条件/.test(c1Content);
    results.push({
        category: 'R2审视',
        item: '3. 规划覆盖完整性',
        pass: hasAcceptance,
        message: hasAcceptance
            ? '验收标准已定义'
            : '请在 C1 中为每个需求定义验收标准'
    });

    // 4. 需求粒度成熟度
    const hasDetail = /功能描述|详细描述|业务规则/.test(c1Content);
    const hasBoundary = /边界|异常|特殊情况/.test(c1Content);
    results.push({
        category: 'R2审视',
        item: '4. 需求粒度成熟度',
        pass: hasDetail,
        message: hasDetail
            ? (hasBoundary ? '需求描述详细且有边界定义' : '需求有描述，建议补充边界情况')
            : '请在 C1 中详细描述每个需求'
    });

    // 5. 进入执行准备度
    const reqCount = (c1Content.match(/REQ-\d+|### 需求/g) || []).length;
    const isReady = reqCount >= 1 && hasAcceptance;
    results.push({
        category: 'R2审视',
        item: '5. 进入执行准备度',
        pass: isReady,
        message: isReady
            ? `共 ${reqCount} 个需求，可进入开发`
            : '请确保所有需求都有验收标准'
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
