const TestHelper = require('../helpers/test-helper');

describe('Review Commands', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('review-test');
        projectDir = await TestHelper.initProject(testDir);
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    describe('R1 - 规划审视', () => {
        test('应该成功创建 R1 审视报告', async () => {
            // 准备完整的前置条件
            await TestHelper.createBaseline(projectDir, 'A0');
            await TestHelper.createBaseline(projectDir, 'A1');
            await TestHelper.createBaseline(projectDir, 'A2');
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir, 'B1');
            await TestHelper.createPlan(projectDir, 'B2');

            const result = await TestHelper.review(projectDir, 'r1');

            expect(result.success).toBe(true);

            const exists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/R1_规划审视报告.md'
            );
            expect(exists).toBe(true);
        });

        test('R1 审视报告应包含5个审视维度', async () => {
            await TestHelper.createBaseline(projectDir, 'A0');
            await TestHelper.createBaseline(projectDir, 'A1');
            await TestHelper.createBaseline(projectDir, 'A2');
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir, 'B1');
            await TestHelper.createPlan(projectDir, 'B2');

            await TestHelper.review(projectDir, 'r1');

            const content = await TestHelper.readFile(
                projectDir,
                '02_迭代记录/第01轮迭代/R1_规划审视报告.md'
            );

            expect(content).toContain('# R1_规划审视报告');
            expect(content).toContain('目标清晰性');
            expect(content).toContain('场景真实性');
            expect(content).toContain('现状一致性');
            expect(content).toContain('范围收敛性');
            expect(content).toContain('版本化准备度');
        });

        test('没有 B1/B2 时应该失败', async () => {
            await TestHelper.createBaseline(projectDir, 'A0');
            await TestHelper.createBaseline(projectDir, 'A1');
            await TestHelper.createBaseline(projectDir, 'A2');
            await TestHelper.createIteration(projectDir);

            const result = await TestHelper.review(projectDir, 'r1');

            expect(result.success).toBe(false);
            expect(result.error || result.output).toMatch(/B1|B2/);
        });

        test('没有迭代时应该失败', async () => {
            const result = await TestHelper.review(projectDir, 'r1');

            expect(result.success).toBe(false);
            expect(result.error || result.output).toContain('迭代');
        });
    });

    describe('R2 - 版本审视', () => {
        test('R2 审视需要 B3、C0、C1', async () => {
            // 只创建基础条件，不创建 B3/C0/C1
            await TestHelper.createBaseline(projectDir, 'A0');
            await TestHelper.createBaseline(projectDir, 'A1');
            await TestHelper.createBaseline(projectDir, 'A2');
            await TestHelper.createIteration(projectDir);

            const result = await TestHelper.review(projectDir, 'r2');

            expect(result.success).toBe(false);
            expect(result.error || result.output).toMatch(/B3|C0|C1/);
        });
    });
});
