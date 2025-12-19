const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * 生成或更新 P1 迭代索引
 * 自动从文档元信息汇总生成索引
 */
module.exports = async function () {
    const configPath = path.join(process.cwd(), '.prd-config.json');

    if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('✗ 当前目录不是一个 PRD 项目'));
        return;
    }

    const config = await fs.readJSON(configPath);

    console.log(chalk.blue('正在生成迭代索引...'));

    // 扫描所有迭代目录
    const iterationBaseDir = path.join(process.cwd(), '02_迭代记录');
    const iterations = [];

    if (await fs.pathExists(iterationBaseDir)) {
        const dirs = await fs.readdir(iterationBaseDir);

        for (const dir of dirs) {
            const iterationDir = path.join(iterationBaseDir, dir);
            const stat = await fs.stat(iterationDir);

            if (stat.isDirectory() && dir.match(/第\d+轮迭代/)) {
                const iterationData = await extractIterationInfo(iterationDir, dir);
                iterations.push(iterationData);
            }
        }
    }

    // 生成 P1 索引文档
    const p1Content = generateP1Index(iterations, config);
    const p1Path = path.join(process.cwd(), '00_项目总览/P1_迭代索引.md');

    await fs.writeFile(p1Path, p1Content);

    console.log(chalk.green('✓ P1 迭代索引已生成'));
    console.log(chalk.cyan(`文件位置: ${p1Path}\n`));
};

/**
 * 提取单个迭代的信息
 */
async function extractIterationInfo(iterationDir, dirName) {
    const iterationNumber = dirName.match(/第(\d+)轮迭代/)[1];

    const iteration = {
        number: parseInt(iterationNumber),
        name: dirName,
        documents: {
            R1: null,
            B1: null,
            B2: null,
            B3: null,
            R2: null,
            C0: null,
            C1: null,
            C2: null,
            C3: null
        },
        status: 'unknown',
        createdAt: null,
        frozenAt: null
    };

    // 扫描文档
    const files = await fs.readdir(iterationDir);

    for (const file of files) {
        const filePath = path.join(iterationDir, file);

        if (file.includes('R1_')) iteration.documents.R1 = file;
        if (file.includes('B1_')) iteration.documents.B1 = file;
        if (file.includes('B2_')) iteration.documents.B2 = file;
        if (file.includes('B3_')) {
            iteration.documents.B3 = file;
            // 读取冻结时间
            const content = await fs.readFile(filePath, 'utf-8');
            const match = content.match(/冻结时间[:\s]*([^\n]+)/);
            if (match) iteration.frozenAt = match[1].trim();
        }
        if (file.includes('R2_')) iteration.documents.R2 = file;
        if (file.includes('C0_')) iteration.documents.C0 = file;
        if (file.includes('C1_')) iteration.documents.C1 = file;
        if (file.includes('C2_')) iteration.documents.C2 = file;
        if (file.includes('C3_')) {
            iteration.documents.C3 = file;
            if (!iteration.frozenAt) {
                const content = await fs.readFile(filePath, 'utf-8');
                const match = content.match(/冻结时间[:\s]*([^\n]+)/);
                if (match) iteration.frozenAt = match[1].trim();
            }
        }
    }

    // 判断状态
    iteration.status = determineIterationStatus(iteration.documents);

    return iteration;
}

/**
 * 判断迭代状态
 */
function determineIterationStatus(docs) {
    if (docs.C3) return '✅ 已完成';
    if (docs.C1 || docs.C0) return '🔄 版本阶段';
    if (docs.B3) return '📋 规划已冻结';
    if (docs.B2 || docs.B1) return '💡 规划中';
    return '🆕 刚启动';
}

/**
 * 生成 P1 索引内容
 */
function generateP1Index(iterations, config) {
    const now = new Date().toLocaleString('zh-CN');

    let content = `# P1_迭代索引

**生成时间**: ${now}
**项目名称**: ${config.projectName}
**当前迭代**: 第 ${config.currentIteration} 轮

---

## 📋 索引说明

本文档自动生成，提供所有迭代的快速导航。

**作用**:
- 快速了解项目迭代历史
- 查看每轮迭代的文档完整性
- 追踪冻结点和版本关系

---

## 🔄 迭代总览

**总迭代数**: ${iterations.length} 轮
**已完成**: ${iterations.filter(i => i.status === '✅ 已完成').length} 轮
**进行中**: ${iterations.filter(i => i.status !== '✅ 已完成').length} 轮

---

## 📊 迭代清单

`;

    // 为每个迭代生成条目
    for (const iter of iterations.sort((a, b) => a.number - b.number)) {
        content += generateIterationEntry(iter);
    }

    content += `\n---

## 🔍 文档完整性检查

`;

    // 文档完整性统计
    content += generateCompletenessCheck(iterations);

    content += `\n---

## ⚠️ 违规检查

`;

    // 违规链路检查
    content += generateViolationCheck(iterations);

    content += `\n---

## 📝 下一步

`;

    if (config.currentIteration === 0) {
        content += `- 创建基线文档（A0/A1/A2）\n`;
        content += `- 执行 R0 基线审视\n`;
        content += `- 开始第一轮迭代：\`prd iteration new\`\n`;
    } else {
        const current = iterations.find(i => i.number === config.currentIteration);
        if (current) {
            content += generateNextSteps(current);
        }
    }

    content += `\n---

**此文档由 AI 自动生成，请勿手动编辑索引部分。**
**如需更新，运行：\`prd status\` 或 \`prd index update\`**
`;

    return content;
}

/**
 * 生成单个迭代条目
 */
function generateIterationEntry(iter) {
    let entry = `### 第 ${iter.number} 轮迭代 ${iter.status}\n\n`;

    if (iter.frozenAt) {
        entry += `**冻结时间**: ${iter.frozenAt}\n\n`;
    }

    entry += `**文档清单**:\n\n`;
    entry += `| 阶段 | 文档 | 状态 |\n`;
    entry += `|-----|-----|-----|\n`;

    const stages = [
        { key: 'R1', name: 'R1 规划审视' },
        { key: 'B1', name: 'B1 规划草案' },
        { key: 'B2', name: 'B2 规划拆解' },
        { key: 'B3', name: 'B3 规划冻结' },
        { key: 'R2', name: 'R2 版本审视' },
        { key: 'C0', name: 'C0 版本范围' },
        { key: 'C1', name: 'C1 版本需求' },
        { key: 'C2', name: 'C2 版本变更' },
        { key: 'C3', name: 'C3 版本冻结' }
    ];

    for (const stage of stages) {
        const exists = iter.documents[stage.key];
        entry += `| ${stage.name} | ${exists || '-'} | ${exists ? '✅' : '○'} |\n`;
    }

    entry += `\n**关系映射**:\n`;
    if (iter.documents.B3) {
        entry += `- B3（规划）`;
        if (iter.documents.C0 || iter.documents.C1) {
            entry += ` → C0/C1（版本）`;
        }
        if (iter.documents.C3) {
            entry += ` → C3（冻结）`;
        }
        entry += `\n`;
    }

    entry += `\n**文档位置**: \`02_迭代记录/${iter.name}/\`\n\n`;
    entry += `---\n\n`;

    return entry;
}

/**
 * 文档完整性检查
 */
function generateCompletenessCheck(iterations) {
    let check = ``;

    for (const iter of iterations) {
        const issues = [];

        // 检查 B3 → C 的链路
        if (iter.documents.B3 && !(iter.documents.C0 || iter.documents.C1)) {
            issues.push('⚠️ 有 B3 但缺少 C0/C1');
        }

        // 检查 C1 → C3 的链路
        if (iter.documents.C1 && !iter.documents.C3) {
            issues.push('⚠️ 有 C1 但未冻结为 C3');
        }

        // 检查 R1
        if ((iter.documents.B1 || iter.documents.B2) && !iter.documents.R1) {
            issues.push('💡 提示：建议执行 R1 审视');
        }

        // 检查 R2
        if (iter.documents.C1 && !iter.documents.R2) {
            issues.push('💡 提示：建议执行 R2 审视');
        }

        if (issues.length > 0) {
            check += `**第 ${iter.number} 轮迭代**:\n`;
            for (const issue of issues) {
                check += `- ${issue}\n`;
            }
            check += `\n`;
        }
    }

    if (check === '') {
        check = `✅ 所有迭代文档完整，无缺失。\n`;
    }

    return check;
}

/**
 * 违规检查
 */
function generateViolationCheck(iterations) {
    let violations = ``;

    for (const iter of iterations) {
        const issues = [];

        // 检查"未冻结却进入下游"
        if (!iter.documents.B3 && (iter.documents.C0 || iter.documents.C1)) {
            issues.push('🔴 违规：没有 B3 但创建了 C0/C1（违反规范）');
        }

        if (!iter.documents.C3 && iter.number < Math.max(...iterations.map(i => i.number))) {
            // 不是最新迭代但没有 C3
            issues.push('⚠️ 注意：迭代未完成就启动了新轮次');
        }

        if (issues.length > 0) {
            violations += `**第 ${iter.number} 轮迭代**:\n`;
            for (const issue of issues) {
                violations += `- ${issue}\n`;
            }
            violations += `\n`;
        }
    }

    if (violations === '') {
        violations = `✅ 未发现违规链路。\n`;
    }

    return violations;
}

/**
 * 生成下一步建议
 */
function generateNextSteps(current) {
    let steps = `**当前迭代（第 ${current.number} 轮）下一步**:\n\n`;

    if (current.status === '✅ 已完成') {
        steps += `- 当前迭代已完成\n`;
        steps += `- 如需新迭代：\`prd iteration new\`\n`;
    } else if (current.status === '📋 规划已冻结') {
        steps += `- 创建版本范围：\`prd version create C0\`\n`;
        steps += `- 创建版本需求：\`prd version create C1\`\n`;
    } else if (current.status === '💡 规划中') {
        if (!current.documents.R1) {
            steps += `- 执行 R1 审视：\`prd review r1\`\n`;
        }
        if (current.documents.B2 && !current.documents.B3) {
            steps += `- 冻结规划：\`prd plan freeze\`\n`;
        }
    } else if (current.status === '🔄 版本阶段') {
        if (!current.documents.R2) {
            steps += `- 执行 R2 审视：\`prd review r2\`\n`;
        }
        if (current.documents.R2 && !current.documents.C3) {
            steps += `- 冻结版本：\`prd version freeze\`\n`;
        }
    }

    return steps;
}
