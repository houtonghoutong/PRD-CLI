const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const confirm = require('./confirm');
const dialog = require('./dialog');

module.exports = async function (action, type) {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        return;
    }

    const config = await fs.readJSON(configPath);

    if (action === 'create') {
        await createPlanDoc(type, config, configPath);
    } else if (action === 'freeze') {
        await freezePlan(config, configPath);
    } else {
        console.log(chalk.red('✗ 未知操作'));
        console.log('可用操作: create B1|B2, freeze');
    }
};

async function createPlanDoc(type, config, configPath) {
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
        const r1StartPath = path.join(iterationDir, 'R1_规划启动条件检查.md');
        if (!await fs.pathExists(r1StartPath)) {
            console.log(chalk.red('✗ 请先完成 R1 规划启动条件检查'));
            console.log('运行: prd iteration new');
            return;
        }

        // ⭐ 关键：强制 PM 确认三个启动条件
        const r1Confirmed = await confirm.confirmR1Start();
        if (!r1Confirmed) {
            console.log(chalk.yellow('\n根据 PM 决策，未启动规划'));
            console.log(chalk.gray('提示：只有满足三个启动条件，才应开始规划\n'));
            return;
        }

        console.log(chalk.green('\n✓ PM 确认启动规划\n'));

        // 记录对话
        await dialog.logPMConfirmation('planning', 'start_b1', 'approved', 'PM确认R1三条件满足,启动规划');
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

async function freezePlan(config, configPath) {
    if (config.currentIteration === 0) {
        console.log(chalk.red('✗ 请先创建迭代'));
        return;
    }

    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
    );

    // 检查 B1, B2 是否存在
    const b1Path = path.join(iterationDir, 'B1_需求规划草案.md');
    const b2Path = path.join(iterationDir, 'B2_规划拆解与范围界定.md');

    if (!await fs.pathExists(b1Path) || !await fs.pathExists(b2Path)) {
        console.log(chalk.red('✗ 请先完成 B1 和 B2'));
        return;
    }

    // 检查 R1 审视是否通过
    const r1ReviewPath = path.join(iterationDir, 'R1_规划审视报告.md');
    if (!await fs.pathExists(r1ReviewPath)) {
        console.log(chalk.red('✗ 请先完成 R1 规划审视'));
        console.log('运行: prd review r1');
        return;
    }

    // 读取 R1 审视结论
    const r1Content = await fs.readFile(r1ReviewPath, 'utf-8');
    const hasPassed = r1Content.includes('- [x] ✅ 通过') || r1Content.includes('[x] 通过');

    if (!hasPassed) {
        console.log(chalk.red('✗ R1 审视未通过，不能冻结规划'));
        console.log(chalk.yellow('请修改 B1/B2 后重新执行 R1 审视'));
        return;
    }

    // ⭐ 关键：PM 必须确认冻结
    const pmSignature = await confirm.confirmB3Freeze();
    if (!pmSignature) {
        console.log(chalk.yellow('\n根据 PM 决策，未执行冻结'));
        return;
    }

    // 生成 B3
    const b3Template = getB3Template(pmSignature);
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

function getB3Template(pmSignature) {
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

**引用 B1 核心目标**:
<!-- 自动引用或手动填写 B1 中的核心目标 -->

### 1.2 范围说明

**引用 B2 范围界定**:
<!-- 自动引用或手动填写 B2 中确定的范围 -->

---

## 2. R1 审视结论

### 2.1 审视结果

**R1 审视状态**: ✅ 通过

**通过时间**: ___________

**5 维度评分**:
- 目标清晰性: _____
- 场景真实性: _____
- 现状一致性: _____
- 范围收敛性: _____
- 版本化准备度: _____

### 2.2 待解决问题

**R1 审视中提出的待解决问题**:
<!-- 引用 R1_规划审视报告.md 中标注的问题 -->

---

## 3. 版本化准备

### 3.1 进入 C 阶段的指引

**C0 版本范围声明应包含**:
- 基于 B3 的规划目标
- 明确的版本边界
- 不超出 B3 范围

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
