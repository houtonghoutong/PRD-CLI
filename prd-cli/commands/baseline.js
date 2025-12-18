const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

module.exports = async function (action, type) {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        return;
    }

    const config = await fs.readJSON(configPath);
    const baselineDir = path.join(process.cwd(), '01_产品基线');

    if (action === 'create') {
        await createBaselineDoc(type, baselineDir, config, configPath);
    } else {
        console.log(chalk.red('✗ 未知操作'));
    }
};

async function createBaselineDoc(type, baselineDir, config, configPath) {
    const templates = {
        'A0': getA0Template(),
        'A1': getA1Template(),
        'A2': getA2Template(),
        'R0': getR0Template()
    };

    if (!templates[type]) {
        console.log(chalk.red(`✗ 未知的文档类型: ${type}`));
        console.log('可用类型: A0, A1, A2, R0');
        return;
    }

    const fileName = getFileName(type);
    const filePath = path.join(baselineDir, fileName);

    if (await fs.pathExists(filePath)) {
        console.log(chalk.yellow(`⚠ 文件已存在: ${fileName}`));
        return;
    }

    await fs.writeFile(filePath, templates[type]);

    // 更新配置
    config.stages.baseline.documents.push(type);
    await fs.writeJSON(configPath, config, { spaces: 2 });

    console.log(chalk.green(`✓ 已创建: ${fileName}`));
    console.log(chalk.cyan(`\n文件位置: ${filePath}\n`));

    // 给出下一步提示
    if (type === 'A0') {
        console.log(chalk.bold('下一步建议:'));
        console.log('1. 填写 A0 产品基础与范围说明');
        console.log('2. 创建 A1: prd baseline create A1');
    } else if (type === 'A1') {
        console.log(chalk.bold('下一步建议:'));
        console.log('1. 填写 A1 已上线功能与流程清单');
        console.log('2. 创建 A2: prd baseline create A2');
    } else if (type === 'A2') {
        console.log(chalk.bold('下一步建议:'));
        console.log('1. 填写 A2 存量反馈与数据汇总');
        console.log('2. 创建 R0 基线审视: prd baseline create R0');
    } else if (type === 'R0') {
        console.log(chalk.bold('下一步建议:'));
        console.log('1. 完成 R0 基线审视');
        console.log('2. 开始第一轮迭代: prd iteration new');
    }
    console.log('');
}

function getFileName(type) {
    const nameMap = {
        'A0': 'A0_产品基础与范围说明.md',
        'A1': 'A1_已上线功能与流程清单.md',
        'A2': 'A2_存量反馈与数据汇总.md',
        'R0': 'R0_基线审视报告.md'
    };
    return nameMap[type];
}

function getA0Template() {
    return `# A0_产品基础与范围说明

**文档创建时间**: ${new Date().toLocaleString('zh-CN')}

---

## 一、产品背景与定位

### 产品是什么
<!-- 用一句话描述此产品 -->

### 产品定位
<!-- 在整个业务体系中的角色 -->

---

## 二、目标用户定义

### 主要用户群体
<!-- 列出主要用户类型 -->

### 用户画像
<!-- 描述典型用户特征 -->

---

## 三、核心使用场景

### 场景一: 
<!-- 场景描述 -->

### 场景二:
<!-- 场景描述 -->

---

## 四、当前版本范围与边界

### 当前包含的能力
<!-- 列出已有的核心功能 -->

### 当前的技术架构
<!-- 简要说明技术实现方式 -->

---

## 五、明确不覆盖的内容

### 当前不支持的场景
<!-- 明确说明哪些场景不支持 -->

### 已知限制
<!-- 列出当前的限制条件 -->

---

## 填写说明

⚠️ **重要约束**:
- 不写规划、不写愿景
- 只描述"现在这个产品是什么样"
- 边界要写清楚(哪些能力没有、哪些不支持)

**目的**:
- 给 AI 和人一个统一的"现状语境"
- 防止后续规划"假设一个不存在的产品"
- 作为所有 B 规划的前置事实引用源
`;
}

function getA1Template() {
    return `# A1_已上线功能与流程清单

**文档创建时间**: ${new Date().toLocaleString('zh-CN')}

---

## 一、功能列表(按模块)

### 模块一: [模块名称]
- 功能 1.1: 
- 功能 1.2:

### 模块二: [模块名称]
- 功能 2.1:
- 功能 2.2:

---

## 二、核心用户路径

### 路径一: [路径名称]
1. 步骤 1
2. 步骤 2
3. 步骤 3

### 路径二: [路径名称]
1. 步骤 1
2. 步骤 2

---

## 三、关键业务流程节点

### 流程一:
<!-- 描述业务流程的关键节点 -->

---

## 四、功能之间的依赖关系

### 依赖关系图
<!-- 描述功能间的依赖 -->

---

## 填写说明

⚠️ **重要约束**:
- 功能是"客观存在的"，不是"设计过的"
- 用户路径用真实使用顺序，不用理想流程
- 不评价好坏，只陈述事实

**目的**:
- 让审视与规划基于真实系统
- 防止 AI 反复"重建已有能力"
- 为 R0 / R1 提供审视对象
`;
}

function getA2Template() {
    return `# A2_存量反馈与数据输入汇总

**文档创建时间**: ${new Date().toLocaleString('zh-CN')}

---

## 一、用户反馈摘要

### 反馈类型一: 
<!-- 摘要用户反馈内容 -->
- 来源: 
- 时间:

### 反馈类型二:
<!-- 摘要用户反馈内容 -->

---

## 二、数据异常或指标变化

### 异常一:
<!-- 描述数据异常情况 -->

---

## 三、内部问题/投诉

### 问题一:
<!-- 描述问题 -->
- 来源:
- 影响范围:

---

## 四、已知未解决事项

### 事项一:
<!-- 描述未解决的问题 -->
- 原因:
- 优先级:

---

## 填写说明

⚠️ **重要约束**:
- 不做结论、不做方案
- 可以是原始反馈的整理
- 标注来源即可

**目的**:
- 为 B 规划提供动因素材
- 防止规划"拍脑袋"
- 为 R 审视提供"现实校验"
`;
}

function getR0Template() {
    return `# R0_基线审视报告

**审视时间**: ${new Date().toLocaleString('zh-CN')}

---

## 一、审视范围说明

**审视对象**:
- A0_产品基础与范围说明.md
- A1_已上线功能与流程清单.md
- A2_存量反馈与数据汇总.md

**审视目标**:
建立产品基线，为后续迭代规划提供稳定的起点。

---

## 二、实际用户路径审视

### 主要用户路径梳理
<!-- 从头到尾走一遍系统，描述实际使用情况 -->

### 发现的路径问题
<!-- 列出用户路径中的断点、痛点 -->

---

## 三、主要问题与机会

### 问题清单
1. 
2.

### 机会点
1.
2.

---

## 四、风险与隐患

### 技术风险
<!-- 列出技术层面的风险 -->

### 业务风险
<!-- 列出业务层面的风险 -->

---

## 五、总体判断结论

**基线稳定性评估**:
- [ ] 可以作为稳定基线
- [ ] 需要先解决关键问题

**下一步建议**:
<!-- 给出后续规划建议 -->

---

## 填写说明

⚠️ **重要约束**:
- 必须"从头到尾走一遍系统"
- 问题基于事实，不基于偏好
- 结论是"是否适合作为稳定基线"

**目的**:
- 给存量系统建立一个起点基线
- 为第一次 B 规划提供"共识事实"
- 防止一上来就大改而不知问题在哪
`;
}
