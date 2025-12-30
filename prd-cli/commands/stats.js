/**
 * prd stats - 规则统计命令
 * 
 * 基于 .prd-logs/check-history.json 生成统计报告
 * 
 * 用法:
 *   prd stats              # 显示统计报告
 *   prd stats --json       # 输出 JSON 格式
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 加载日志历史
function loadHistory() {
    const logPath = path.join(process.cwd(), '.prd-logs', 'check-history.json');
    if (!fs.existsSync(logPath)) {
        return [];
    }
    try {
        return JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    } catch (e) {
        return [];
    }
}

// 加载规则索引
function loadRules() {
    const rulesPath = path.join(__dirname, '../rules/index.json');
    if (!fs.existsSync(rulesPath)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
}

// 生成统计报告
function generateStats(history) {
    const stats = {
        totalChecks: history.length,
        passRate: 0,
        firstPassRate: 0,
        violationsByRule: {},
        warningsByRule: {},
        recentTrend: []
    };

    if (history.length === 0) {
        return stats;
    }

    // 计算通过率
    const passed = history.filter(h => h.passed).length;
    stats.passRate = Math.round((passed / history.length) * 100);

    // 合并所有违规统计
    history.forEach(h => {
        if (h.violations_by_rule) {
            Object.entries(h.violations_by_rule).forEach(([rule, count]) => {
                stats.violationsByRule[rule] = (stats.violationsByRule[rule] || 0) + count;
            });
        }
        if (h.warnings_by_rule) {
            Object.entries(h.warnings_by_rule).forEach(([rule, count]) => {
                stats.warningsByRule[rule] = (stats.warningsByRule[rule] || 0) + count;
            });
        }
    });

    // 最近 7 天趋势
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recent = history.filter(h => new Date(h.timestamp) >= sevenDaysAgo);

    // 按天分组
    const byDay = {};
    recent.forEach(h => {
        const day = h.timestamp.split('T')[0];
        if (!byDay[day]) {
            byDay[day] = { total: 0, passed: 0, violations: 0 };
        }
        byDay[day].total++;
        if (h.passed) byDay[day].passed++;
        byDay[day].violations += h.summary?.violations || 0;
    });

    stats.recentTrend = Object.entries(byDay).map(([date, data]) => ({
        date,
        checks: data.total,
        passRate: Math.round((data.passed / data.total) * 100),
        violations: data.violations
    })).sort((a, b) => a.date.localeCompare(b.date));

    return stats;
}

// 打印报告
function printReport(stats, rulesIndex) {
    console.log('');
    console.log(chalk.bold('📊 PRD 规则统计报告'));
    console.log('─'.repeat(50));
    console.log('');

    // 总体统计
    console.log(chalk.blue('📈 总体统计'));
    console.log(`   总检查次数: ${stats.totalChecks}`);
    console.log(`   通过率: ${stats.passRate}%`);
    console.log('');

    // 高频违规规则 Top 5
    const topViolations = Object.entries(stats.violationsByRule)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (topViolations.length > 0) {
        console.log(chalk.red('🔴 高频违规规则 Top 5'));
        topViolations.forEach(([ruleId, count], i) => {
            const rule = rulesIndex?.rules?.find(r => r.id === ruleId);
            const desc = rule?.description?.substring(0, 30) || '未知规则';
            console.log(`   ${i + 1}. [${ruleId}] ${desc}... (${count} 次)`);
        });
        console.log('');
    }

    // 高频警告规则 Top 5
    const topWarnings = Object.entries(stats.warningsByRule)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (topWarnings.length > 0) {
        console.log(chalk.yellow('🟡 高频警告规则 Top 5'));
        topWarnings.forEach(([ruleId, count], i) => {
            const rule = rulesIndex?.rules?.find(r => r.id === ruleId);
            const desc = rule?.description?.substring(0, 30) || '未知规则';
            console.log(`   ${i + 1}. [${ruleId}] ${desc}... (${count} 次)`);
        });
        console.log('');
    }

    // 最近 7 天趋势
    if (stats.recentTrend.length > 0) {
        console.log(chalk.cyan('📅 最近 7 天趋势'));
        console.log('   日期       | 检查 | 通过率 | 违规');
        console.log('   -----------|------|--------|------');
        stats.recentTrend.forEach(day => {
            const passRateBar = day.passRate >= 80 ? chalk.green(`${day.passRate}%`) :
                day.passRate >= 50 ? chalk.yellow(`${day.passRate}%`) :
                    chalk.red(`${day.passRate}%`);
            console.log(`   ${day.date} | ${String(day.checks).padStart(4)} | ${passRateBar.padStart(6)} | ${day.violations}`);
        });
        console.log('');
    }

    // 建议
    if (topViolations.length > 0) {
        console.log(chalk.green('💡 改进建议'));
        const topRule = topViolations[0][0];
        const rule = rulesIndex?.rules?.find(r => r.id === topRule);
        if (rule) {
            console.log(`   最需要关注的规则: [${topRule}]`);
            console.log(`   ${rule.description}`);
            if (rule.validatorType === 'program') {
                console.log(chalk.gray(`   该规则由 prd check 自动校验`));
            } else {
                console.log(chalk.gray(`   该规则需要 AI 自检，请确保 AI 阅读了 workflow 中的规则表`));
            }
        }
        console.log('');
    }
}

// 主函数
async function runStats(options = {}) {
    const history = loadHistory();
    const rulesIndex = loadRules();

    if (history.length === 0) {
        console.log(chalk.yellow('⚠️  暂无校验历史记录'));
        console.log(chalk.gray('   运行 `prd check` 后会自动记录日志'));
        return;
    }

    const stats = generateStats(history);

    if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
    } else {
        printReport(stats, rulesIndex);
    }
}

module.exports = runStats;
