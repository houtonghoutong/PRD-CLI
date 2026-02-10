const TestHelper = require('../helpers/test-helper');

describe('Workflow Integration Tests - v2.0.0', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('workflow-test');
        projectDir = await TestHelper.initProject(testDir);

        // 完成基线准备（R0 已废弃）
        await TestHelper.createBaseline(projectDir, '产品定义');
        await TestHelper.createBaseline(projectDir, '代码快照');
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    describe('基线完成后的状态检查', () => {
        test('基线完成后不应该自动创建其他文档', async () => {
            // 检查是否自动生成了后续文档
            const iterationExists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代'
            );

            expect(iterationExists).toBe(false);
        });
    });

    describe('需求规划（v2.0.0 新架构）', () => {
        test('创建迭代后应能创建需求规划', async () => {
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');
            await TestHelper.createIteration(projectDir);

            const bResult = await TestHelper.createPlan(projectDir);
            expect(bResult.success).toBe(true);

            // 检查新文件名
            let planExists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/需求规划.md'
            );
            // 兼容旧文件名
            if (!planExists) {
                planExists = await TestHelper.fileExists(
                    projectDir,
                    '02_迭代记录/第01轮迭代/B_规划文档.md'
                );
            }
            expect(planExists).toBe(true);
        });

        test('需求规划应包含启动检查（内化）', async () => {
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir);

            let content;
            try {
                content = await TestHelper.readFile(
                    projectDir,
                    '02_迭代记录/第01轮迭代/需求规划.md'
                );
            } catch (e) {
                content = await TestHelper.readFile(
                    projectDir,
                    '02_迭代记录/第01轮迭代/B_规划文档.md'
                );
            }

            expect(content).toContain('启动检查');
            expect(content).toContain('问题真实存在');
            expect(content).toContain('值得单独规划');
            expect(content).toContain('问题已理解清楚');
        });
    });

    describe('废弃命令阻止（v2.0.0）', () => {
        test('B1 命令应被阻止', async () => {
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');
            await TestHelper.createIteration(projectDir);

            const result = await TestHelper.createPlan(projectDir, 'B1');

            expect(result.success).toBe(false);
        });

        test('B2 命令应被阻止', async () => {
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');
            await TestHelper.createIteration(projectDir);

            const result = await TestHelper.createPlan(projectDir, 'B2');

            expect(result.success).toBe(false);
        });
    });

    describe('完整的简化流程（v2.0.0）', () => {
        test('正确顺序：基线 → 迭代 → 需求规划', async () => {
            // 1. 创建基线
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');

            // 2. 创建迭代
            const iterationResult = await TestHelper.createIteration(projectDir);
            expect(iterationResult.success).toBe(true);

            // 3. 创建需求规划
            const bResult = await TestHelper.createPlan(projectDir);
            expect(bResult.success).toBe(true);

            // 4. 验证核心文档存在
            let planExists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/需求规划.md'
            );
            if (!planExists) {
                planExists = await TestHelper.fileExists(
                    projectDir,
                    '02_迭代记录/第01轮迭代/B_规划文档.md'
                );
            }
            expect(planExists).toBe(true);

            // 5. 验证 IT 目录存在
            const itDirExists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/IT'
            );
            expect(itDirExists).toBe(true);
        });
    });
});
