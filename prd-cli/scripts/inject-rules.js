/**
 * 规则注入工具
 * 
 * 用于在 workflow 文件头部注入规则子集表
 * 
 * 用法:
 *   node scripts/inject-rules.js              # 注入所有 workflow
 *   node scripts/inject-rules.js prd-c1       # 注入指定 workflow
 */

const fs = require('fs');
const path = require('path');

// 加载规则索引
function loadRules() {
    const rulesPath = path.join(__dirname, '../rules/index.json');
    return JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
}

// Scope 到 Workflow 的映射
const scopeToWorkflow = {
    'p0': 'prd-p0-project-info',
    'b1': 'prd-b1-planning-draft',
    'b2': 'prd-b2-planning-breakdown',
    'c1': 'prd-c1-requirement-list',
    'r1': 'prd-r1-review',
    'r2': 'prd-r2-review'
};

// 获取指定 scope 的规则
function getRulesForScope(rules, scope) {
    return rules.filter(rule =>
        rule.scope.includes(scope) || rule.scope.includes('global')
    );
}

// 生成规则表格 Markdown
function generateRulesTable(rules, scopeName) {
    const lines = [
        '',
        '---',
        '',
        '## 🚨 本阶段必须遵守的规则',
        '',
        '> ⚠️ AI 在执行任务前必须逐条确认以下规则。输出时需包含自检清单。',
        '',
        '| ID | 规则 | 严重程度 | 自检 |',
        '|----|------|----------|------|'
    ];

    rules.forEach(rule => {
        const severity = rule.severity === 'CRITICAL' ? '🔴 严重' :
            rule.severity === 'HIGH' ? '🟠 高' :
                rule.severity === 'MEDIUM' ? '🟡 中' : '🟢 低';
        lines.push(`| ${rule.id} | ${rule.description} | ${severity} | ☐ |`);
    });

    lines.push('');
    lines.push('**自检清单模板**（AI 输出时必须包含）：');
    lines.push('```');
    lines.push(`## ✅ 规则自检 (${scopeName})`);
    rules.forEach(rule => {
        lines.push(`- [ ] ${rule.id}: ${rule.description.substring(0, 30)}...`);
    });
    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('');

    return lines.join('\n');
}

// 在 workflow 文件中注入规则表格
function injectRulesToWorkflow(workflowPath, rules, scopeName) {
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // 检查是否已有规则表格
    if (content.includes('## 🚨 本阶段必须遵守的规则')) {
        console.log(`  跳过（已有规则表格）: ${path.basename(workflowPath)}`);
        return false;
    }

    // 找到第一个 # 标题的位置（跳过 frontmatter）
    const lines = content.split('\n');
    let insertIndex = 0;
    let inFrontmatter = false;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('---')) {
            if (!inFrontmatter) {
                inFrontmatter = true;
            } else {
                inFrontmatter = false;
            }
            continue;
        }

        // 找到第一个 # 开头的标题
        if (!inFrontmatter && lines[i].startsWith('# ')) {
            // 在标题之后插入
            insertIndex = i + 1;
            break;
        }
    }

    if (insertIndex === 0) {
        console.log(`  跳过（未找到标题）: ${path.basename(workflowPath)}`);
        return false;
    }

    // 生成规则表格
    const rulesTable = generateRulesTable(rules, scopeName);

    // 插入规则表格
    lines.splice(insertIndex, 0, rulesTable);

    fs.writeFileSync(workflowPath, lines.join('\n'));
    console.log(`  ✅ 已注入: ${path.basename(workflowPath)} (${rules.length} 条规则)`);
    return true;
}

// 主函数
function main() {
    const rulesIndex = loadRules();
    const workflowDir = path.join(__dirname, '../.agent/workflows');

    console.log('🔧 规则注入工具');
    console.log('');

    let injected = 0;
    let skipped = 0;

    // 遍历所有 scope
    for (const [scope, workflowName] of Object.entries(scopeToWorkflow)) {
        const workflowPath = path.join(workflowDir, `${workflowName}.md`);

        if (!fs.existsSync(workflowPath)) {
            console.log(`  跳过（文件不存在）: ${workflowName}.md`);
            skipped++;
            continue;
        }

        const rules = getRulesForScope(rulesIndex.rules, scope);

        if (injectRulesToWorkflow(workflowPath, rules, scope.toUpperCase())) {
            injected++;
        } else {
            skipped++;
        }
    }

    console.log('');
    console.log(`完成：注入 ${injected} 个，跳过 ${skipped} 个`);
}

// 导出函数供其他模块使用
module.exports = {
    loadRules,
    getRulesForScope,
    generateRulesTable,
    injectRulesToWorkflow
};

// 如果直接运行脚本
if (require.main === module) {
    main();
}
