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
        await createVersionDoc(type, config, configPath);
    } else if (action === 'freeze') {
        await freezeVersion(config, configPath);
    } else {
        console.log(chalk.red('✗ 未知操作'));
        console.log('可用操作: create C0|C1, freeze');
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

    // C 类文档必须先有 B3
    const b3Path = path.join(iterationDir, 'B3_规划冻结归档.md');
    if (!await fs.pathExists(b3Path)) {
        console.log(chalk.red('✗ 请先完成规划冻结 (B3)'));
        console.log('运行: prd plan freeze');
        return;
    }

    const templates = {
        'C0': getC0Template(),
        'C1': getC1Template()
    };

    if (!templates[type]) {
        console.log(chalk.red(`✗ 未知的文档类型: ${type}`));
        console.log('可用类型: C0, C1');
        return;
    }

    const fileName = getFileName(type);
    const filePath = path.join(iterationDir, fileName);

    if (await fs.pathExists(filePath)) {
        console.log(chalk.yellow(`⚠ 文件已存在: ${fileName}`));
        return;
    }

    // C1 需要先有 C0
    if (type === 'C1') {
        const c0Path = path.join(iterationDir, 'C0_版本范围声明.md');
        if (!await fs.pathExists(c0Path)) {
            console.log(chalk.red('✗ 请先创建 C0'));
            console.log('运行: prd version create C0');
            return;
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
        console.log(chalk.yellow('【PM 职责】'));
        console.log('- 确认需求是否准确');
        console.log('- 确认需求是否完整\n');

        console.log(chalk.cyan('【AI 职责】'));
        console.log('- 拆分为清单');
        console.log('- 校验可验证性');
        console.log('- 标注来源关系\n');

        console.log(chalk.red('【AI 禁止】'));
        console.log('- ❌ 引入规划外需求\n');

        console.log(chalk.bold('下一步:'));
        console.log('1. PM 填写 C1_版本需求清单.md');
        console.log('2. 执行 R2 审视: prd review r2');
    }
}

async function freezeVersion(config, configPath) {
    if (config.currentIteration === 0) {
        console.log(chalk.red('✗ 请先创建迭代'));
        return;
    }

    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
    );

    // 检查 B3, C0, C1 是否存在
    const b3Path = path.join(iterationDir, 'B3_规划冻结归档.md');
    const c0Path = path.join(iterationDir, 'C0_版本范围声明.md');
    const c1Path = path.join(iterationDir, 'C1_版本需求清单.md');

    if (!await fs.pathExists(b3Path)) {
        console.log(chalk.red('✗ 请先完成规划冻结 (B3)'));
        return;
    }

    if (!await fs.pathExists(c0Path) || !await fs.pathExists(c1Path)) {
        console.log(chalk.red('✗ 请先完成 C0 和 C1'));
        return;
    }

    // 检查 R2 审视是否通过
    const r2ReviewPath = path.join(iterationDir, 'R2_版本审视报告.md');
    if (!await fs.pathExists(r2ReviewPath)) {
        console.log(chalk.red('✗ 请先完成 R2 版本审视'));
        console.log('运行: prd review r2');
        return;
    }

    // 读取 R2 审视结论
    const r2Content = await fs.readFile(r2ReviewPath, 'utf-8');
    const hasPassed = r2Content.includes('- [x] ✅ 通过') || r2Content.includes('[x] 通过');

    if (!hasPassed) {
        console.log(chalk.red('✗ R2 审视未通过，不能冻结版本'));
        console.log(chalk.yellow('请修改 C0/C1 后重新执行 R2 审视'));
        return;
    }

    // ⭐ 关键：PM 必须确认冻结
    const pmSignature = await confirm.confirmC3Freeze();
    if (!pmSignature) {
        console.log(chalk.yellow('\n根据 PM 决策，未执行冻结'));
        return;
    }

    // 生成 C3
    const c3Template = getC3Template(pmSignature);
    const c3Path = path.join(iterationDir, 'C3_版本冻结归档.md');
    await fs.writeFile(c3Path, c3Template);

    // 记录 PM 决策和文档创建
    await dialog.logPMConfirmation('version', 'freeze_c3', 'approved',
        `PM签名: ${pmSignature}, 版本冻结`
    );
    await dialog.logDocumentCreation('version', 'C3', c3Path);

    console.log(chalk.green('\n✓ C3_版本冻结归档.md 创建成功!'));
    console.log(chalk.cyan(`文件位置: ${c3Path}\n`));

    console.log(chalk.bold.green('🎉 版本已冻结!产品需求阶段完成!\n'));
    console.log(chalk.bold('✅ 本轮迭代已完成,可以：'));
    console.log('1. 将冻结的需求交付给研发团队');
    console.log('2. 开始下一轮迭代: prd iteration new');
    console.log('3. 查看项目状态: prd status');
    console.log('');
}

function getFileName(type) {
    const names = {
        'C0': 'C0_版本范围声明.md',
        'C1': 'C1_版本需求清单.md'
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
- 详细列出所有版本需求
- 定义验收标准
- 作为研发的输入

**填写要求**:
- 每个需求必须可在 B2/C0 中找到来源
- 必须有明确的验收条件
- 禁止引入规划外的需求

---

## 1. 需求列表

### 需求 #1

**需求标题**: 
**需求编号**: REQ-001
**来源**: B2 需求项 #__ / C0 功能__

**需求描述**:
<!-- 详细描述需求 -->

**业务目标**:
<!-- 该需求解决什么业务问题 -->

**核心规则**:
1. 
2. 
3. 

**验收标准**:
- [ ] 标准1
- [ ] 标准2
- [ ] 标准3

**优先级**: P0 / P1 / P2

---

### 需求 #2

<!-- 继续列举其他需求 -->

---

## 2. 需求关系

### 2.1 依赖关系

**需求 #1 依赖**:
- 依赖需求: REQ-___
- 依赖功能: (引用 A1)

### 2.2 互斥关系

**互斥需求**:
<!-- 如果某些需求不能同时满足，说明原因 -->

---

## 3. 非功能需求

### 3.1 性能要求

**响应时间**: 
**并发量**: 

### 3.2 安全要求

**权限控制**: 
**数据安全**: 

---

## 4. 边界情况

### 4.1 异常处理

**异常场景1**: 
- 触发条件: 
- 期望行为: 

### 4.2 边界值

**边界条件**: 
<!-- 列出关键的边界值和处理方式 -->

---

## 5. 验收总览

### 5.1 需求完整性

- [ ] 所有需求均来自 B2/C0
- [ ] 每个需求都有验收标准
- [ ] 依赖关系已标注
- [ ] 边界情况已说明

### 5.2 PM 确认

**总需求数**: ______
**P0 需求数**: ______
**P1 需求数**: ______
**P2 需求数**: ______

**PM 签字**: _____________
**日期**: _____________

---

## 备注

<!-- 其他需要说明的内容 -->
`;
}

function getC3Template(pmSignature) {
    return `# C3_版本冻结归档

**冻结时间**: ${new Date().toLocaleString('zh-CN')}
**PM 签名**: ${pmSignature}
**文档状态**: 已冻结 ✅

---

## 冻结声明

本版本需求已通过 R2 审视，正式冻结。

**冻结承诺**:
- 产品需求阶段完成
- 可以交付给研发团队
- 冻结后禁止修改需求

---

## 1. 版本总结

### 1.1 版本目标

**引用 C0 版本目标**:
<!-- 自动引用或手动填写 C0 中的版本目标 -->

### 1.2 需求清单

**引用 C1 需求数量**:
- 总需求数: ______
- P0 需求: ______
- P1 需求: ______
- P2 需求: ______

---

## 2. R2 审视结论

### 2.1 审视结果

**R2 审视状态**: ✅ 通过

**通过时间**: ___________

**5 维度评分**:
- 版本目标一致性: _____
- 版本范围偏移检查: _____
- 规划覆盖完整性: _____
- 需求粒度成熟度: _____
- 进入执行准备度: _____

### 2.2 一致性确认

**与 B3 规划的一致性**:
- [ ] ✅ 未背叛规划
- [ ] ✅ 未超出 B3 范围
- [ ] ✅ 需求可追溯到 B2

---

## 3. 交付清单

### 3.1 关键文档

**基线文档**:
- A0: 产品基础与范围说明
- A1: 已上线功能清单
- A2: 存量反馈汇总

**规划文档**:
- B1: 需求规划草案
- B2: 规划拆解与范围界定
- B3: 规划冻结归档
- R1: 规划审视报告

**版本文档**:
- C0: 版本范围声明
- C1: 版本需求清单
- R2: 版本审视报告

### 3.2 交付物

**可交付给研发的文档**:
- ✅ C1_版本需求清单.md (主要依据)
- ✅ C0_版本范围声明.md (边界参考)
- ✅ B3_规划冻结归档.md (背景理解)

---

## 4. 冻结管理

### 4.1 修改规则

**冻结后禁止**:
- ❌ 修改需求内容
- ❌ 新增需求
- ❌ 调整验收标准

**允许补充**:
- ✅ 技术实现方案的说明
- ✅ UI/UX 设计细节
- ✅ 测试用例

### 4.2 变更流程

**如需变更需求**:
1. 必须说明变更原因和影响
2. 评估是否需要重新执行 R2 审视
3. PM 重新签字确认

---

## 5. 下一步

### 5.1 研发阶段

**可以启动**:
- 技术方案设计
- 架构评审
- 开发排期

### 5.2 后续迭代

**如需新的迭代**:
1. 运行: prd iteration new
2. 重新执行 A → R → B → C 流程
3. 基于本次迭代的经验优化

---

**PM 最终确认**: ${pmSignature}
**冻结日期**: ${new Date().toLocaleDateString('zh-CN')}
**状态**: 🔒 已冻结
**产品需求阶段**: ✅ 完成
`;
}
