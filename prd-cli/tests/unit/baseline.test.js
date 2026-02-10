const TestHelper = require('../helpers/test-helper');

describe('Baseline Commands - v2.0.0', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('baseline-test');
        projectDir = await TestHelper.initProject(testDir);
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    describe('产品定义', () => {
        test('应该成功创建产品定义文档', async () => {
            const result = await TestHelper.createBaseline(projectDir, '产品定义');

            expect(result.success).toBe(true);

            // 验证文件是否生成（新目录名 01_基线）
            let exists = await TestHelper.fileExists(
                projectDir,
                '01_基线/产品定义.md'
            );
            // 兼容旧目录名
            if (!exists) {
                exists = await TestHelper.fileExists(
                    projectDir,
                    '01_产品基线/产品定义.md'
                );
            }
            expect(exists).toBe(true);
        });

        test('应该支持旧的 A0 参数（向后兼容）', async () => {
            const result = await TestHelper.createBaseline(projectDir, 'A0');

            expect(result.success).toBe(true);

            // 验证文件是否生成
            let exists = await TestHelper.fileExists(
                projectDir,
                '01_基线/产品定义.md'
            );
            if (!exists) {
                exists = await TestHelper.fileExists(
                    projectDir,
                    '01_产品基线/产品定义.md'
                );
            }
            expect(exists).toBe(true);
        });

        test('产品定义文档应包含必要章节', async () => {
            await TestHelper.createBaseline(projectDir, '产品定义');

            let content;
            try {
                content = await TestHelper.readFile(
                    projectDir,
                    '01_基线/产品定义.md'
                );
            } catch (e) {
                content = await TestHelper.readFile(
                    projectDir,
                    '01_产品基线/产品定义.md'
                );
            }

            expect(content).toContain('# 产品定义');
            expect(content).toContain('## 1. 产品是什么');
            expect(content).toContain('## 3. 目标用户');
            expect(content).toContain('## 6. 明确不做的事情');
        });
    });

    describe('代码快照', () => {
        test('应该成功创建代码快照文档', async () => {
            const result = await TestHelper.createBaseline(projectDir, '代码快照');

            expect(result.success).toBe(true);

            let exists = await TestHelper.fileExists(
                projectDir,
                '01_基线/代码快照.md'
            );
            if (!exists) {
                exists = await TestHelper.fileExists(
                    projectDir,
                    '01_产品基线/代码快照.md'
                );
            }
            expect(exists).toBe(true);
        });

        test('应该支持旧的 A1 参数（向后兼容）', async () => {
            const result = await TestHelper.createBaseline(projectDir, 'A1');

            expect(result.success).toBe(true);
        });
    });

    describe('用户反馈', () => {
        test('应该成功创建用户反馈文档', async () => {
            const result = await TestHelper.createBaseline(projectDir, '用户反馈');

            expect(result.success).toBe(true);

            let exists = await TestHelper.fileExists(
                projectDir,
                '01_基线/用户反馈.md'
            );
            if (!exists) {
                exists = await TestHelper.fileExists(
                    projectDir,
                    '01_产品基线/用户反馈.md'
                );
            }
            expect(exists).toBe(true);
        });

        test('应该支持旧的 A2 参数（向后兼容）', async () => {
            const result = await TestHelper.createBaseline(projectDir, 'A2');

            expect(result.success).toBe(true);
        });
    });

    describe('R0 已废弃', () => {
        test('创建 R0 应该失败（已废弃）', async () => {
            const result = await TestHelper.createBaseline(projectDir, 'R0');

            // R0 已废弃，应该失败或提示错误
            // 检查输出包含错误信息或文件未创建
            const exists = await TestHelper.fileExists(
                projectDir,
                '01_基线/R0_基线审视报告.md'
            );
            // R0 在新版中不应该创建
            expect(exists).toBe(false);
        });
    });
});
