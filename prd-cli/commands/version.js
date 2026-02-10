const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const confirm = require('./confirm');
const dialog = require('./dialog');
const { runVersionFreezeChecks } = require('./freeze-checks');

module.exports = async function (action, type, options = {}) {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        return;
    }

    const config = await fs.readJSON(configPath);

    if (action === 'create') {
        await createVersionDoc(type, config, configPath);
    } else if (action === 'freeze') {
        await freezeVersion(config, configPath, options);
    } else {
        console.log(chalk.red('✗ 未知操作'));
        console.log('可用操作: create C0|C1|C2, freeze');
    }
};

async function createVersionDoc(type, config, configPath) {
    if (config.currentIteration === 0) {
        console.log(chalk.red('✗ 请先创建迭代'));
        return;
    }

    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
    );

    // 拦截废弃的文档类型
    if (type === 'C0') {
        console.log(chalk.red('❌ C0 已废弃。请直接创建 IT 用户故事。'));
        return;
    }
    if (type === 'C1') {
        console.log(chalk.red('❌ C1 已废弃。请使用 "prd it create" 替代。'));
        console.log(chalk.cyan('运行: prd it create "需求名称"'));
        return;
    }

    // C 类文档必须先有 B3
    const b3Path = path.join(iterationDir, 'B3_规划冻结归档.md');
    if (!await fs.pathExists(b3Path)) {
        console.log(chalk.red('✗ 请先完成规划冻结 (B3)'));
        console.log('运行: prd plan freeze');
        return;
    }

    const templates = {
        'C0': getC0Template(),
        'C1': getC1Template(),
        'C2': getC2Template()
    };

    if (!templates[type]) {
        console.log(chalk.red(`✗ 未知的文档类型: ${type}`));
        console.log('可用类型: C0, C1, C2');
        return;
    }

    const fileName = getFileName(type);
    const filePath = path.join(iterationDir, fileName);

    if (await fs.pathExists(filePath)) {
        console.log(chalk.yellow(`⚠ 文件已存在: ${fileName}`));
        return;
    }

    // C1 现在已包含版本范围声明（原 C0 内容），不再强制要求先创建 C0
    // 但检查 C0 是否存在，如果存在则提示已有
    if (type === 'C1') {
        const c0Path = path.join(iterationDir, 'C0_版本范围声明.md');
        if (await fs.pathExists(c0Path)) {
            console.log(chalk.cyan('ℹ️  检测到 C0 已存在，C1 已包含版本范围声明部分'));
            console.log(chalk.gray('   提示：新版 C1 已合并 C0 内容，你可以直接在 C1 中填写版本范围\n'));
        }
    }

    // 写入文件
    await fs.writeFile(filePath, templates[type]);

    // 记录文档创建
    await dialog.logDocumentCreation('version', type, filePath);

    console.log(chalk.green(`✓ ${fileName} 创建成功!`));
    console.log(chalk.cyan(`文件位置: ${filePath}\n`));

    if (type === 'C0') {
        console.log(chalk.bold('⚠️  重要提醒:\n'));
        console.log(chalk.yellow('【PM 职责】'));
        console.log('- 对版本承诺负责');
        console.log('- 明确包含/不包含\n');

        console.log(chalk.cyan('【AI 职责】'));
        console.log('- 将 B3 转译为版本语言');
        console.log('- 检查是否超出规划\n');

        console.log(chalk.red('【AI 禁止】'));
        console.log('- ❌ 新增版本目标\n');

        console.log(chalk.bold('下一步:'));
        console.log('1. PM 填写 C0_版本范围声明.md (必须基于 B3)');
        console.log('2. 创建 C1: prd version create C1');
    } else if (type === 'C1') {
        console.log(chalk.bold('⚠️  重要提醒:\n'));
        console.log(chalk.green('📋 新版 C1 已包含版本范围声明（原 C0 内容）'));
        console.log(chalk.gray('   无需单独创建 C0，直接在 C1 中填写版本范围和详细需求\n'));

        console.log(chalk.yellow('【PM 职责】'));
        console.log('- 填写版本范围声明（第 1 章节）');
        console.log('- 确认需求是否准确完整');
        console.log('- 定义验收标准\n');

        console.log(chalk.cyan('【AI 职责】'));
        console.log('- 基于 B2 拆分需求清单');
        console.log('- 校验需求可验证性');
        console.log('- 标注来源关系\n');

        console.log(chalk.red('【AI 禁止】'));
        console.log('- ❌ 引入 B3 规划外需求\n');

        console.log(chalk.bold('下一步:'));
        console.log('1. PM 填写 C1_版本需求清单.md（包含版本范围 + 详细需求）');
        console.log('2. 完成后执行冻结: prd version freeze');
        console.log('');
        console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.bold.green('✨ 简化流程：C1 填写完成后直接运行 prd version freeze'));
        console.log(chalk.bold.green('   程序会自动执行 R2 审视，通过后完成冻结'));
        console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log('');
    } else if (type === 'C2') {
        console.log(chalk.bold('⚠️  重要提醒：\n'));
        console.log(chalk.yellow('【C2 用途】'));
        console.log('- 记录版本冻结后发生的变更');
        console.log('- 保证版本决策可追溯');
        console.log('- 防止版本失控\n');

        console.log(chalk.cyan('【填写要求】'));
        console.log('- 只记录"已发生的变更"');
        console.log('- 必须说明变更原因');
        console.log('- 评估对版本目标的影响\n');

        console.log(chalk.red('【注意】'));
        console.log('- ⚠️ 重大变更可能需要重新执行 R2 审视\n');
    }
}

async function freezeVersion(config, configPath, options = {}) {
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
        // 执行自动检查（包含 R2 审视）
        const checkResult = await runVersionFreezeChecks(iterationDir);

        if (!checkResult.pass) {
            console.log(chalk.yellow('💡 提示：解决以上问题后重新运行 prd version freeze'));
            console.log(chalk.gray('   或使用 prd version freeze --force 强制跳过检查（不推荐）\n'));
            return;
        }
    }

    // ===== 检查通过，继续冻结流程 =====

    // 检查规划冻结是否存在（支持新旧文件名）
    let freezePath = path.join(iterationDir, '规划冻结.md');
    if (!await fs.pathExists(freezePath)) {
        freezePath = path.join(iterationDir, 'B3_规划冻结归档.md');
    }

    if (!await fs.pathExists(freezePath)) {
        console.log(chalk.red('✗ 请先完成规划冻结'));
        console.log('运行: prd plan freeze');
        return;
    }

    // 检查 IT 是否存在
    const itDirCheck = path.join(iterationDir, 'IT');
    if (!await fs.pathExists(itDirCheck)) {
        console.log(chalk.red('✗ 请先创建 IT 用户故事'));
        return;
    }

    // PM 确认冻结
    let pmSignature = null;
    if (options.pmConfirmed && options.pmSignature) {
        console.log(chalk.green(`✓ PM 已在对话中确认版本冻结，签名: ${options.pmSignature}`));
        pmSignature = options.pmSignature;
    } else {
        // 交互式确认
        pmSignature = await confirm.confirmC3Freeze();
    }

    if (!pmSignature) {
        console.log(chalk.yellow('\n根据 PM 决策，未执行冻结'));
        return;
    }

    // ⭐ 读取 IT 内容，提取关键信息
    console.log(chalk.gray('正在从 IT 文档提取关键信息...'));

    const itDir = path.join(iterationDir, 'IT');
    const itFolders = (await fs.readdir(itDir)).filter(name => name.startsWith('IT-'));

    let itSummaries = '';
    let totalReqCount = itFolders.length;
    let p0Count = 0;
    let p1Count = 0;
    let p2Count = 0;
    let versionGoal = '';

    for (const folder of itFolders) {
        const itPath = path.join(itDir, folder);
        const itId = folder.split('-').slice(0, 2).join('-');

        // 读取业务需求文档（支持新旧文件名）
        let bizPath = path.join(itPath, '业务需求.md');
        if (!await fs.pathExists(bizPath)) {
            bizPath = path.join(itPath, `${itId}-BIZ.md`);
        }
        let bizContent = '';
        if (await fs.pathExists(bizPath)) {
            bizContent = await fs.readFile(bizPath, 'utf-8');
        }

        // 提取 IT 标题
        const titleMatch = bizContent.match(/^# (IT-\d+ .*?) -/);
        const title = titleMatch ? titleMatch[1] : folder;

        // 提取优先级
        if (/P0/i.test(bizContent)) p0Count++;
        else if (/P1/i.test(bizContent)) p1Count++;
        else p2Count++; // 默认为 P2

        // 提取用户故事摘要
        const storyMatch = bizContent.match(/### 1. 用户故事\s*\n([\s\S]*?)(?=\n##|$)/);
        const story = storyMatch ? storyMatch[1].trim().split('\n')[0] : '（无在 BIZ 中找到用户故事）';

        itSummaries += `### ${title}\n\n`;
        itSummaries += `**用户故事**: ${story}\n\n`;
        itSummaries += `**文档位置**: IT/${folder}/\n\n`;
    }

    // 从规划冻结提取版本目标
    const freezeContent = await fs.readFile(freezePath, 'utf-8');
    versionGoal = extractSection(freezeContent, '核心问题') || '请参考规划冻结文档';

    // 审视归档说明
    const reviewSummary = '本次冻结执行了自动化版本审视，检查了所有 IT 文档的完整性与一致性。';

    // 生成版本发布文档
    const releaseTemplate = getReleaseTemplate(pmSignature, {
        versionGoal,
        totalReqCount,
        p0Count,
        p1Count,
        p2Count,
        itSummaries,
        reviewSummary
    });
    const releasePath = path.join(iterationDir, '版本发布.md');
    await fs.writeFile(releasePath, releaseTemplate);

    // 记录 PM 决策和文档创建
    await dialog.logPMConfirmation('version', 'freeze', 'approved',
        `PM签名: ${pmSignature}, 版本冻结`
    );
    await dialog.logDocumentCreation('version', '版本发布', releasePath);

    console.log(chalk.green('\n✓ 版本发布.md 创建成功!'));
    console.log(chalk.cyan(`文件位置: ${releasePath}\n`));

    console.log(chalk.bold.green('🎉 版本已冻结！产品需求阶段完成！\n'));
    console.log(chalk.bold('✅ 本轮迭代已完成，可以：'));
    console.log('1. 将冻结的需求交付给研发团队');
    console.log('2. 开始下一轮迭代: prd iteration new');
    console.log('3. 查看项目状态: prd status');
    console.log('');
}

function getFileName(type) {
    const names = {
        'C0': 'C0_版本范围声明.md',
        'C1': 'C1_版本需求清单.md',
        'C2': 'C2_版本变更说明.md'
    };
    return names[type];
}

function getC0Template() {
    return `# C0_版本范围声明

**创建时间**: ${new Date().toLocaleString('zh-CN')}
**文档状态**: 草案

---

## 文档说明

**目的**: 
- 明确本版本要交付什么
- 声明版本边界和约束
- 对外承诺的依据

**填写要求**:
- 必须基于 B3 冻结的规划
- 不得超出 B3 范围
- 必须说明"不包含什么"

---

## 1. 版本目标

### 1.1 版本定位

**本版本解决的核心问题**:
<!-- 引用 B1/B3 中的规划目标 -->

**版本编号**: v______
**计划发布时间**: ______

---

## 2. 版本范围

### 2.1 包含范围

**本版本包含的功能**:
1. 
2. 
3. 

**对应 B2 中的需求项**:
- 需求项 #__: ______
- 需求项 #__: ______

### 2.2 不包含内容

**本版本明确不包含**:
1. 
2. 
3. 

**不包含的原因**:
- 延后到后续版本
- 不在 B3 规划范围
- 资源/时间限制

---

## 3. 用户价值

### 3.1 目标用户

**本版本面向的用户**:
<!-- 基于 A0/B1 -->

### 3.2 解决的问题

**版本发布后用户可以**:
1. 
2. 
3. 

---

## 4. 功能清单（概述）

### 4.1 核心功能

**功能1**: 
- 价值: 
- 来源: (引用 B2 需求项)

**功能2**:
<!-- 继续列举 -->

---

## 5. 版本约束

### 5.1 技术约束

**已知限制**:
1. 
2. 

### 5.2 业务约束

**时间约束**: 
**资源约束**: 
**依赖条件**: 

---

## 6. 版本边界确认

### 6.1 与 B3 一致性

- [ ] 所有功能均来自 B3
- [ ] 未超出 B3 范围
- [ ] "不包含"部分已明确

### 6.2 PM 确认

**PM 签字**: _____________
**日期**: _____________

---

## 备注

<!-- 其他需要说明的内容 -->
`;
}

function getC1Template() {
    return `# C1_版本需求清单

**创建时间**: ${new Date().toLocaleString('zh-CN')}
**文档状态**: 需求中

---

## 文档说明

**目的**: 
- 声明本版本的范围边界
- 详细列出所有版本需求
- 定义验收标准
- 作为研发的输入

**填写要求**:
- 版本范围必须基于 B3 冻结的规划
- 每个需求必须可在 B2 中找到来源
- 必须有明确的验收条件
- 禁止引入规划外的需求

---

## 1. 版本范围声明

### 1.1 版本定位

**版本编号**: v______
**计划发布时间**: ______

**本版本解决的核心问题**:
<!-- 引用 B1/B3 中的规划目标 -->

### 1.2 版本范围

**本版本包含的功能**:
1. 
2. 
3. 

**对应 B2 中的需求项**:
- 需求项 #__: ______
- 需求项 #__: ______

**本版本明确不包含**:
1. 
2. 
3. 

**不包含的原因**:
- 延后到后续版本
- 不在 B3 规划范围
- 资源/时间限制

---

## 2. 详细需求清单

### REQ-001 需求标题

**需求编号**: REQ-001
**来源**: B2 需求项 #__
**优先级**: P0 / P1 / P2

**需求背景**:
<!-- 用户痛点/业务目标 -->

**需求描述**:
<!-- 详细描述需求 -->

**核心规则**:
1. 
2. 
3. 

**验收标准**:
- [ ] 标准1
- [ ] 标准2
- [ ] 标准3

**边界情况**:
<!-- 异常处理、特殊情况 -->

---

### REQ-002 需求标题

<!-- 继续列举其他需求，使用相同格式 -->

---

## 3. 需求关系

### 3.1 依赖关系

**需求 REQ-001 依赖**:
- 依赖需求: REQ-___
- 依赖现有功能: (引用 A1)

### 3.2 互斥关系

**互斥需求**:
<!-- 如果某些需求不能同时满足，说明原因 -->

---

## 4. 非功能需求

### 4.1 性能要求

**响应时间**: 
**并发量**: 

### 4.2 安全要求

**权限控制**: 
**数据安全**: 

---

## 5. 验收总览

### 5.1 需求完整性检查

- [ ] 版本范围已明确，不超出 B3
- [ ] 所有需求均来自 B2
- [ ] 每个需求都有验收标准
- [ ] 依赖关系已标注
- [ ] 边界情况已说明

### 5.2 版本统计

**总需求数**: ______
**P0 需求数**: ______
**P1 需求数**: ______
**P2 需求数**: ______

### 5.3 PM 确认

**PM 签字**: _____________
**日期**: _____________

---

## 备注

<!-- 其他需要说明的内容 -->
`;
}

function getC2Template() {
    return `# C2_版本变更说明

**创建时间**: ${new Date().toLocaleString('zh-CN')}
**文档状态**: 变更记录

---

## 文档说明

**目的**: 
- 记录版本冻结后发生的变更
- 保证版本决策可追溯
- 防止版本失控

**填写要求**:
- 只记录"已发生的变更"，不做评判
- 必须说明变更原因和影响
- 每次变更单独记录

---

## 变更记录

### 变更 #1

**变更时间**: ____________
**变更人**: ____________

**变更原因**:
<!-- 说明为什么需要变更 -->

**变更内容**:
<!-- 详细描述变更了什么 -->

**对版本目标的影响**:
- [ ] 无影响
- [ ] 范围调整（说明：______）
- [ ] 优先级调整（说明：______）
- [ ] 需求变更（说明：______）

**是否需要重新审视**:
- [ ] 不需要
- [ ] 需要重新执行 R2 审视

---

### 变更 #2

<!-- 如有更多变更，按相同格式记录 -->

---

## 变更汇总

**总变更次数**: ______
**最后变更时间**: ______

**变更类型统计**:
- 范围调整: ______ 次
- 优先级调整: ______ 次
- 需求变更: ______ 次
- 其他: ______ 次

---

## 变更审批

**审批人**: _____________
**审批日期**: _____________
**审批意见**: 

---

## 备注

<!-- 其他需要说明的内容 -->
`;
}

/**
 * 从文档中提取指定标题下的内容
 */
function extractSection(content, sectionTitle) {
    const patterns = [
        new RegExp(`\\*\\*${sectionTitle}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*|\\n##|\\n---|\$)`, 'i'),
        new RegExp(`###?\\s*${sectionTitle}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|\\n---|\$)`, 'i'),
        new RegExp(`${sectionTitle}[:\\s]*\\n([\\s\\S]*?)(?=\\n\\*\\*|\\n##|\\n---|\$)`, 'i')
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

function getReleaseTemplate(pmSignature, extractedContent = {}) {
    const {
        versionGoal = '（未提供）',
        totalReqCount = 0,
        p0Count = 0,
        p1Count = 0,
        p2Count = 0,
        itSummaries = '（无用户故事）',
        reviewSummary = '（未提供）'
    } = extractedContent;

    return `# 版本发布

**冻结时间**: ${new Date().toLocaleString('zh-CN')}
**PM 签名**: ${pmSignature}
**状态**: 已冻结 ✅

---

## 冻结声明

本版本需求已通过自动化审视，正式冻结。

**冻结承诺**:
- 产品需求阶段完成
- 可以交付给研发团队
- 冻结后禁止修改需求

---

## 1. 版本总结

### 1.1 版本目标

${versionGoal}

### 1.2 需求概览

**IT 用户故事统计**:
- 总故事数: ${totalReqCount}
- P0 故事: ${p0Count}
- P1 故事: ${p1Count}
- P2 故事: ${p2Count}

---

## 2. 需求清单

${itSummaries}

---

## 3. 审视结论

**审视状态**: ✅ 通过
**通过时间**: ${new Date().toLocaleString('zh-CN')}

**审视摘要**:
${reviewSummary}

**与规划的一致性**:
- ✅ 未背叛规划
- ✅ 未超出规划范围
- ✅ 需求可追溯

---

## 4. 交付清单

**用户故事文档**:
- 包含 ${totalReqCount} 个独立的用户故事文档（业务需求.md）

**技术规格文档**:
- 包含 ${totalReqCount} 个对应的技术规格文档（技术规格.md）

---

## 5. 冻结管理

### 5.1 修改规则

**冻结后禁止**:
- ❌ 修改需求内容
- ❌ 新增需求
- ❌ 调整验收标准

**允许补充**:
- ✅ 技术实现方案的说明
- ✅ UI/UX 设计细节
- ✅ 测试用例

### 5.2 变更流程

**如需变更需求**:
1. 评估变更影响
2. PM 重新签字确认
3. 更新版本发布文档

---

## 6. 下一步

### 6.1 研发阶段

**可以启动**:
- 技术方案设计
- 架构评审
- 开发排期

### 6.2 后续迭代

**如需新的迭代**:
1. 运行: prd iteration new
2. 重新执行 基线 → 规划 → IT → 版本 流程

---

**PM 最终确认**: ${pmSignature}
**冻结日期**: ${new Date().toLocaleDateString('zh-CN')}
**产品需求阶段**: ✅ 完成
`;
}
