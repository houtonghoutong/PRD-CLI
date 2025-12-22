const TestHelper = require('../helpers/test-helper');

describe('Baseline Commands', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('baseline-test');
        projectDir = await TestHelper.initProject(testDir);
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    describe('A0 - 产品基础与范围说明', () => {
        test('应该成功创建 A0 文档', async () => {
            const result = await TestHelper.createBaseline(projectDir, 'A0');

            expect(result.success).toBe(true);

            // 验证文件是否生成
            const exists = await TestHelper.fileExists(
                projectDir,
                '01_产品基线/A0_产品基础与范围说明.md'
            );
            expect(exists).toBe(true);
        });

        test('A0 文档应包含必要章节', async () => {
            await TestHelper.createBaseline(projectDir, 'A0');

            const content = await TestHelper.readFile(
                projectDir,
                '01_产品基线/A0_产品基础与范围说明.md'
            );

            expect(content).toContain('# A0_产品基础与范围说明');
            expect(content).toContain('## 产品定位');
            expect(content).toContain('## 二、目标用户定义'); // 实际标题格式
            expect(content).toContain('## 三、核心使用场景'); // 实际标题格式
            expect(content).toContain('## 五、明确不覆盖的内容'); // 实际标题格式
        });
    });

    describe('A1 - 已上线功能与流程清单', () => {
        test('应该成功创建 A1 文档', async () => {
            const result = await TestHelper.createBaseline(projectDir, 'A1');

            expect(result.success).toBe(true);

            const exists = await TestHelper.fileExists(
                projectDir,
                '01_产品基线/A1_已上线功能与流程清单.md'
            );
            expect(exists).toBe(true);
        });
    });

    describe('R0 - 基线审视', () => {
        test('应该成功创建 R0 文档', async () => {
            // 先创建前置依赖
            await TestHelper.createBaseline(projectDir, 'A0');
            await TestHelper.createBaseline(projectDir, 'A1');

            const result = await TestHelper.createBaseline(projectDir, 'R0');

            expect(result.success).toBe(true);

            const exists = await TestHelper.fileExists(
                projectDir,
                '01_产品基线/R0_基线审视报告.md'
            );
            expect(exists).toBe(true);
        });
    });
});
