const TestHelper = require('../helpers/test-helper');

describe('Planning Commands - v2.0.0', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('planning-test');
        projectDir = await TestHelper.initProject(testDir);

        // 创建必要的前置条件（使用新的中文名）
        await TestHelper.createBaseline(projectDir, '产品定义');
        await TestHelper.createBaseline(projectDir, '代码快照');
        await TestHelper.createBaseline(projectDir, '用户反馈');
        await TestHelper.createIteration(projectDir);
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    describe('需求规划（v2.0.0 新架构）', () => {
        test('应该成功创建需求规划文档', async () => {
            const result = await TestHelper.createPlan(projectDir);  // v2.0.0 无需参数

            expect(result.success).toBe(true);

            // 检查新文件名
            let exists = await TestHelper.fileExists(
                projectDir,
                '02_迭代记录/第01轮迭代/需求规划.md'
            );
            // 兼容旧文件名
            if (!exists) {
                exists = await TestHelper.fileExists(
                    projectDir,
                    '02_迭代记录/第01轮迭代/B_规划文档.md'
                );
            }
            expect(exists).toBe(true);
        });

        test('需求规划应包含必要章节', async () => {
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
            expect(content).toContain('核心问题');
            expect(content).toContain('需求拆解');
            expect(content).toContain('PM 确认');
        });

        test('应该支持旧的 B 参数（向后兼容）', async () => {
            const result = await TestHelper.createPlan(projectDir, 'B');

            expect(result.success).toBe(true);
        });
    });

    describe('B1/B2 废弃命令（v1.5.0 已废弃）', () => {
        test('prd plan create B1 应该被阻止', async () => {
            const result = await TestHelper.createPlan(projectDir, 'B1');

            // 应该失败并提示使用新命令
            expect(result.success).toBe(false);
        });

        test('prd plan create B2 应该被阻止', async () => {
            const result = await TestHelper.createPlan(projectDir, 'B2');

            // 应该失败并提示使用新命令
            expect(result.success).toBe(false);
        });
    });

    describe('规划冻结（v2.0.0）', () => {
        test('完成需求规划后应该能检测到文档', async () => {
            // 创建需求规划
            await TestHelper.createPlan(projectDir);

            // 检查文档存在性
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
    });
});
