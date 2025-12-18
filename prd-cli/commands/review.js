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

    // 检查必需文档
    const b1Path = path.join(iterationDir, 'B1_需求规划草案.md');
    const b2Path = path.join(iterationDir, 'B2_规划拆解与范围界定.md');

    if (!await fs.pathExists(b1Path) || !await fs.pathExists(b2Path)) {
        console.log(chalk.red('✗ 缺少必需的 B1 或 B2 文档'));
        return;
    }

    // ⭐ 支持预确认模式
    if (options.pmConfirmed) {
        console.log(chalk.green('✓ PM 已在对话中确认 B1B2 已填写完成，理解角色分工'));
    } else {
        // 交互式确认
        const canProceed = await confirm.confirmR1Review();
        if (!canProceed) {
            return;
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

    // 检查必需文档
    const b3Path = path.join(iterationDir, 'B3_规划冻结归档.md');
    const c0Path = path.join(iterationDir, 'C0_版本范围声明.md');
    const c1Path = path.join(iterationDir, 'C1_版本需求清单.md');

    if (!await fs.pathExists(b3Path) || !await fs.pathExists(c0Path) || !await fs.pathExists(c1Path)) {
        console.log(chalk.red('✗ 缺少必需的 B3、C0 或 C1 文档'));
        return;
    }

    // ⭐ 支持预确认模式
    if (options.pmConfirmed) {
        console.log(chalk.green('✓ PM 已在对话中确认 C0C1 已填写完成，理解角色分工'));
    } else {
        // 交互式确认
        const canProceed = await confirm.confirmR2Review();
        if (!canProceed) {
            return;
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
- C0_版本范围声明.md
- C1_版本需求清单.md

---

## 一、版本目标一致性

**审视标准**:
- C0 的版本目标是否能在 B3 中找到明确对应
- 是否存在规划外目标

**审视结果**:
<!-- AI 填写 -->

---

## 二、版本范围偏移检查

**审视标准**:
- 版本包含/不包含是否符合 B3 边界
- 是否存在隐性扩展或"顺手加戏"

**审视结果**:
<!-- AI 填写 -->

---

## 三、规划覆盖完整性

**审视标准**:
- B3 中的核心规划点是否在 C1 中得到体现
- 是否存在规划被版本拆没的情况

**审视结果**:
<!-- AI 填写 -->

---

## 四、需求粒度成熟度

**审视标准**:
- 每条需求是否达到版本级、可理解、可评估
- 是否仍停留在规划语言

**审视结果**:
<!-- AI 填写 -->

---

## 五、进入执行准备度

**审视标准**:
- 是否已不再需要产品侧做判断决策
- 是否只剩实现与执行问题

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
- 只判断版本是否忠实执行了既定规划
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
    console.log('  1. 读取 B3、C0、C1 文档');
    console.log('  2. 检查版本是否偏离规划');
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
- B1 / B2(需求规划草案与拆解)

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
- C0 / C1(版本范围与版本需求清单)

你的任务不是评判方向，而是判断:
【该版本是否忠实执行了既定规划】

请严格按以下 5 个维度进行审视，并逐条给出判断依据:

1. 版本目标一致性
   - C0 的版本目标是否能在 B3 中找到明确对应
   - 是否存在规划外目标

2. 版本范围偏移检查
   - 版本包含/不包含是否符合 B3 边界
   - 是否存在隐性扩展或"顺手加戏"

3. 规划覆盖完整性
   - B3 中的核心规划点是否在 C1 中得到体现
   - 是否存在规划被版本拆没的情况

4. 需求粒度成熟度
   - 每条需求是否达到版本级、可理解、可评估
   - 是否仍停留在规划语言

5. 进入执行准备度
   - 是否已不再需要产品侧做判断决策
   - 是否只剩实现与执行问题

最后，请给出唯一结论(三选一):
- 【通过】允许版本冻结
- 【有条件通过】需修订的具体需求项
- 【不通过】禁止版本冻结

禁止讨论规划是否正确，禁止提出新增需求。`;
}
