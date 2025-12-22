const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 测试辅助函数
 */
class TestHelper {
    /**
     * 创建临时测试目录
     */
    static async createTempDir(prefix = 'test') {
        const tempDir = path.join(__dirname, '../temp', `${prefix}-${Date.now()}`);
        await fs.ensureDir(tempDir);
        return tempDir;
    }

    /**
     * 清理测试目录
     */
    static async cleanup(dir) {
        if (await fs.pathExists(dir)) {
            await fs.remove(dir);
        }
    }

    /**
     * 初始化测试项目
     */
    static async initProject(testDir, projectName = 'test-project') {
        const cliPath = path.join(__dirname, '../../bin/prd-cli.js');

        execSync(`node "${cliPath}" init ${projectName}`, {
            cwd: testDir,
            stdio: 'pipe'
        });

        return path.join(testDir, projectName);
    }

    /**
     * 执行 CLI 命令
     */
    static execCommand(command, projectDir) {
        const cliPath = path.join(__dirname, '../../bin/prd-cli.js');

        try {
            const output = execSync(`node "${cliPath}" ${command}`, {
                cwd: projectDir,
                stdio: 'pipe',
                encoding: 'utf-8',
                env: {
                    ...process.env,
                    PRD_TEST_MODE: 'true'  // 启用测试模式，跳过交互式确认
                }
            });
            return { success: true, output };
        } catch (error) {
            return {
                success: false,
                output: error.stdout || '',
                error: error.stderr || error.message
            };
        }
    }

    /**
     * 检查文件是否存在
     */
    static async fileExists(projectDir, relativePath) {
        const fullPath = path.join(projectDir, relativePath);
        return await fs.pathExists(fullPath);
    }

    /**
     * 读取文件内容
     */
    static async readFile(projectDir, relativePath) {
        const fullPath = path.join(projectDir, relativePath);
        return await fs.readFile(fullPath, 'utf-8');
    }

    /**
     * 创建基线文档
     */
    static async createBaseline(projectDir, type) {
        return this.execCommand(`baseline create ${type}`, projectDir);
    }

    /**
     * 创建迭代
     */
    static async createIteration(projectDir) {
        return this.execCommand('iteration new', projectDir);
    }

    /**
     * 创建规划文档
     */
    static async createPlan(projectDir, type) {
        return this.execCommand(`plan create ${type}`, projectDir);
    }

    /**
     * 执行审视
     */
    static async review(projectDir, type) {
        return this.execCommand(`review ${type}`, projectDir);
    }
}

module.exports = TestHelper;
