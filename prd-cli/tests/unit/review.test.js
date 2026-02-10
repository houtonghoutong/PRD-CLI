const TestHelper = require('../helpers/test-helper');

describe('Review Commands - v2.0.0', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('review-test');
        projectDir = await TestHelper.initProject(testDir);
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    // v2.0.0: 审视已内化到 freeze 命令中，不再有独立的 R1/R2 命令
    describe('规划审视（内化到 prd plan freeze）', () => {
        test('需求规划应包含启动检查内容', async () => {
            // v2.0.0 中启动检查已集成到需求规划文档中
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir);  // v2.0.0 无需参数

            // 检查需求规划文档是否存在
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

            // 需求规划应包含启动检查内容
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
        });
    });

    describe('版本审视（内化到 prd version freeze）', () => {
        test('版本冻结需要规划冻结和 IT 文档', async () => {
            // 只创建基础条件，不创建规划冻结/IT
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');
            await TestHelper.createIteration(projectDir);

            const result = await TestHelper.review(projectDir, 'r2');

            expect(result.success).toBe(false);
            // v2.0.0: 检查规划冻结和 IT 目录
            expect(result.error || result.output).toMatch(/规划|IT|B3|freeze/i);
        });
    });
});
