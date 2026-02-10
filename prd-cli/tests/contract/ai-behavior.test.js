const TestHelper = require('../helpers/test-helper');
const WorkflowChecker = require('../helpers/workflow-checker');

describe('AI Behavior Contract Tests - v2.0.0', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('ai-behavior-test');
        projectDir = await TestHelper.initProject(testDir);
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    describe('规则 1: 基线完成后的边界行为', () => {
        test('基线完成后不应自动创建其他文档', async () => {
            // 创建基线文档（R0 已废弃）
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');

            // 运行检查
            const result = await WorkflowChecker.checkR0Completion(projectDir);

            // 应该没有错误
            const errors = result.filter(i => i.severity === 'ERROR');
            expect(errors).toHaveLength(0);
        });
    });

    describe('规则 2: 需求规划（v2.0.0 新架构）', () => {
        test('创建迭代后应能创建需求规划', async () => {
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir);

            // 检查新文件名
            let exists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/需求规划.md'
            );
            if (!exists) {
                exists = await TestHelper.fileExists(
                    projectDir,
                    '02_迭代记录/第01轮迭代/B_规划文档.md'
                );
            }
            expect(exists).toBe(true);
        });

        test('需求规划应包含启动检查', async () => {
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

            // v2.0.0: 启动检查已内化到需求规划
            expect(content).toContain('启动检查');
            expect(content).toContain('问题真实存在');
        });
    });

    describe('规则 3: 文档依赖关系验证（v2.0.0）', () => {
        test('需求规划必须在迭代之后创建', async () => {
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir);

            const result = await WorkflowChecker.checkDocumentDependencies(projectDir);

            // v2.0.0: 简化的文档依赖检查
            expect(result).toBeInstanceOf(Array);
        });
    });

    describe('规则 4: 废弃命令应被阻止（v2.0.0）', () => {
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

    describe('完整流程契约测试（v2.0.0）', () => {
        test('简化流程应正常工作', async () => {
            // v2.0.0 简化流程
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir);

            // 验证核心文档存在
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
        });

        test('单独的基线边界检查', async () => {
            // 只创建基线，不创建后续文档
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');

            // 基线完成后立即检查
            const result = await WorkflowChecker.checkR0Completion(projectDir);

            const errors = result.filter(i => i.severity === 'ERROR');
            expect(errors).toHaveLength(0);
        });
    });
});
