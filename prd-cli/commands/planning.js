const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const confirm = require('./confirm');
const dialog = require('./dialog');
const { runPlanFreezeChecks } = require('./freeze-checks');

module.exports = async function (action, type, options = {}) {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        return;
    }

    const config = await fs.readJSON(configPath);

    if (action === 'create') {
        await createPlanDoc(type, config, configPath, options);
    } else if (action === 'freeze') {
        await freezePlan(config, configPath, options);
    } else {
        console.log(chalk.red('✗ 未知操作'));
        console.log('可用操作: create B1|B2, freeze');
    }
};

async function createPlanDoc(type, config, configPath, options = {}) {
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

    const templates = {
        'B1': getB1Template(),
        'B2': getB2Template()
    };

    if (!templates[type]) {
        console.log(chalk.red(`✗ 未知的文档类型: ${type}`));
        console.log('可用类型: B1, B2');
        return;
    }

    const fileName = getFileName(type);
    const filePath = path.join(iterationDir, fileName);

    if (await fs.pathExists(filePath)) {
        console.log(chalk.yellow(`⚠ 文件已存在: ${fileName}`));
        return;
    }

    // B1 需要强制 PM 确认 R1 启动条件
    if (type === 'B1') {
        // ⭐ 首先检查 A 类基线文档是否完整
        const baselineDir = path.join(process.cwd(), '01_产品基线');
        const a0Path = path.join(baselineDir, 'A0_产品基础与范围说明.md');
        const a1Path = path.join(baselineDir, 'A1_已上线功能与流程清单.md'); // 修正文件名
        const a2Path = path.join(baselineDir, 'A2_存量反馈与数据汇总.md'); // 修正文件名

        const missingDocs = [];
        if (!await fs.pathExists(a0Path)) missingDocs.push('A0_产品基础与范围说明');
        if (!await fs.pathExists(a1Path)) missingDocs.push('A1_已上线功能与流程清单'); // 修正显示名
        if (!await fs.pathExists(a2Path)) missingDocs.push('A2_存量反馈与数据汇总'); // 修正显示名

        if (missingDocs.length > 0) {
            console.log(chalk.red('\n✗ A 类基线文档不完整，无法开始规划\n'));
            console.log(chalk.yellow('缺失的文档:'));
            missingDocs.forEach(doc => console.log(`  - ${doc}`));
            console.log('');
            console.log(chalk.bold('请先完成基线文档:'));
            if (missingDocs.includes('A0_产品基础与范围说明')) {
                console.log('  prd baseline create A0');
            }
            if (missingDocs.includes('A1_已上线功能清单')) {
                console.log('  prd baseline create A1');
            }
            if (missingDocs.includes('A2_存量反馈汇总')) {
                console.log('  prd baseline create A2');
            }
            console.log('');
            console.log(chalk.gray('提示: 如果用户已提供功能清单或反馈信息，应先归档到对应的 A 类文档'));
            return;
        }

        console.log(chalk.green('✓ A 类基线文档完整'));

        const r1StartPath = path.join(iterationDir, 'R1_规划启动条件检查.md');
        if (!await fs.pathExists(r1StartPath)) {
            console.log(chalk.red('✗ 请先完成 R1 规划启动条件检查'));
            console.log('运行: prd iteration new');
            return;
        }

        // ⭐ 支持预确认模式：PM 已在对话中确认
        let r1Confirmed = false;
        if (options.pmConfirmed) {
            console.log(chalk.green('✓ PM 已在对话中确认 R1 三个启动条件满足'));
            r1Confirmed = true;
            await dialog.logPMConfirmation('planning', 'start_b1', 'approved', 'PM通过对话确认R1三条件满足,启动规划(预确认模式)');
        } else if (process.env.PRD_TEST_MODE === 'true') {
            // 测试模式：自动确认
            console.log(chalk.yellow('⚠️ 测试模式：自动确认 R1 启动条件'));
            r1Confirmed = true;
        } else {
            // 交互式确认
            r1Confirmed = await confirm.confirmR1Start();
            if (r1Confirmed) {
                await dialog.logPMConfirmation('planning', 'start_b1', 'approved', 'PM确认R1三条件满足,启动规划');
            }
        }

        if (!r1Confirmed) {
            console.log(chalk.yellow('\n根据 PM 决策，未启动规划'));
            console.log(chalk.gray('提示：只有满足三个启动条件，才应开始规划\n'));
            return;
        }

        console.log(chalk.green('\n✓ PM 确认启动规划\n'));
    }

    // B2 需要检查 B1 是否存在
    if (type === 'B2') {
        const b1Path = path.join(iterationDir, 'B1_需求规划草案.md');
        if (!await fs.pathExists(b1Path)) {
            console.log(chalk.red('✗ 请先创建 B1'));
            console.log('运行: prd plan create B1');
            return;
        }
    }

    // 写入文件
    await fs.writeFile(filePath, templates[type]);

    // 记录文档创建
    await dialog.logDocumentCreation('planning', type, filePath);

    console.log(chalk.green(`✓ ${fileName} 创建成功!`));
    console.log(chalk.cyan(`文件位置: ${filePath}\n`));

    if (type === 'B1') {
        console.log(chalk.bold('⚠️  重要提醒:\n'));
        console.log(chalk.yellow('【PM 职责】'));
        console.log('- 提出真实规划意图');
        console.log('- 确认目标与场景');
        console.log('- 明确"不做什么"\n');

        console.log(chalk.cyan('【AI 职责】'));
        console.log('- 组织规划结构');
        console.log('- 发现目标冲突');
        console.log('- 检查是否偏离现状\n');

        console.log(chalk.red('【AI 禁止】'));
        console.log('- ❌ 擅自扩展规划范围\n');

        console.log(chalk.bold('下一步:'));
        console.log('1. PM 填写 B1_需求规划草案.md (AI 可辅助但需 PM 确认)');
        console.log('2. 创建 B2: prd plan create B2');
    } else if (type === 'B2') {
        console.log(chalk.bold('⚠️  重要提醒:\n'));
        console.log(chalk.yellow('【PM 职责】'));
        console.log('- 决定取舍');
        console.log('- 决定优先级');
        console.log('- 接受或拒绝拆解建议\n');

        console.log(chalk.cyan('【AI 职责】'));
        console.log('- 提出多种拆解方式');
        console.log('- 暴露范围风险');
        console.log('- 标注依赖关系\n');

        console.log(chalk.red('【AI 禁止】'));
        console.log('- ❌ 替 PM 做取舍决策\n');

        console.log(chalk.bold('下一步:'));
        console.log('1. PM 填写 B2_规划拆解与范围界定.md');
        console.log('2. 执行 R1 审视: prd review r1');
    }
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

    // ===== 新流程：自动执行前置检查 =====

    // 支持 --force 跳过检查
    if (options.force) {
        console.log(chalk.yellow('\n⚠️  使用 --force 跳过前置检查\n'));
    } else {
        // 执行自动检查（包含 R1 审视）
        const checkResult = await runPlanFreezeChecks(iterationDir);

        if (!checkResult.pass) {
            console.log(chalk.yellow('💡 提示：解决以上问题后重新运行 prd plan freeze'));
            console.log(chalk.gray('   或使用 prd plan freeze --force 强制跳过检查（不推荐）\n'));
            return;
        }
    }

    // ===== 检查通过，继续冻结流程 =====

    // 检查 B1, B2 是否存在（冗余检查，确保安全）
    const b1Path = path.join(iterationDir, 'B1_需求规划草案.md');
    const b2Path = path.join(iterationDir, 'B2_规划拆解与范围界定.md');

    if (!await fs.pathExists(b1Path) || !await fs.pathExists(b2Path)) {
        console.log(chalk.red('✗ 请先完成 B1 和 B2'));
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

    // ⭐ 读取 B1、B2、R1 内容，提取关键信息
    console.log(chalk.gray('正在从 B1/B2/R1 提取关键信息...'));

    const b1Content = await fs.readFile(b1Path, 'utf-8');
    const b2Content = await fs.readFile(b2Path, 'utf-8');

    // 提取 B1 核心目标（尝试从多个可能的标题下提取）
    let b1CoreGoal = extractSection(b1Content, '要解决的核心问题') ||
        extractSection(b1Content, '核心问题') ||
        extractSection(b1Content, '规划目标') ||
        '（请手动填写，未能自动提取）';

    // 提取 B2 范围说明
    let b2Scope = extractSection(b2Content, '首版包含') ||
        extractSection(b2Content, '范围界定') ||
        extractSection(b2Content, '包含范围') ||
        '（请手动填写，未能自动提取）';

    // 提取 R1 审视详情
    let r1Summary = '';
    const r1Sections = ['目标清晰性', '场景真实性', '现状一致性', '范围收敛性', '版本化准备度'];
    for (const section of r1Sections) {
        const sectionContent = extractSection(r1Content, section);
        if (sectionContent && sectionContent.length > 10) {
            r1Summary += `- ${section}: ${sectionContent.substring(0, 100)}...\n`;
        }
    }
    if (!r1Summary) {
        r1Summary = '（请参考 R1_规划审视报告.md）';
    }

    // 检查 R1 中的结论
    let r1Conclusion = '✅ 通过';
    if (r1Content.includes('有条件通过')) {
        r1Conclusion = '⚠️ 有条件通过';
    }

    // 生成 B3（传入提取的内容）
    const b3Template = getB3Template(pmSignature, {
        b1CoreGoal,
        b2Scope,
        r1Summary,
        r1Conclusion
    });
    const b3Path = path.join(iterationDir, 'B3_规划冻结归档.md');
    await fs.writeFile(b3Path, b3Template);

    // 记录 PM 决策和文档创建
    await dialog.logPMConfirmation('planning', 'freeze_b3', 'approved',
        `PM签名: ${pmSignature}, 规划冻结`
    );
    await dialog.logDocumentCreation('planning', 'B3', b3Path);

    console.log(chalk.green('\n✓ B3_规划冻结归档.md 创建成功!'));
    console.log(chalk.cyan(`文件位置: ${b3Path}\n`));

    console.log(chalk.bold.green('🎉 规划已冻结!\n'));
    console.log(chalk.bold('下一步:'));
    console.log('1. 创建版本范围: prd version create C0');
    console.log('2. 创建版本需求: prd version create C1');
    console.log('3. 执行 R2 审视: prd review r2');
    console.log('');
}

function getFileName(type) {
    const names = {
        'B1': 'B1_需求规划草案.md',
        'B2': 'B2_规划拆解与范围界定.md'
    };
    return names[type];
}

function getB1Template() {
    return `# B1_需求规划草案

**创建时间**: ${new Date().toLocaleString('zh-CN')}
**文档状态**: 草案

---

## 文档说明

**目的**: 
- 描述"想解决什么问题"
- 明确规划目标和边界
- 说明为什么值得单独一轮规划

**填写要求**:
- 必须基于 A 类文档中的真实现状
- 必须说明"明确不做什么"
- 禁止引入 A 类中不存在的能力

---

## 1. 规划目标

### 1.1 核心问题

**要解决的核心问题**:
<!-- 填写内容：描述具体要解决的问题，必须可在 A1/A2 中找到依据 -->

**问题来源**:
- [ ] A1: 现有功能/流程的明确断点 (具体章节: _______)
- [ ] A2: 真实用户反馈/数据异常 (具体反馈: _______)
- [ ] 业务约束变化/合规要求 (具体说明: _______)

**为什么值得单独规划**:
<!-- 说明为什么不能通过微调、修补解决 -->

---

## 2. 使用场景

### 2.1 目标用户

**核心用户群**:
<!-- 描述用户是谁，基于 A0 中定义的用户 -->

### 2.2 关键场景

**场景1**: 
- 触发条件: 
- 用户目标: 
- 当前痛点: (引用 A1/A2 具体内容)

**场景2**:
<!-- 如有多个场景,继续列举 -->

---

## 3. 规划范围

### 3.1 目标范围

**包含内容**:
1. 
2. 
3. 

### 3.2 明确不做

**本轮规划不包含**:
1. 
2. 
3. 

**理由**: 
<!-- 说明为什么这些不在范围内 -->

---

## 4. 核心需求（概述）

### 4.1 需求概要

**需求1**: 
- 解决什么问题: 
- 涉及哪些功能点: 

**需求2**:
<!-- 继续列举核心需求 -->

---

## 5. 约束与依赖

### 5.1 技术约束

**已知约束**:
- 现有架构限制: (参考 A0)
- 依赖现有能力: (参考 A1)

### 5.2 业务约束

**时间约束**: 
**资源约束**: 

---

## 6. 成功标准

**如何判断规划成功**:
1. 
2. 
3. 

---

## 填写检查清单

- [ ] 所有问题都可在 A 类文档中找到依据
- [ ] 明确说明了"不做什么"
- [ ] 没有引入 A0 中不存在的能力
- [ ] 场景真实且可验证
- [ ] 范围收敛,可版本化

---

**填写人**: _____________
**填写日期**: _____________
`;
}

function getB2Template() {
    return `# B2_规划拆解与范围界定

**创建时间**: ${new Date().toLocaleString('zh-CN')}
**文档状态**: 拆解中

---

## 文档说明

**目的**: 
- 将 B1 的规划目标拆解为可执行的需求项
- 确定优先级和范围
- 界定清晰的版本边界

**填写要求**:
- 所有需求必须来自 B1
- 必须标注优先级和依赖关系
- 必须说明哪些进入首版,哪些后续迭代

---

## 1. 需求项列表

### 1.1 需求拆解

**需求项 #1**: 
- 来源: (引用 B1 中的哪个需求)
- 描述: 
- 优先级: P0 / P1 / P2
- 估算工作量: 

**需求项 #2**:
<!-- 继续列举 -->

---

## 2. 优先级排序

### 2.1 P0 (必须做)

1. 
2. 
3. 

**理由**: 
<!-- 说明为什么这些是 P0 -->

### 2.2 P1 (重要)

1. 
2. 

### 2.3 P2 (可选)

1. 
2. 

---

## 3. 范围界定

### 3.1 首版包含

**进入首版的需求**:
- 需求项 #1
- 需求项 #2
- ...

**总工作量估算**: 

### 3.2 后续迭代

**延后的需求**:
- 需求项 #X (延后原因: ______)
- 需求项 #Y (延后原因: ______)

---

## 4. 依赖关系

### 4.1 前置依赖

**需求项 #1 依赖**:
- 依赖现有功能: (引用 A1)
- 依赖其他需求项: 

### 4.2 阻塞风险

**已知风险**:
1. 
2. 

---

## 5. 范围确认

### 5.1 确认声明

- [ ] 所有需求项均来自 B1
- [ ] 优先级排序已完成
- [ ] 首版范围已明确
- [ ] 依赖关系已标注
- [ ] 无范围膨胀

**范围签字**: _____________
**日期**: _____________

---

## 备注

<!-- 其他需要说明的内容 -->
`;
}

/**
 * 从文档中提取指定标题下的内容
 */
function extractSection(content, sectionTitle) {
    // 尝试匹配 "**标题**:" 或 "### 标题" 或 "## 标题" 格式
    const patterns = [
        new RegExp(`\\*\\*${sectionTitle}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*|\\n##|\\n---|\$)`, 'i'),
        new RegExp(`###?\\s*${sectionTitle}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|\\n---|\$)`, 'i'),
        new RegExp(`${sectionTitle}[:\\s]*\\n([\\s\\S]*?)(?=\\n\\*\\*|\\n##|\\n---|\$)`, 'i')
    ];

    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            let extracted = match[1].trim();
            // 清理 HTML 注释
            extracted = extracted.replace(/<!--[\s\S]*?-->/g, '').trim();
            // 清理空的占位符
            extracted = extracted.replace(/_{3,}/g, '').trim();
            if (extracted.length > 5) {
                return extracted;
            }
        }
    }
    return null;
}

function getB3Template(pmSignature, extractedContent = {}) {
    const {
        b1CoreGoal = '（未提供）',
        b2Scope = '（未提供）',
        r1Summary = '（未提供）',
        r1Conclusion = '✅ 通过'
    } = extractedContent;

    return `# B3_规划冻结归档

**冻结时间**: ${new Date().toLocaleString('zh-CN')}
**PM 签名**: ${pmSignature}
**文档状态**: 已冻结 ✅

---

## 冻结声明

本规划已通过 R1 审视,正式冻结。

**冻结承诺**:
- 本轮迭代的规划目标已确定
- "不做的部分"已明确
- 后续版本(C 类)必须基于此规划

---

## 1. 规划总结

### 1.1 规划目标

**来自 B1 的核心目标**:

${b1CoreGoal}

### 1.2 范围说明

**来自 B2 的范围界定**:

${b2Scope}

---

## 2. R1 审视结论

### 2.1 审视结果

**R1 审视状态**: ${r1Conclusion}

**通过时间**: ${new Date().toLocaleString('zh-CN')}

**审视摘要**:

${r1Summary}

### 2.2 待解决问题

**请参考 R1_规划审视报告.md 中的详细内容**

---

## 3. 版本化准备

### 3.1 进入 C 阶段的指引

**C0 版本范围声明应包含**:
- 基于上述规划目标
- 明确的版本边界
- 不超出本文档定义的范围

**C1 版本需求清单应包含**:
- B2 中首版包含的需求项
- 详细的验收标准
- 明确的实现路径

---

## 4. 冻结管理

### 4.1 修改规则

**冻结后禁止**:
- ❌ 修改规划目标
- ❌ 扩大规划范围
- ❌ 引入新的核心需求

**允许调整**:
- ✅ C0/C1 中的细节描述
- ✅ 实现方案的优化
- ✅ 非核心的边界情况

### 4.2 解冻条件

**如需解冻规划**:
1. 必须说明解冻原因
2. 重新执行 R1 审视
3. 重新签字确认

---

## 5. 交接信息

### 5.1 关键文档

- A0: 产品基础与范围说明
- A1: 已上线功能清单
- A2: 存量反馈汇总
- B1: 需求规划草案
- B2: 规划拆解与范围界定
- R1: 规划审视报告

### 5.2 下一步

1. 创建 C0_版本范围声明
2. 创建 C1_版本需求清单
3. 执行 R2_版本审视

---

**PM 最终确认**: ${pmSignature}
**冻结日期**: ${new Date().toLocaleDateString('zh-CN')}
**状态**: 🔒 已冻结
`;
}

