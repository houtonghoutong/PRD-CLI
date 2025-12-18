const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * 对话归档模块
 * 用于追溯每轮对话过程
 */

module.exports = {
    /**
     * 记录对话
     * @param {string} stage - 阶段 (如 'baseline', 'planning', 'review_r1')
     * @param {string} action - 动作 (如 'create_A0', 'review', 'confirm')
     * @param {object} data - 对话数据
     */
    async logDialog(stage, action, data) {
        try {
            const configPath = path.join(process.cwd(), '.prd-config.json');
            if (!await fs.pathExists(configPath)) {
                return; // 不在项目目录中，跳过
            }

            const config = await fs.readJSON(configPath);
            const dialogDir = path.join(process.cwd(), '98_对话归档');
            await fs.ensureDir(dialogDir);

            // 确定归档文件路径
            let logFile;
            if (config.currentIteration > 0) {
                const iterationName = `第${String(config.currentIteration).padStart(2, '0')}轮迭代`;
                const iterationDialogDir = path.join(dialogDir, iterationName);
                await fs.ensureDir(iterationDialogDir);
                logFile = path.join(iterationDialogDir, `${stage}_对话记录.jsonl`);
            } else {
                logFile = path.join(dialogDir, `${stage}_对话记录.jsonl`);
            }

            // 构建记录
            const record = {
                timestamp: new Date().toISOString(),
                stage,
                action,
                data,
                iteration: config.currentIteration
            };

            // 追加到 JSONL 文件
            await fs.appendFile(
                logFile,
                JSON.stringify(record) + '\n'
            );

            // 同时创建人类可读的 markdown 版本
            const mdFile = logFile.replace('.jsonl', '.md');
            const mdContent = await this.generateMarkdownLog(logFile);
            await fs.writeFile(mdFile, mdContent);

        } catch (error) {
            console.error(chalk.gray(`对话归档失败: ${error.message}`));
        }
    },

    /**
     * 生成 Markdown 格式的对话日志
     */
    async generateMarkdownLog(jsonlFile) {
        const content = await fs.readFile(jsonlFile, 'utf-8');
        const lines = content.trim().split('\n');

        let md = `# 对话记录\n\n`;
        md += `**文件**: ${path.basename(jsonlFile)}\n`;
        md += `**记录数**: ${lines.length}\n\n`;
        md += `---\n\n`;

        for (const line of lines) {
            const record = JSON.parse(line);
            md += `## ${new Date(record.timestamp).toLocaleString('zh-CN')}\n\n`;
            md += `**阶段**: ${record.stage}\n`;
            md += `**动作**: ${record.action}\n`;
            md += `**迭代轮次**: ${record.iteration}\n\n`;

            // 根据不同类型生成不同格式
            if (record.data) {
                if (record.data.type === 'conversation') {
                    // 对话轮次格式
                    md += `### 💬 对话内容\n\n`;
                    if (record.data.topic) {
                        md += `**讨论主题**: ${record.data.topic}\n\n`;
                    }
                    if (record.data.pmSaid) {
                        md += `**🧑 PM**: ${record.data.pmSaid}\n\n`;
                    }
                    if (record.data.aiResponse) {
                        md += `**🤖 AI**: ${record.data.aiResponse}\n\n`;
                    }
                    if (record.data.pmDecision) {
                        md += `**✅ PM 决策**: ${record.data.pmDecision}\n\n`;
                    }
                    if (record.data.context) {
                        md += `**📋 背景**: ${record.data.context}\n\n`;
                    }
                } else if (record.data.type === 'decision') {
                    // 决策格式
                    md += `### ✅ PM 决策\n\n`;
                    md += `- **决策项**: ${record.data.action}\n`;
                    md += `- **结果**: ${record.data.decision}\n`;
                    md += `- **原因**: ${record.data.reason}\n\n`;
                } else {
                    // 默认 JSON 格式
                    md += `**详细信息**:\n\`\`\`json\n${JSON.stringify(record.data, null, 2)}\n\`\`\`\n\n`;
                }
            }

            md += `---\n\n`;
        }

        return md;
    },

    /**
     * 记录 PM 确认
     */
    async logPMConfirmation(stage, action, decision, reason) {
        await this.logDialog(stage, 'pm_confirmation', {
            action,
            decision,
            reason,
            role: 'PM',
            type: 'decision'
        });
    },

    /**
     * 记录 AI 建议
     */
    async logAISuggestion(stage, action, suggestion) {
        await this.logDialog(stage, 'ai_suggestion', {
            action,
            suggestion,
            role: 'AI',
            type: 'suggestion'
        });
    },

    /**
     * 记录文档创建
     */
    async logDocumentCreation(stage, docType, filePath) {
        await this.logDialog(stage, 'document_created', {
            docType,
            filePath,
            type: 'document'
        });
    },

    /**
     * 记录一轮对话（包含完整对话内容）
     * @param {string} stage - 阶段
     * @param {string} topic - 讨论主题
     * @param {string} pmSaid - PM 说的内容
     * @param {string} aiResponse - AI 的回复
     * @param {string} pmDecision - PM 的决策（可选）
     * @param {string} context - 背景信息（可选）
     */
    async logConversationRound(stage, topic, pmSaid, aiResponse, pmDecision = null, context = null) {
        await this.logDialog(stage, 'conversation_round', {
            type: 'conversation',
            topic,
            pmSaid,
            aiResponse,
            pmDecision,
            context
        });
    },

    /**
     * 记录需求讨论
     * @param {string} requirementId - 需求项编号
     * @param {string} pmInput - PM 的输入
     * @param {string} aiSummary - AI 的总结
     * @param {boolean} confirmed - PM 是否确认
     */
    async logRequirementDiscussion(stage, requirementId, pmInput, aiSummary, confirmed) {
        await this.logDialog(stage, 'requirement_discussion', {
            type: 'conversation',
            topic: `需求项 ${requirementId} 讨论`,
            pmSaid: pmInput,
            aiResponse: aiSummary,
            pmDecision: confirmed ? '确认' : '需修改'
        });
    },

    /**
     * 记录优先级决策
     * @param {string} stage - 阶段
     * @param {object} priorities - 优先级决策 { P0: [...], P1: [...], P2: [...] }
     * @param {string} pmReason - PM 的决策理由
     */
    async logPriorityDecision(stage, priorities, pmReason) {
        await this.logDialog(stage, 'priority_decision', {
            type: 'conversation',
            topic: '优先级排序决策',
            pmSaid: pmReason,
            aiResponse: `已记录优先级：P0=${priorities.P0?.length || 0}项, P1=${priorities.P1?.length || 0}项, P2=${priorities.P2?.length || 0}项`,
            pmDecision: JSON.stringify(priorities)
        });
    },

    /**
     * 记录范围决策
     * @param {string} stage - 阶段
     * @param {array} included - 首版包含
     * @param {array} excluded - 延后的
     * @param {string} pmReason - PM 的决策理由
     */
    async logScopeDecision(stage, included, excluded, pmReason) {
        await this.logDialog(stage, 'scope_decision', {
            type: 'conversation',
            topic: '范围界定决策',
            pmSaid: pmReason,
            aiResponse: `首版包含 ${included.length} 项，延后 ${excluded.length} 项`,
            pmDecision: `包含: ${included.join(', ')} | 延后: ${excluded.join(', ')}`
        });
    }
};

