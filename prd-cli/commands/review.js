const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const confirm = require('./confirm');
const dialog = require('./dialog');

module.exports = async function (type, options = {}) {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        console.log('请先运行: prd init <项目名>');
        return;
    }

    const config = await fs.readJSON(configPath);

    if (type === 'r1') {
        await performR1Review(config, options);
    } else if (type === 'r2') {
        await performR2Review(config, options);
    } else {
        console.log(chalk.red('✗ 未知的审视类型'));
        console.log('可用类型: r1, r2');
    }
};

async function performR1Review(config, options = {}) {
    console.log(chalk.bold.blue('\n=== R1 规划审视 ===\n'));

    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
    );

    // 检查迭代目录是否存在
    if (!await fs.pathExists(iterationDir)) {
        console.log(chalk.red('✗ 第一轮迭代尚未创建'));
        console.log('请先执行：prd iteration new');
        if (process.env.PRD_TEST_MODE === 'true') {
            throw new Error('第一轮迭代尚未创建');
        }
        process.exit(1);
    }

    // 检查必需文档
    const b1Path = path.join(iterationDir, 'B1_需求规划草案.md');
    const b2Path = path.join(iterationDir, 'B2_规划拆解与范围界定.md');

    if (!await fs.pathExists(b1Path) || !await fs.pathExists(b2Path)) {
        console.log(chalk.red('✗ 缺少必需的 B1 或 B2 文档'));
        console.log('请先创建：');
        console.log('  prd plan create B1');
        console.log('  prd plan create B2');
        if (process.env.PRD_TEST_MODE === 'true') {
            throw new Error('缺少必需的 B1 或 B2 文档');
        }
        process.exit(1);
    }

    // ⭐ 支持预确认模式和非交互模式（用于测试）
    if (options.pmConfirmed) {
        console.log(chalk.green('✓ PM 已在对话中确认 B1B2 已填写完成，理解角色分工'));
    } else if (process.env.PRD_TEST_MODE === 'true') {
        // 测试模式：跳过交互式确认
        console.log(chalk.yellow('⚠️ 测试模式：跳过交互式确认'));
    } else {
        // 交互式确认
        const canProceed = await confirm.confirmR1Review();
        if (!canProceed) {
            console.log(chalk.yellow('已取消 R1 审视'));
            process.exit(0);
        }
    }

    // 显示审视指令
    console.log(chalk.yellow('【AI 审视指令】\n'));
    console.log(getR1Prompt());
    console.log('\n' + chalk.gray('='.repeat(80)) + '\n');

    // 生成 R1 报告模板
    const r1Template = `# R1_规划审视报告

**审视时间**: ${new Date().toLocaleString('zh-CN')}

**审视对象**:
- B1_需求规划草案.md
- B2_规划拆解与范围界定.md

---

## 一、目标清晰性

**审视标准**:
- 是否能用一句话说明本次规划要解决的核心问题
- 是否存在多个不相关目标混杂

**审视结果**:
<!-- AI 填写 -->

---

## 二、场景真实性

**审视标准**:
- 使用场景是否基于 A 类现状
- 是否依赖当前不存在的能力

**审视结果**:
<!-- AI 填写 -->

---

## 三、现状一致性

**审视标准**:
- 是否明确区分"已有能力改进"与"新增能力"
- 是否存在从零重建的倾向

**审视结果**:
<!-- AI 填写 -->

---

## 四、范围收敛性

**审视标准**:
- 是否明确说明"不做什么"
- 是否存在明显范围膨胀风险

**审视结果**:
<!-- AI 填写 -->

---

## 五、版本化准备度

**审视标准**:
- 是否已不再讨论"值不值得做"
- 是否具备进入版本拆分的条件

**审视结果**:
<!-- AI 填写 -->

---

## 最终结论

**请从以下三项中选择一项**:

- [ ] 【通过】可冻结为 B3
- [ ] 【有条件通过】需补齐以下内容:
  - <!-- 列出需要补充的具体项 -->
- [ ] 【不通过】不可进入 B3，原因:
  - <!-- 列出不通过的具体原因 -->

---

## 审视人员签字

**审视人**: 
**日期**: ${new Date().toLocaleDateString('zh-CN')}

---

⚠️ **重要提醒**: 
- 本审视不应提出新的需求或设计建议
- 只审视现有规划是否满足冻结条件
- 必须给出明确的通过/不通过结论
`;

    const r1Path = path.join(iterationDir, 'R1_规划审视报告.md');
    await fs.writeFile(r1Path, r1Template);

    // 记录审视启动
    await dialog.logDialog('review', 'start_r1', { type: 'R1审视', status: '已生成模板' });

    console.log(chalk.green('✓ R1 审视报告模板已生成'));
    console.log(chalk.cyan(`\n文件位置: ${r1Path}\n`));
    console.log(chalk.bold.yellow('━━━ 下一步操作 ━━━\n'));
    console.log(chalk.bold('请回到 AI 对话中，发送以下消息：'));
    console.log(chalk.cyan('  "请帮我执行 R1 审视，项目路径是 [当前目录]"'));
    console.log('');
    console.log('AI 将会：');
    console.log('  1. 读取 B1、B2 文档');
    console.log('  2. 按 5 维度审视');
    console.log('  3. 填写 R1 报告');
    console.log('  4. 展示结论让你决策');
    console.log('');
    console.log(chalk.gray('审视通过后，回到终端运行: prd plan freeze'));
    console.log('');
}

async function performR2Review(config, options = {}) {
    console.log(chalk.bold.blue('\n=== R2 版本审视 ===\n'));

    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(config.currentIteration).padStart(2, '0')}轮迭代`
    );

    // 检查迭代目录是否存在
    if (!await fs.pathExists(iterationDir)) {
        console.log(chalk.red('✗ 第一轮迭代尚未创建'));
        console.log('请先执行：prd iteration new');
        if (process.env.PRD_TEST_MODE === 'true') {
            throw new Error('第一轮迭代尚未创建');
        }
        process.exit(1);
    }

    // 检查必需文档（C1 已包含版本范围声明，C0 不再强制）
    // 检查必需文档
    const b3Path = path.join(iterationDir, 'B3_规划冻结归档.md');
    const itDir = path.join(iterationDir, 'IT');
    let hasItFiles = false;

    if (await fs.pathExists(itDir)) {
        const files = await fs.readdir(itDir);
        hasItFiles = files.some(f => f.startsWith('IT-'));
    }

    if (!await fs.pathExists(b3Path)) {
        console.log(chalk.red('✗ 缺少 B3 规划冻结归档'));
        console.log('请先执行: prd plan freeze');
        if (process.env.PRD_TEST_MODE === 'true') {
            throw new Error('缺少 B3 文档');
        }
        process.exit(1);
    }

    if (!hasItFiles) {
        console.log(chalk.red('✗ 缺少 IT 用户故事文档'));
        console.log('请先执行: prd it create "名称"');
        if (process.env.PRD_TEST_MODE === 'true') {
            throw new Error('缺少 IT 文档');
        }
        process.exit(1);
    }

    const hasC0 = false; // 已废弃

    // ⭐ 支持预确认模式和非交互模式（用于测试）
    if (options.pmConfirmed) {
        console.log(chalk.green('✓ PM 已在对话中确认 IT 文档已填写完成，理解角色分工'));
    } else if (process.env.PRD_TEST_MODE === 'true') {
        // 测试模式：跳过交互式确认
        console.log(chalk.yellow('⚠️ 测试模式：跳过交互式确认'));
    } else {
        // 交互式确认
        const canProceed = await confirm.confirmR2Review();
        if (!canProceed) {
            console.log(chalk.yellow('已取消 R2 审视'));
            process.exit(0);
        }
    }

    // 显示审视指令
    console.log(chalk.yellow('【AI 审视指令】\n'));
    console.log(getR2Prompt());
    console.log('\n' + chalk.gray('='.repeat(80)) + '\n');

    // 生成 R2 报告模板
    const r2Template = `# R2_版本审视报告

**审视时间**: ${new Date().toLocaleString('zh-CN')}

**审视对象**:
- B3_规划冻结归档.md
- IT 用户故事 (IT-xxx-BIZ/DEV)

---

## 一、业务场景闭环（以终为始）

**审视标准**:
- IT-BIZ 中描述的场景，是否服务于 B3 的核心问题
- IT 是否引入了 B3 没提到的新业务目标

**审视结果**:
<!-- AI 填写 -->

---

## 二、规划范围一致性

**审视标准**:
- B2 中的每个需求项，是否都有对应的 IT
- IT 中是否包含 B2 没有的功能点（新增需求）

**审视结果**:
<!-- AI 填写 -->

---

## 三、验收标准完整性

**审视标准**:
- 每个 IT-BIZ 是否都有明确的"业务验收标准"
- 是否包含"体验验收"标准

**审视结果**:
<!-- AI 填写 -->

---

## 四、细节与边界

**审视标准**:
- 是否有状态流转图和异常处理
- IT-DEV 是否关联了 A2UI 原型

**审视结果**:
<!-- AI 填写 -->

---

## 五、开发就绪状态

**审视标准**:
- 研发团队拿到这个 IT-DEV，能否直接开始写代码
- 是否还需要问 PM "这里怎么做"

**审视结果**:
<!-- AI 填写 -->

---

## 六、用户视角审查

**审视标准**:
- 用户看到这个 IT，能立即理解它是干什么的吗
- 这个 IT 真的解决了 A2 中的用户反馈吗

**审视结果**:
<!-- AI 填写 -->

---

## 最终结论

**请从以下三项中选择一项**:

- [ ] 【通过】允许版本冻结
- [ ] 【有条件通过】需修订以下需求项:
  - <!-- 列出需要修订的具体需求 -->
- [ ] 【不通过】禁止版本冻结，原因:
  - <!-- 列出不通过的具体原因 -->

---

## 审视人员签字

**审视人**: 
**日期**: ${new Date().toLocaleDateString('zh-CN')}

---

⚠️ **重要提醒**: 
- 禁止讨论规划是否正确
- 禁止提出新增需求
- 只判断 IT 是否忠实执行了既定规划
`;

    const r2Path = path.join(iterationDir, 'R2_版本审视报告.md');
    await fs.writeFile(r2Path, r2Template);

    // 记录审视启动
    await dialog.logDialog('review', 'start_r2', { type: 'R2审视', status: '已生成模板' });

    console.log(chalk.green('✓ R2 审视报告模板已生成'));
    console.log(chalk.cyan(`\n文件位置: ${r2Path}\n`));
    console.log(chalk.bold.yellow('━━━ 下一步操作 ━━━\n'));
    console.log(chalk.bold('请回到 AI 对话中，发送以下消息：'));
    console.log(chalk.cyan('  "请帮我执行 R2 审视，项目路径是 [当前目录]"'));
    console.log('');
    console.log('AI 将会：');
    console.log('  1. 读取 B3、IT 文档');
    console.log('  2. 检查 IT 用户故事是否忠实执行了 B3 规划');
    console.log('  3. 填写 R2 报告');
    console.log('  4. 展示结论让你决策');
    console.log('');
    console.log(chalk.gray('审视通过后，回到终端运行: prd version freeze'));
    console.log('');
}

function getR1Prompt() {
    return `你现在扮演【产品规划审视官】。

我将提供以下输入:
- A 类文档(产品现状与基线)
- B_规划文档(需求规划与拆解)

你的任务不是提出新方案，而是判断:
【这份规划是否有资格被冻结为 B3】

请严格按以下 5 个维度进行审视，并逐条给出判断依据:

1. 目标清晰性
   - 是否能用一句话说明本次规划要解决的核心问题
   - 是否存在多个不相关目标混杂

2. 场景真实性
   - 使用场景是否基于 A 类现状
   - 是否依赖当前不存在的能力

3. 现状一致性
   - 是否明确区分"已有能力改进"与"新增能力"
   - 是否存在从零重建的倾向

4. 范围收敛性
   - 是否明确说明"不做什么"
   - 是否存在明显范围膨胀风险

5. 版本化准备度
   - 是否已不再讨论"值不值得做"
   - 是否具备进入版本拆分的条件

最后，请给出唯一结论(三选一):
- 【通过】可冻结为 B3
- 【有条件通过】需补齐的明确项
- 【不通过】不可进入 B3

禁止输出任何新的需求或设计建议。`;
}

function getR2Prompt() {
    return `你现在扮演【版本一致性审视官】。

我将提供以下输入:
- B3(已冻结的规划文档)
- IT 文档(业务需求与技术规格)

你的任务不是评判方向，而是判断:
【IT 文档是否忠实执行了既定规划(B3)】

请严格按以下 6 个维度进行审视，并逐条给出判断依据:

1. 业务场景闭环（以终为始）
   - IT-BIZ 场景是否服务于 B3 核心目标
   - 是否引入了未定义的业务目标

2. 规划范围一致性
   - B2 需求项是否都有对应 IT
   - IT 是否包含 B2 没有的新增需求（Gap 检查）

3. 验收标准完整性
   - 每个 IT 是否有明确的业务验收标准
   - 是否包含体验验收标准

4. 细节与边界
   - 是否有异常处理和状态流转
   - 技术规格(DEV)是否关联了 A2UI 原型

5. 开发就绪状态
   - 研发是否能直接基于文档开发
   - 是否存在模棱两可的描述

6. 用户视角审查
   - 用户能否立即理解该功能
   - 是否真正解决了用户痛点

最后，请给出唯一结论(三选一):
- 【通过】允许版本冻结
- 【有条件通过】需修订的具体 IT 文档
- 【不通过】禁止版本冻结

禁止讨论规划是否正确，禁止提出新增需求。`;
}
