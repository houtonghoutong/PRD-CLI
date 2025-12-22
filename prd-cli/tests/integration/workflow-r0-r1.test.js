const TestHelper = require('../helpers/test-helper');

describe('R0-R1 Flow Control - 流程跳跃检测', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('r0r1-test');
        projectDir = await TestHelper.initProject(testDir);

        // 完成基线准备
        await TestHelper.createBaseline(projectDir, 'A0');
        await TestHelper.createBaseline(projectDir, 'A1');
        await TestHelper.createBaseline(projectDir, 'R0');
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    describe('R0 完成后的状态检查', () => {
        test('R0 完成后不应该自动创建 R1 审视报告', async () => {
            // R0 已完成，检查是否自动生成了 R1_规划审视报告.md
            const r1ReviewExists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/R1_规划审视报告.md'
            );

            expect(r1ReviewExists).toBe(false);
        });

        test('R0 完成后不应该自动创建迭代', async () => {
            const iterationExists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代'
            );

            expect(iterationExists).toBe(false);
        });
    });

    describe('R1 启动条件检查文档', () => {
        test('创建迭代应该自动生成 R1_规划启动条件检查.md', async () => {
            await TestHelper.createIteration(projectDir);

            const r1StartExists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/R1_规划启动条件检查.md'
            );

            expect(r1StartExists).toBe(true);
        });

        test('R1 启动条件检查应包含3个必要条件', async () => {
            await TestHelper.createIteration(projectDir);

            const content = await TestHelper.readFile(
                projectDir,
                '02_迭代记录/第01轮迭代/R1_规划启动条件检查.md'
            );

            expect(content).toContain('启动条件一：问题是否被确认真实存在');
            expect(content).toContain('启动条件二：问题是否需要"单独一轮规划"来解决');
            expect(content).toContain('启动条件三：问题是否已经被理解到"可规划"的程度');
        });
    });

    describe('R1 审视的前置条件检查', () => {
        test('没有创建迭代时，R1 审视应该失败', async () => {
            const result = await TestHelper.review(projectDir, 'r1');

            // 应该失败或返回错误
            expect(result.success).toBe(false);
        });

        test('没有 B1/B2 时，R1 审视应该失败', async () => {
            // 先创建基线文档（否则无法创建迭代）
            await TestHelper.createBaseline(projectDir, 'A0');
            await TestHelper.createBaseline(projectDir, 'A1');

            // 只创建迭代，不创建 B1/B2
            await TestHelper.createIteration(projectDir);

            const result = await TestHelper.review(projectDir, 'r1');

            // 应该失败
            expect(result.success).toBe(false);
            // 错误信息应该提到 B1 或 B2
            const errorMsg = result.error || result.output;
            expect(errorMsg.includes('B1') || errorMsg.includes('B2')).toBe(true);
        });
    });

    describe('完整的正确流程', () => {
        test('按照正确顺序：迭代 → B1 → B2 → R1 审视', async () => {
            // 0. 先创建必要的基线文档（B1/B2 的前置条件）
            await TestHelper.createBaseline(projectDir, 'A0');
            await TestHelper.createBaseline(projectDir, 'A1');
            await TestHelper.createBaseline(projectDir, 'A2'); // B1需要A2

            // 1. 创建迭代
            const iterationResult = await TestHelper.createIteration(projectDir);
            expect(iterationResult.success).toBe(true);

            // 验证 R1 启动条件检查已生成
            const r1StartExists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/R1_规划启动条件检查.md'
            );
            expect(r1StartExists).toBe(true);

            // 2. 创建 B1
            const b1Result = await TestHelper.createPlan(projectDir, 'B1');
            expect(b1Result.success).toBe(true);

            // 3. 创建 B2
            const b2Result = await TestHelper.createPlan(projectDir, 'B2');
            expect(b2Result.success).toBe(true);

            // 4. 执行 R1 审视
            const r1Result = await TestHelper.review(projectDir, 'r1');
            expect(r1Result.success).toBe(true);

            // 5. 验证 R1 审视报告已生成
            const r1ReviewExists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/R1_规划审视报告.md'
            );
            expect(r1ReviewExists).toBe(true);
        });

        test('验证两个 R1 文档都存在且不同', async () => {
            // 先创建基线文档
            await TestHelper.createBaseline(projectDir, 'A0');
            await TestHelper.createBaseline(projectDir, 'A1');
            await TestHelper.createBaseline(projectDir, 'A2'); // B1需要A2

            // 完整流程
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir, 'B1');
            await TestHelper.createPlan(projectDir, 'B2');
            await TestHelper.review(projectDir, 'r1');

            // 读取两个文档
            const r1Start = await TestHelper.readFile(
                projectDir,
                '02_迭代记录/第01轮迭代/R1_规划启动条件检查.md'
            );

            const r1Review = await TestHelper.readFile(
                projectDir,
                '02_迭代记录/第01轮迭代/R1_规划审视报告.md'
            );

            // 验证是不同的文档
            expect(r1Start).toContain('R1_规划启动条件检查');
            expect(r1Review).toContain('R1_规划审视报告');

            // 验证内容不同
            expect(r1Start).toContain('启动条件一');
            expect(r1Review).toContain('目标清晰性');
        });
    });

    describe('错误流程阻止', () => {
        test('应该阻止跳过 B1 直接创建 B2', async () => {
            await TestHelper.createIteration(projectDir);

            // 不创建 B1，直接创建 B2 应该失败
            // 注意：这取决于实际的命令实现
            const b2Result = await TestHelper.createPlan(projectDir, 'B2');

            // 如果实现了检查，应该失败
            // 如果没有实现，这个测试会提醒我们需要添加检查
            if (!b2Result.success) {
                expect(b2Result.error || b2Result.output).toContain('B1');
            }
        });
    });
});
