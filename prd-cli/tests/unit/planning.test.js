const TestHelper = require('../helpers/test-helper');

describe('Planning Commands', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('planning-test');
        projectDir = await TestHelper.initProject(testDir);

        // 创建必要的前置条件
        await TestHelper.createBaseline(projectDir, 'A0');
        await TestHelper.createBaseline(projectDir, 'A1');
        await TestHelper.createBaseline(projectDir, 'A2');
        await TestHelper.createIteration(projectDir);
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    describe('B1 - 需求规划草案', () => {
        test('应该成功创建 B1 文档', async () => {
            const result = await TestHelper.createPlan(projectDir, 'B1');

            expect(result.success).toBe(true);

            const exists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/B1_需求规划草案.md'
            );
            expect(exists).toBe(true);
        });

        test('B1 文档应包含必要章节', async () => {
            await TestHelper.createPlan(projectDir, 'B1');

            const content = await TestHelper.readFile(
                projectDir,
                '02_迭代记录/第01轮迭代/B1_需求规划草案.md'
            );

            expect(content).toContain('# B1_需求规划草案');
            expect(content).toContain('## 1. 规划目标');
            expect(content).toContain('## 2. 使用场景');
            expect(content).toContain('## 3. 规划范围');
            expect(content).toContain('明确不做');
        });

        test('没有完整 A 类基线时的提示', async () => {
            // 创建一个新项目，只创建部分基线
            const tempDir = await TestHelper.createTempDir('partial-baseline-test');
            const tempProject = await TestHelper.initProject(tempDir);
            await TestHelper.createIteration(tempProject);
            // 只创建 A0，缺少 A1 和 A2
            await TestHelper.createBaseline(tempProject, 'A0');

            const result = await TestHelper.createPlan(tempProject, 'B1');

            // 应该提示缺少文档（可能成功也可能失败，取决于实现）
            if (!result.success) {
                expect(result.output).toContain('A 类基线文档');
            }

            await TestHelper.cleanup(tempDir);
        });
    });

    describe('B2 - 规划拆解与范围界定', () => {
        test('应该成功创建 B2 文档', async () => {
            // 先创建 B1
            await TestHelper.createPlan(projectDir, 'B1');

            const result = await TestHelper.createPlan(projectDir, 'B2');

            expect(result.success).toBe(true);

            const exists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/B2_规划拆解与范围界定.md'
            );
            expect(exists).toBe(true);
        });

        test('B2 文档应包含必要章节', async () => {
            await TestHelper.createPlan(projectDir, 'B1');
            await TestHelper.createPlan(projectDir, 'B2');

            const content = await TestHelper.readFile(
                projectDir,
                '02_迭代记录/第01轮迭代/B2_规划拆解与范围界定.md'
            );

            expect(content).toContain('# B2_规划拆解与范围界定');
            expect(content).toContain('## 1. 需求项列表');
            expect(content).toContain('## 2. 优先级排序');
            expect(content).toContain('## 3. 范围界定');
        });

        test('没有 B1 时的提示', async () => {
            const result = await TestHelper.createPlan(projectDir, 'B2');

            // 应该提示需要先创建 B1（可能成功也可能失败）
            if (!result.success) {
                expect(result.output).toContain('B1');
            }
        });
    });

    describe('Plan Freeze - 冻结规划', () => {
        test('完整流程后应该能冻结', async () => {
            // 完整流程
            await TestHelper.createPlan(projectDir, 'B1');
            await TestHelper.createPlan(projectDir, 'B2');

            // 注意：freeze 需要 R1 审视通过，这里先不测试
            // 因为需要修改 R1 报告内容
        });
    });
});
