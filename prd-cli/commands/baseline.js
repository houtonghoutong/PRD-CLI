const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * 基线管理命令 (v2.0.0)
 * 支持中文参数：产品定义、代码快照、用户反馈
 */
module.exports = async function (action, type, options = {}) {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        return;
    }

    const config = await fs.readJSON(configPath);

    // 支持新旧两种目录名
    let baselineDir = path.join(process.cwd(), '01_基线');
    if (!await fs.pathExists(baselineDir)) {
        baselineDir = path.join(process.cwd(), '01_产品基线');
    }
    await fs.ensureDir(baselineDir);

    if (action === 'create') {
        await createBaselineDoc(type, baselineDir, config, configPath, options);
    } else {
        console.log(chalk.red('✗ 未知操作'));
    }
};

// 中文名称到内部类型的映射
const typeMap = {
    '产品定义': 'product',
    '代码快照': 'codebase',
    '用户反馈': 'feedback',
    // 兼容旧版
    'A0': 'product',
    'A1': 'codebase',
    'A2': 'feedback'
};

// 类型到文件名的映射
const fileNameMap = {
    'product': '产品定义.md',
    'codebase': '代码快照.md',
    'feedback': '用户反馈.md'
};

async function createBaselineDoc(type, baselineDir, config, configPath, options = {}) {
    const internalType = typeMap[type];

    if (!internalType) {
        console.log(chalk.red(`✗ 未知的文档类型: ${type}`));
        console.log('可用类型: 产品定义, 代码快照, 用户反馈');
        console.log(chalk.gray('（兼容旧版: A0, A1, A2）'));
        return;
    }

    const fileName = fileNameMap[internalType];
    const filePath = path.join(baselineDir, fileName);

    if (await fs.pathExists(filePath)) {
        console.log(chalk.yellow(`⚠ 文件已存在: ${fileName}`));
        return;
    }

    // 根据类型获取模板
    let template;
    switch (internalType) {
        case 'product':
            template = getProductTemplate();
            break;
        case 'codebase':
            template = getCodebaseTemplate();
            break;
        case 'feedback':
            template = getFeedbackTemplate();
            break;
    }

    await fs.writeFile(filePath, template);

    // 更新配置
    config.stages.baseline.documents.push(internalType);
    await fs.writeJSON(configPath, config, { spaces: 2 });

    console.log(chalk.green(`✓ 已创建: ${fileName}`));
    console.log(chalk.cyan(`\n文件位置: ${filePath}\n`));

    // 给出下一步提示
    if (internalType === 'product') {
        console.log(chalk.bold('下一步建议:'));
        console.log('1. 填写产品定义（与 AI 对话完成）');
        console.log('2. 创建代码快照: prd baseline create 代码快照');
        console.log(chalk.yellow('\n💡 提示: 使用 /prd-代码快照 工作流让 AI 自动扫描代码生成'));
    } else if (internalType === 'codebase') {
        console.log(chalk.bold('⚠️ 重要提醒:'));
        console.log(chalk.yellow('代码快照应由 AI 扫描代码自动生成，而非手动填写！'));
        console.log('\n使用 /prd-代码快照 工作流让 AI 扫描代码。');
        console.log('\n下一步建议:');
        console.log('1. 创建用户反馈: prd baseline create 用户反馈');
    } else if (internalType === 'feedback') {
        console.log(chalk.bold('下一步建议:'));
        console.log('1. 整理用户反馈（可让 AI 协助）');
        console.log('2. 开始第一轮迭代: prd iteration new');
    }
    console.log('');
}

function getProductTemplate() {
    return `# 产品定义

**创建时间**: ${new Date().toLocaleString('zh-CN')}

---

## 1. 产品是什么

<!-- 用一句话描述此产品 -->


## 2. 产品定位

<!-- 在整个业务体系中的角色 -->


---

## 3. 目标用户

### 主要用户群体

<!-- 列出主要用户类型 -->


### 用户画像

<!-- 描述典型用户特征 -->


---

## 4. 核心使用场景

### 场景一: [场景名称]

<!-- 场景描述 -->


### 场景二: [场景名称]

<!-- 场景描述 -->


---

## 5. 当前能力范围

### 已有的核心功能

<!-- 列出已有的核心功能 -->


### 当前技术架构

<!-- 简要说明技术实现方式 -->


---

## 6. 明确不做的事情

### 不支持的场景

<!-- 明确说明哪些场景不支持 -->


### 已知限制

<!-- 列出当前的限制条件 -->


---

## 填写说明

⚠️ **重要约束**:
- 不写规划、不写愿景
- 只描述"现在这个产品是什么样"
- 边界要写清楚（哪些能力没有、哪些不支持）

**目的**:
- 给 AI 和人一个统一的"现状语境"
- 防止后续规划"假设一个不存在的产品"
- 作为所有规划的前置事实引用源
`;
}

function getCodebaseTemplate() {
    return `# 代码快照

**创建时间**: ${new Date().toLocaleString('zh-CN')}

---

> ⚠️ **本文件应由 AI 扫描代码自动生成，请勿手动维护！**
> 
> 使用 /prd-代码快照 工作流让 AI 扫描代码。

---

## 1. 项目概览

**项目类型**: [前端/后端/全栈/CLI]
**技术栈**: [React/Vue/Express/...]
**入口文件**: [...]

---

## 2. 功能清单

### 2.1 [模块A]

| 功能 | 路径/入口 | 说明 |
|-----|----------|------|
| 功能1 | \`src/xxx\` | ... |
| 功能2 | \`src/yyy\` | ... |

### 2.2 [模块B]

...

---

## 3. API 清单（如有）

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | /api/xxx | ... |
| POST | /api/yyy | ... |

---

## 4. 核心用户路径

### 路径 1: [路径名称]

1. 步骤 1
2. 步骤 2
3. 步骤 3

---

## 5. 依赖关系

### 模块间依赖

<!-- 描述功能间的依赖 -->

---

## 扫描日志

- 最后扫描时间: ___
- 扫描范围: ___
- 识别功能点: ___ 个
- 识别 API: ___ 个
`;
}

function getFeedbackTemplate() {
    return `# 用户反馈

**创建时间**: ${new Date().toLocaleString('zh-CN')}

---

## 1. 用户反馈摘要

### 反馈 1: [标题]

- **来源**: 
- **时间**: 
- **内容**: 

### 反馈 2: [标题]

- **来源**: 
- **时间**: 
- **内容**: 

---

## 2. 数据异常或指标变化

### 异常 1: [标题]

- **发现时间**: 
- **具体表现**: 
- **影响范围**: 

---

## 3. 内部问题/投诉

### 问题 1: [标题]

- **来源**: 
- **描述**: 
- **影响范围**: 

---

## 4. 已知未解决事项

### 事项 1: [标题]

- **原因**: 
- **优先级**: P0 / P1 / P2

---

## 5. 待下版事项

> 当规划/版本讨论过程中产生了新需求，但超出当前版本范围时，
> 记录在此章节，等待下一轮迭代时纳入规划。

### 待下版 #1: [需求标题]

**来源**: 第 XX 轮迭代讨论
**原因**: 超出首版范围，延后处理
**优先级**: P0 / P1 / P2
**详细描述**: 

---

## 填写说明

⚠️ **重要约束**:
- 不做结论、不做方案
- 可以是原始反馈的整理
- 标注来源即可

**目的**:
- 为规划提供动因素材
- 防止规划"拍脑袋"
- 暂存超范围需求（待下版处理）
`;
}
