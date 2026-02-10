const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const confirm = require('./confirm');
const dialog = require('./dialog');
const { runPlanFreezeChecks } = require('./freeze-checks');

/**
 * 规划管理命令 (v2.0.0)
 * 支持中文文件名：需求规划.md、规划冻结.md
 */
module.exports = async function (action, type, options = {}) {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        return;
    }

    const config = await fs.readJSON(configPath);

    if (action === 'create') {
        // 检查废弃命令
        if (type && (type.toUpperCase() === 'B1' || type.toUpperCase() === 'B2')) {
            console.log(chalk.red(`✗ 命令已废弃: prd plan create ${type.toUpperCase()}`));
            console.log(chalk.cyan('ℹ️  v2.0.0 以后，请使用: prd plan create'));
            process.exitCode = 1;
            return;
        }
        // B 参数兼容处理（静默忽略）
        await createPlanDoc(config, configPath, options);
    } else if (action === 'freeze') {
        await freezePlan(config, configPath, options);
    } else {
        console.log(chalk.red('✗ 未知操作'));
        console.log('可用操作: create, freeze');
    }
};

async function createPlanDoc(config, configPath, options = {}) {
    if (config.currentIteration === 0) {
        console.log(chalk.red('✗ 请先创建迭代'));
        console.log('运行: prd iteration new');
        return;
    }

    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
    );

    const fileName = '需求规划.md';
    const filePath = path.join(iterationDir, fileName);

    if (await fs.pathExists(filePath)) {
        console.log(chalk.yellow(`⚠ 文件已存在: ${fileName}`));
        return;
    }

    // 检查项目信息
    const projectInfoPath = path.join(process.cwd(), '00_项目总览', '项目信息.md');
    const oldP0Path = path.join(process.cwd(), '00_项目总览', 'P0_项目基本信息.md');

    if (!await fs.pathExists(projectInfoPath) && !await fs.pathExists(oldP0Path)) {
        console.log(chalk.red('✗ 请先完成项目信息'));
        console.log('文件位置: 00_项目总览/项目信息.md');
        return;
    }

    // 写入规划文档模板
    const template = getPlanningTemplate();
    await fs.writeFile(filePath, template);

    // 记录文档创建
    await dialog.logDocumentCreation('planning', '需求规划', filePath);

    console.log(chalk.green(`✓ ${fileName} 创建成功!`));
    console.log(chalk.cyan(`文件位置: ${filePath}\n`));

    console.log(chalk.bold('📋 需求规划文档包含：'));
    console.log('  1. 启动检查');
    console.log('  2. 核心问题');
    console.log('  3. 需求拆解');
    console.log('  4. PM 确认\n');

    console.log(chalk.bold('下一步:'));
    console.log('1. 与 AI 对话填写需求规划.md');
    console.log('2. 填写完成后执行: prd plan freeze');
    console.log('');
}

async function freezePlan(config, configPath, options = {}) {
    if (config.currentIteration === 0) {
        console.log(chalk.red('✗ 请先创建迭代'));
        return;
    }

    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
    );

    // 支持 --force 跳过检查
    if (options.force) {
        console.log(chalk.yellow('\n⚠️  使用 --force 跳过前置检查\n'));
    } else {
        // 执行自动检查（包含审视）
        const checkResult = await runPlanFreezeChecks(iterationDir);

        if (!checkResult.pass) {
            console.log(chalk.yellow('💡 提示：解决以上问题后重新运行 prd plan freeze'));
            console.log(chalk.gray('   或使用 prd plan freeze --force 强制跳过检查（不推荐）\n'));
            return;
        }
    }

    // 检查规划文档是否存在（支持新旧两种文件名）
    let planPath = path.join(iterationDir, '需求规划.md');
    if (!await fs.pathExists(planPath)) {
        planPath = path.join(iterationDir, 'B_规划文档.md');
    }

    if (!await fs.pathExists(planPath)) {
        console.log(chalk.red('✗ 请先创建需求规划'));
        console.log('运行: prd plan create');
        return;
    }

    // PM 确认冻结
    let pmSignature = null;
    if (options.pmConfirmed && options.pmSignature) {
        console.log(chalk.green(`✓ PM 已在对话中确认冻结，签名: ${options.pmSignature}`));
        pmSignature = options.pmSignature;
    } else {
        // 交互式确认
        pmSignature = await confirm.confirmB3Freeze();
    }

    if (!pmSignature) {
        console.log(chalk.yellow('\n根据 PM 决策，未执行冻结'));
        return;
    }

    // 读取规划文档内容，提取关键信息
    console.log(chalk.gray('正在从需求规划提取关键信息...'));

    const planContent = await fs.readFile(planPath, 'utf-8');

    // 提取核心问题
    let coreGoal = extractSection(planContent, '要解决的问题') ||
        extractSection(planContent, '核心问题') ||
        '（请手动填写，未能自动提取）';

    // 提取需求拆解范围
    let scope = extractSection(planContent, '需求拆解') ||
        extractSection(planContent, '首版范围') ||
        '（请手动填写，未能自动提取）';

    // 生成规划冻结文档
    const freezeTemplate = getFreezeTemplate(pmSignature, {
        coreGoal,
        scope
    });

    const freezePath = path.join(iterationDir, '规划冻结.md');
    await fs.writeFile(freezePath, freezeTemplate);

    // 记录 PM 决策和文档创建
    await dialog.logPMConfirmation('planning', 'freeze', 'approved',
        `PM签名: ${pmSignature}, 规划冻结`
    );
    await dialog.logDocumentCreation('planning', '规划冻结', freezePath);

    console.log(chalk.green('\n✓ 规划冻结.md 创建成功!'));
    console.log(chalk.cyan(`文件位置: ${freezePath}\n`));

    console.log(chalk.bold.green('🎉 规划已冻结!\n'));
    console.log(chalk.bold('下一步:'));
    console.log('1. 创建 IT 用户故事: prd it create <名称>');
    console.log('2. 所有 IT 完成后执行: prd version freeze');
    console.log('');
}

function getPlanningTemplate() {
    return `# 需求规划

**创建时间**: ${new Date().toLocaleString('zh-CN')}

---

> 与 AI 对话填写本文档

---

## 1. 启动检查

在开始规划前，必须确认以下三点：

- [ ] **问题真实存在** - 在代码快照/用户反馈中有证据支持
- [ ] **值得单独规划** - 不是小修小补
- [ ] **问题已理解清楚** - 不是用规划来想问题

---

## 2. 核心问题

**要解决的问题**:
<!-- 用一句话说明 -->


**期望达成的结果**:
<!-- 可衡量的目标 -->


**不做什么**:
<!-- 明确排除的范围 -->


---

## 3. 需求拆解

| ID | 需求 | 优先级 | 首版 |
|----|------|-------|-----|
| REQ-001 | | P0 | ✅ |
| REQ-002 | | P1 | ❌ |
| | | | |

---

## 4. PM 确认

- [ ] 启动检查已通过
- [ ] 核心问题已明确
- [ ] 需求拆解完整
- [ ] 首版范围已确认

**PM 签字**: ___________
**日期**: ___________
`;
}

function getFreezeTemplate(pmSignature, extractedContent = {}) {
    const {
        coreGoal = '（未提供）',
        scope = '（未提供）'
    } = extractedContent;

    return `# 规划冻结

**冻结时间**: ${new Date().toLocaleString('zh-CN')}
**PM 签名**: ${pmSignature}
**状态**: 已冻结 ✅

---

## 冻结声明

本规划已通过启动检查，正式冻结。

**冻结承诺**:
- 本轮迭代的规划目标已确定
- "不做的部分"已明确
- 后续 IT 文档必须基于此规划

---

## 1. 规划总结

### 1.1 核心问题

${coreGoal}

### 1.2 需求范围

${scope}

---

## 2. 进入 IT 阶段

**创建 IT 用户故事时应包含**:
- 基于上述规划目标
- 明确的用户故事
- 不超出本文档定义的范围

---

## 3. 冻结管理

### 3.1 修改规则

**冻结后禁止**:
- ❌ 修改规划目标
- ❌ 扩大规划范围
- ❌ 引入新的核心需求

**允许调整**:
- ✅ IT 文档中的细节描述
- ✅ 实现方案的优化
- ✅ 非核心的边界情况

### 3.2 解冻条件

**如需解冻规划**:
1. 必须说明解冻原因
2. 重新执行规划审视
3. 重新签字确认

---

**PM 最终确认**: ${pmSignature}
**冻结日期**: ${new Date().toLocaleDateString('zh-CN')}
**状态**: 🔒 已冻结
`;
}

/**
 * 从文档中提取指定标题下的内容
 */
function extractSection(content, sectionTitle) {
    const patterns = [
        new RegExp(`\\*\\*${sectionTitle}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*|\\n##|\\n---|$)`, 'i'),
        new RegExp(`###?\\s*${sectionTitle}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|\\n---|$)`, 'i'),
        new RegExp(`${sectionTitle}[:\\s]*\\n([\\s\\S]*?)(?=\\n\\*\\*|\\n##|\\n---|$)`, 'i')
    ];

    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            let extracted = match[1].trim();
            extracted = extracted.replace(/<!--[\s\S]*?-->/g, '').trim();
            extracted = extracted.replace(/_{3,}/g, '').trim();
            if (extracted.length > 5) {
                return extracted;
            }
        }
    }
    return null;
}
