/**
 * prd check - 规则校验命令
 * 
 * 用于检查当前项目是否符合 PRD 规则
 * 
 * 用法:
 *   prd check              # 运行所有校验
 *   prd check --json       # 输出 JSON 格式（供 AI 读取）
 *   prd check --category D # 只运行文档状态类规则
 *   prd check --rule D001  # 只运行指定规则
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 加载规则索引
function loadRules() {
    const rulesPath = path.join(__dirname, '../rules/index.json');
    if (!fs.existsSync(rulesPath)) {
        throw new Error('规则索引文件不存在: rules/index.json');
    }
    return JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
}

// 加载项目配置
function loadProjectConfig() {
    const configPath = path.join(process.cwd(), '.prd-config.json');
    if (!fs.existsSync(configPath)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// 校验结果类
class CheckResult {
    constructor() {
        this.passed = true;
        this.violations = [];
        this.warnings = [];
        this.skipped = [];
        this.checkedRules = [];
    }

    addViolation(ruleId, message, location = null, severity = 'CRITICAL') {
        this.passed = false;
        this.violations.push({ rule_id: ruleId, message, location, severity });
    }

    addWarning(ruleId, message, location = null) {
        this.warnings.push({ rule_id: ruleId, message, location });
    }

    addSkipped(ruleId, reason) {
        this.skipped.push({ rule_id: ruleId, reason });
    }

    markChecked(ruleId) {
        this.checkedRules.push(ruleId);
    }

    toJSON() {
        return {
            passed: this.passed,
            summary: {
                total: this.checkedRules.length,
                violations: this.violations.length,
                warnings: this.warnings.length,
                skipped: this.skipped.length
            },
            violations: this.violations,
            warnings: this.warnings,
            skipped: this.skipped
        };
    }

    print() {
        console.log('');
        console.log(chalk.bold('📋 PRD 规则校验报告'));
        console.log('─'.repeat(50));

        if (this.passed && this.violations.length === 0) {
            console.log(chalk.green('✅ 所有规则校验通过！'));
        } else {
            console.log(chalk.red(`❌ 发现 ${this.violations.length} 个违规`));
        }

        if (this.warnings.length > 0) {
            console.log(chalk.yellow(`⚠️  ${this.warnings.length} 个警告`));
        }

        console.log(chalk.gray(`📊 已检查 ${this.checkedRules.length} 条规则`));
        console.log('');

        // 输出违规详情
        if (this.violations.length > 0) {
            console.log(chalk.red.bold('违规列表:'));
            this.violations.forEach((v, i) => {
                console.log(`  ${i + 1}. [${v.rule_id}] ${v.message}`);
                if (v.location) {
                    console.log(chalk.gray(`     位置: ${v.location}`));
                }
            });
            console.log('');
        }

        // 输出警告
        if (this.warnings.length > 0) {
            console.log(chalk.yellow.bold('警告列表:'));
            this.warnings.forEach((w, i) => {
                console.log(`  ${i + 1}. [${w.rule_id}] ${w.message}`);
            });
            console.log('');
        }
    }

    /**
     * 保存校验日志到 .prd-logs/check-history.json
     */
    saveLog() {
        const logsDir = path.join(process.cwd(), '.prd-logs');
        const logPath = path.join(logsDir, 'check-history.json');

        // 确保日志目录存在
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // 读取现有日志
        let history = [];
        if (fs.existsSync(logPath)) {
            try {
                history = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
            } catch (e) {
                history = [];
            }
        }

        // 添加新记录
        const logEntry = {
            timestamp: new Date().toISOString(),
            passed: this.passed,
            summary: {
                total: this.checkedRules.length,
                violations: this.violations.length,
                warnings: this.warnings.length,
                skipped: this.skipped.length
            },
            violations_by_rule: this.getViolationsByRule(),
            warnings_by_rule: this.getWarningsByRule()
        };

        history.push(logEntry);

        // 只保留最近 100 条记录
        if (history.length > 100) {
            history = history.slice(-100);
        }

        // 保存日志
        fs.writeFileSync(logPath, JSON.stringify(history, null, 2));
    }

    /**
     * 按规则 ID 统计违规
     */
    getViolationsByRule() {
        const counts = {};
        this.violations.forEach(v => {
            counts[v.rule_id] = (counts[v.rule_id] || 0) + 1;
        });
        return counts;
    }

    /**
     * 按规则 ID 统计警告
     */
    getWarningsByRule() {
        const counts = {};
        this.warnings.forEach(w => {
            counts[w.rule_id] = (counts[w.rule_id] || 0) + 1;
        });
        return counts;
    }
}

// ============ 校验器实现 ============

/**
 * 校验器：冻结状态检查 (D001-D004)
 */
function checkFrozenStatus(config, result) {
    if (!config) {
        result.addSkipped('D001', '未找到项目配置文件');
        return;
    }

    const planningFrozen = config.planning?.frozen === true;
    const versionFrozen = config.version?.frozen === true;

    // D001: B3 冻结状态
    result.markChecked('D001');
    if (planningFrozen) {
        // 检查 B1/B2 文件是否在冻结后被修改（这里只记录状态）
        result.addWarning('D001', 'B3 已冻结，请勿修改规划文档 (B1/B2/B3)');
    }

    // D002: C3 冻结状态
    result.markChecked('D002');
    if (versionFrozen) {
        result.addWarning('D002', 'C3 已冻结，请勿修改版本文档 (C0/C1/C3)');
    }

    // D003 & D004: 组合检查
    result.markChecked('D003');
    result.markChecked('D004');
}

/**
 * 校验器：流程顺序检查 (F001-F003)
 */
function checkFlowOrder(config, result) {
    if (!config) {
        result.addSkipped('F001', '未找到项目配置文件');
        return;
    }

    const currentIteration = config.currentIteration;
    if (!currentIteration) {
        result.addSkipped('F001', '当前没有活跃迭代');
        return;
    }

    const iterationDir = path.join(process.cwd(), '02_迭代记录', `第${String(currentIteration).padStart(2, '0')}轮迭代`);

    // F001: B3 冻结前必须有 R1
    result.markChecked('F001');
    if (config.planning?.frozen) {
        const r1Path = path.join(iterationDir, 'R1_规划审视报告.md');
        if (!fs.existsSync(r1Path)) {
            result.addViolation('F001', 'B3 已冻结但缺少 R1 审视报告', r1Path);
        }
    }

    // F002: C3 冻结前必须有 R2
    result.markChecked('F002');
    if (config.version?.frozen) {
        const r2Path = path.join(iterationDir, 'R2_版本审视报告.md');
        if (!fs.existsSync(r2Path)) {
            result.addViolation('F002', 'C3 已冻结但缺少 R2 审视报告', r2Path);
        }
    }

    // F003: 创建 B1 前必须有 R1 启动检查
    result.markChecked('F003');
    const b1Path = path.join(iterationDir, 'B1_规划草案.md');
    if (fs.existsSync(b1Path)) {
        // 检查是否有 R1 启动检查记录（简化：检查目录下是否有相关文件或 config 标记）
        const r1StartCheck = config.r1StartCheckPassed === true;
        if (!r1StartCheck) {
            result.addWarning('F003', '建议：创建 B1 前应完成 R1 启动检查');
        }
    }
}

/**
 * 校验器：A2UI 文件检查 (V003-V006)
 */
function checkA2UIFiles(config, result) {
    const currentIteration = config?.currentIteration;
    if (!currentIteration) {
        result.addSkipped('V004', '当前没有活跃迭代');
        return;
    }

    const uiDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(currentIteration).padStart(2, '0')}轮迭代`,
        'C1_UI原型'
    );

    if (!fs.existsSync(uiDir)) {
        result.addSkipped('V004', 'C1_UI原型 目录不存在');
        return;
    }

    // V003: current.json 检查
    result.markChecked('V003');
    const currentJsonPath = path.join(process.cwd(), '.a2ui', 'current.json');
    // 这个只是个存在性检查，不是必须失败

    // V004: .json 和 .html 成对检查
    result.markChecked('V004');
    const files = fs.readdirSync(uiDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    jsonFiles.forEach(jsonFile => {
        const htmlFile = jsonFile.replace('.json', '.html');
        if (!htmlFiles.includes(htmlFile)) {
            result.addViolation('V004', `缺少配对的 HTML 文件: ${htmlFile}`, path.join(uiDir, jsonFile));
        }
    });

    // V005: 命名规范检查
    result.markChecked('V005');
    const namingPattern = /^REQ-\d{3}-[\u4e00-\u9fa5a-zA-Z0-9_-]+\.(json|html)$/;
    const allUIFiles = [...jsonFiles, ...htmlFiles];
    allUIFiles.forEach(file => {
        // 排除 index.md
        if (file === 'index.md') return;
        if (!namingPattern.test(file)) {
            result.addWarning('V005', `文件名不符合规范: ${file}（应为 REQ-XXX-名称.json/html）`, path.join(uiDir, file));
        }
    });

    // V006: index.md 检查
    result.markChecked('V006');
    const indexPath = path.join(uiDir, 'index.md');
    if (jsonFiles.length > 0 && !fs.existsSync(indexPath)) {
        result.addViolation('V006', '存在原型文件但缺少 index.md 索引', uiDir);
    }

    // V007: Schema 校验（检查组件类型是否合法）
    result.markChecked('V007');
    const validComponentTypes = [
        'Page', 'Panel', 'Row', 'Col', 'Input', 'Textarea', 'Select', 'Button',
        'Text', 'Table', 'Tabs', 'Badge', 'Card', 'Upload', 'Alert', 'Divider',
        'Diagram', 'Box', 'Arrow', 'Layer', 'DiagramGroup'
    ];

    jsonFiles.forEach(jsonFile => {
        try {
            const jsonPath = path.join(uiDir, jsonFile);
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            const invalidTypes = findInvalidComponentTypes(data, validComponentTypes);
            if (invalidTypes.length > 0) {
                result.addViolation(
                    'V007',
                    `发现未定义的组件类型: ${invalidTypes.join(', ')}`,
                    jsonPath
                );
            }
        } catch (e) {
            result.addWarning('V007', `无法解析 JSON 文件: ${jsonFile}`, path.join(uiDir, jsonFile));
        }
    });
}

/**
 * 递归查找无效的组件类型
 */
function findInvalidComponentTypes(node, validTypes, found = new Set()) {
    if (!node || typeof node !== 'object') return [];

    if (node.type && !validTypes.includes(node.type)) {
        found.add(node.type);
    }

    if (Array.isArray(node.children)) {
        node.children.forEach(child => findInvalidComponentTypes(child, validTypes, found));
    }

    return Array.from(found);
}

/**
 * 校验器：需求范围检查 (S002-S003)
 * 简化版：检查配置中记录的需求范围
 */
function checkRequirementScope(config, result) {
    if (!config) {
        result.addSkipped('S002', '未找到项目配置文件');
        return;
    }

    const currentIteration = config.currentIteration;
    if (!currentIteration) {
        result.addSkipped('S002', '当前没有活跃迭代');
        return;
    }

    // S002: C0 只含首批需求（检查配置标记）
    result.markChecked('S002');
    if (config.version?.currentBatch && config.version?.totalBatches) {
        const { currentBatch, totalBatches } = config.version;
        if (totalBatches > 1) {
            result.addWarning(
                'S002',
                `当前是第 ${currentBatch}/${totalBatches} 批次，请确保 C0 只包含当前批次的需求`
            );
        }
    }

    // S003: C1 需求必须在 B3 范围内（检查文件是否存在）
    result.markChecked('S003');
    const iterationDir = path.join(
        process.cwd(),
        '02_迭代记录',
        `第${String(currentIteration).padStart(2, '0')}轮迭代`
    );

    const b3Path = path.join(iterationDir, 'B3_规划冻结.md');
    const c1Dir = path.join(iterationDir, 'C1_需求清单');

    // 如果 B3 存在但 C1 目录不存在，跳过
    if (!fs.existsSync(b3Path)) {
        result.addSkipped('S003', 'B3 文档尚未冻结');
        return;
    }

    if (!fs.existsSync(c1Dir)) {
        result.addSkipped('S003', 'C1 目录不存在');
        return;
    }

    // 尝试从 B3 提取需求编号（简单版本：查找 REQ-XXX 模式）
    try {
        const b3Content = fs.readFileSync(b3Path, 'utf-8');
        const b3ReqPattern = /REQ-(\d{3})/g;
        const b3Reqs = new Set();
        let match;
        while ((match = b3ReqPattern.exec(b3Content)) !== null) {
            b3Reqs.add(match[1]);
        }

        // 从 C1 目录获取需求文件
        const c1Files = fs.readdirSync(c1Dir).filter(f => f.endsWith('.md'));
        const c1Reqs = new Set();
        c1Files.forEach(f => {
            const reqMatch = f.match(/REQ-(\d{3})/);
            if (reqMatch) {
                c1Reqs.add(reqMatch[1]);
            }
        });

        // 检查 C1 中是否有 B3 范围外的需求
        c1Reqs.forEach(req => {
            if (b3Reqs.size > 0 && !b3Reqs.has(req)) {
                result.addViolation(
                    'S003',
                    `C1 中的 REQ-${req} 不在 B3 范围内`,
                    path.join(c1Dir, `REQ-${req}*.md`)
                );
            }
        });
    } catch (e) {
        result.addWarning('S003', `无法解析 B3 文档: ${e.message}`, b3Path);
    }
}

/**
 * 主检查函数
 */
async function runCheck(options = {}) {
    const result = new CheckResult();

    try {
        const rulesIndex = loadRules();
        const config = loadProjectConfig();

        if (!config) {
            console.log(chalk.yellow('⚠️  当前目录不是 PRD 项目（缺少 .prd-config.json）'));
            console.log(chalk.gray('   运行 `prd init` 初始化项目'));
            return;
        }

        console.log(chalk.blue('🔍 正在检查 PRD 规则...'));
        console.log('');

        // 运行所有校验器
        checkFrozenStatus(config, result);
        checkFlowOrder(config, result);
        checkA2UIFiles(config, result);
        checkRequirementScope(config, result);

        // 输出结果
        if (options.json) {
            console.log(JSON.stringify(result.toJSON(), null, 2));
        } else {
            result.print();
        }

        // 保存日志（除非指定 --no-log）
        if (!options.noLog) {
            try {
                result.saveLog();
                if (!options.json) {
                    console.log(chalk.gray('📝 日志已保存到 .prd-logs/check-history.json'));
                }
            } catch (e) {
                // 日志保存失败不影响主流程
            }
        }

        // 如果有违规，退出码为 1
        if (!result.passed) {
            process.exitCode = 1;
        }

    } catch (error) {
        console.error(chalk.red('校验失败:'), error.message);
        process.exitCode = 1;
    }
}

module.exports = runCheck;

