const TestHelper = require('../helpers/test-helper');

describe('Iteration Commands', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('iteration-test');
        projectDir = await TestHelper.initProject(testDir);
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    describe('创建迭代', () => {
        test('应该成功创建第01轮迭代', async () => {
            const result = await TestHelper.createIteration(projectDir);

            expect(result.success).toBe(true);

            const exists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代'
            );
            expect(exists).toBe(true);
        });

        test('创建迭代应该生成 R1 启动条件检查', async () => {
            await TestHelper.createIteration(projectDir);

            const exists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/R1_规划启动条件检查.md'
            );
            expect(exists).toBe(true);
        });

        test('可以创建多轮迭代', async () => {
            // 创建第1轮
            await TestHelper.createIteration(projectDir);

            // 创建第2轮
            await TestHelper.createIteration(projectDir);

            const exists1 = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代'
            );
            const exists2 = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第02轮迭代'
            );

            expect(exists1).toBe(true);
            expect(exists2).toBe(true);
        });
    });
});
