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

            if (record.data) {
                md += `**详细信息**:\n\`\`\`json\n${JSON.stringify(record.data, null, 2)}\n\`\`\`\n\n`;
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
    }
};
