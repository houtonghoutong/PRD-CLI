const fs = require('fs-extra');
const path = require('path');

/**
 * 工作流规则检查器
 * 用于验证文档状态是否符合工作流规则
 */
class WorkflowChecker {
    /**
     * 检查 R0 完成后的文档状态
     * 规则：R0 完成后不应该自动创建 R1 审视报告或迭代
     */
    static async checkR0Completion(projectDir) {
        const issues = [];

        // R0 完成后不应该自动创建 R1 审视
        const r1ReviewPath = path.join(
            projectDir,
            '02_迭代记录/第01轮迭代/R1_规划审视报告.md'
        );

        if (await fs.pathExists(r1ReviewPath)) {
            issues.push({
                severity: 'ERROR',
                rule: 'R0_NO_AUTO_R1_REVIEW',
                message: 'R0 完成后不应该自动创建 R1 审视报告',
                file: r1ReviewPath
            });
        }

        // R0 完成后不应该自动创建迭代
        const iterationDir = path.join(projectDir, '02_迭代记录/第01轮迭代');
        if (await fs.pathExists(iterationDir)) {
            // 这个其实可以接受，只要没有 R1 审视报告就行
            // 所以降级为 WARNING
            const r1Review = await fs.pathExists(r1ReviewPath);
            if (r1Review) {
                issues.push({
                    severity: 'WARNING',
                    rule: 'R0_AUTO_ITERATION',
                    message: 'R0 完成后自动创建了迭代（如果是手动创建则可接受）',
                    file: iterationDir
                });
            }
        }

        return issues;
    }

    /**
     * 检查 R1 启动条件文档是否存在
     * 规则：创建迭代后必须生成 R1_规划启动条件检查.md
     */
    static async checkR1StartCondition(projectDir, iterationNum = 1) {
        const issues = [];

        const r1StartPath = path.join(
            projectDir,
            `02_迭代记录/第${String(iterationNum).padStart(2, '0')}轮迭代`,
            'R1_规划启动条件检查.md'
        );

        if (!await fs.pathExists(r1StartPath)) {
            issues.push({
                severity: 'ERROR',
                rule: 'R1_START_REQUIRED',
                message: '创建迭代后必须生成 R1 启动条件检查文档',
                expectedFile: r1StartPath
            });
        } else {
            // 验证文档内容
            const content = await fs.readFile(r1StartPath, 'utf-8');

            const requiredSections = [
                '启动条件一：问题是否被确认真实存在',
                '启动条件二：问题是否需要"单独一轮规划"来解决',
                '启动条件三：问题是否已经被理解到"可规划"的程度'
            ];

            requiredSections.forEach(section => {
                if (!content.includes(section)) {
                    issues.push({
                        severity: 'WARNING',
                        rule: 'R1_START_CONTENT',
                        message: `R1 启动条件缺少必需章节: ${section}`,
                        file: r1StartPath
                    });
                }
            });
        }

        return issues;
    }

    /**
     * 检查文档依赖关系
     * 验证文档创建顺序是否正确
     */
    static async checkDocumentDependencies(projectDir, iterationNum = 1) {
        const issues = [];
        const iterationDir = path.join(
            projectDir,
            `02_迭代记录/第${String(iterationNum).padStart(2, '0')}轮迭代`
        );

        // 检查文档是否存在
        const docs = {
            r1Start: await fs.pathExists(path.join(iterationDir, 'R1_规划启动条件检查.md')),
            b1: await fs.pathExists(path.join(iterationDir, 'B1_需求规划草案.md')),
            b2: await fs.pathExists(path.join(iterationDir, 'B2_规划拆解与范围界定.md')),
            r1Review: await fs.pathExists(path.join(iterationDir, 'R1_规划审视报告.md')),
            b3: await fs.pathExists(path.join(iterationDir, 'B3_规划冻结归档.md'))
        };

        // 检查依赖关系
        // 如果 B1 存在，R1 启动条件检查应该存在（因为创建 B1 需要通过 R1 启动条件）
        if (docs.b1 && !docs.r1Start) {
            issues.push({
                severity: 'ERROR',
                rule: 'DEPENDENCY_R1_START_BEFORE_B1',
                message: 'B1 存在但 R1 启动条件检查不存在，违反依赖关系'
            });
        }

        // 如果 B2 存在，B1 应该存在
        if (docs.b2 && !docs.b1) {
            issues.push({
                severity: 'ERROR',
                rule: 'DEPENDENCY_B1_BEFORE_B2',
                message: 'B2 存在但 B1 不存在，跳过了 B1'
            });
        }

        // 如果 R1 审视存在，B1 和 B2 应该都存在
        if (docs.r1Review && (!docs.b1 || !docs.b2)) {
            issues.push({
                severity: 'ERROR',
                rule: 'DEPENDENCY_B1B2_BEFORE_R1_REVIEW',
                message: 'R1 审视报告存在但 B1/B2 不完整，违反依赖关系'
            });
        }

        // 如果 B3 存在，R1 审视应该存在
        if (docs.b3 && !docs.r1Review) {
            issues.push({
                severity: 'ERROR',
                rule: 'DEPENDENCY_R1_REVIEW_BEFORE_B3',
                message: 'B3 存在但 R1 审视不存在，违反依赖关系'
            });
        }

        return issues;
    }

    /**
     * 检查两个 R1 文档是否都存在且内容不同
     */
    static async checkTwoR1Documents(projectDir, iterationNum = 1) {
        const issues = [];
        const iterationDir = path.join(
            projectDir,
            `02_迭代记录/第${String(iterationNum).padStart(2, '0')}轮迭代`
        );

        const r1StartPath = path.join(iterationDir, 'R1_规划启动条件检查.md');
        const r1ReviewPath = path.join(iterationDir, 'R1_规划审视报告.md');

        const r1StartExists = await fs.pathExists(r1StartPath);
        const r1ReviewExists = await fs.pathExists(r1ReviewPath);

        if (r1StartExists && r1ReviewExists) {
            // 读取两个文档
            const r1StartContent = await fs.readFile(r1StartPath, 'utf-8');
            const r1ReviewContent = await fs.readFile(r1ReviewPath, 'utf-8');

            // 验证它们是不同的文档
            if (r1StartContent === r1ReviewContent) {
                issues.push({
                    severity: 'ERROR',
                    rule: 'TWO_R1_DIFFERENT',
                    message: 'R1_规划启动条件检查.md 和 R1_规划审视报告.md 内容相同，应该是不同的文档'
                });
            }

            // 验证 R1 启动条件包含特定内容
            if (!r1StartContent.includes('启动条件一')) {
                issues.push({
                    severity: 'WARNING',
                    rule: 'R1_START_CONTENT_VALID',
                    message: 'R1_规划启动条件检查.md 缺少启动条件相关内容'
                });
            }

            // 验证 R1 审视包含特定内容
            if (!r1ReviewContent.includes('目标清晰性')) {
                issues.push({
                    severity: 'WARNING',
                    rule: 'R1_REVIEW_CONTENT_VALID',
                    message: 'R1_规划审视报告.md 缺少审视维度相关内容'
                });
            }
        }

        return issues;
    }

    /**
     * 运行所有检查
     */
    static async runAllChecks(projectDir, iterationNum = 1) {
        const allIssues = [];

        // 运行所有检查
        allIssues.push(...await this.checkR0Completion(projectDir));
        allIssues.push(...await this.checkR1StartCondition(projectDir, iterationNum));
        allIssues.push(...await this.checkDocumentDependencies(projectDir, iterationNum));
        allIssues.push(...await this.checkTwoR1Documents(projectDir, iterationNum));

        // 统计
        const summary = {
            errors: allIssues.filter(i => i.severity === 'ERROR').length,
            warnings: allIssues.filter(i => i.severity === 'WARNING').length,
            total: allIssues.length
        };

        return {
            passed: summary.errors === 0,
            issues: allIssues,
            summary
        };
    }

    /**
     * 生成检查报告
     */
    static generateReport(checkResult) {
        let report = '\n=== 工作流规则检查报告 ===\n\n';

        report += `总计: ${checkResult.summary.total} 个问题\n`;
        report += `错误: ${checkResult.summary.errors}\n`;
        report += `警告: ${checkResult.summary.warnings}\n`;
        report += `结果: ${checkResult.passed ? '✅ 通过' : '❌ 失败'}\n\n`;

        if (checkResult.issues.length > 0) {
            report += '问题详情:\n';
            checkResult.issues.forEach((issue, index) => {
                const icon = issue.severity === 'ERROR' ? '❌' : '⚠️';
                report += `\n${index + 1}. ${icon} [${issue.severity}] ${issue.rule}\n`;
                report += `   ${issue.message}\n`;
                if (issue.file) {
                    report += `   文件: ${issue.file}\n`;
                }
                if (issue.expectedFile) {
                    report += `   期望文件: ${issue.expectedFile}\n`;
                }
            });
        } else {
            report += '✅ 所有检查通过，无违规问题\n';
        }

        return report;
    }
}

module.exports = WorkflowChecker;
