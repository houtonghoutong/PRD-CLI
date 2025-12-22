const TestHelper = require('../helpers/test-helper');

describe('Snapshot Tests - 快照测试', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('snapshot-test');
        projectDir = await TestHelper.initProject(testDir);
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    describe('文档模板快照', () => {
        test('R1 启动条件检查模板应匹配快照', async () => {
            await TestHelper.createIteration(projectDir);

            const content = await TestHelper.readFile(
                projectDir,
                '02_迭代记录/第01轮迭代/R1_规划启动条件检查.md'
            );

            // 移除动态内容（时间戳）
            const normalized = content
                .replace(/\*\*检查时间\*\*: .*?\n/, '**检查时间**: [TIMESTAMP]\n')
                .replace(/\*\*迭代轮次\*\*: .*?\n/, '**迭代轮次**: [ITERATION]\n');

            expect(normalized).toMatchSnapshot();
        });

        test('B1 需求规划草案模板应匹配快照', async () => {
            await TestHelper.createBaseline(projectDir, 'A0');
            await TestHelper.createBaseline(projectDir, 'A1');
            await TestHelper.createBaseline(projectDir, 'A2');
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir, 'B1');

            const content = await TestHelper.readFile(
                projectDir,
                '02_迭代记录/第01轮迭代/B1_需求规划草案.md'
            );

            // 移除动态内容
            const normalized = content
                .replace(/\*\*创建时间\*\*: .*?\n/, '**创建时间**: [TIMESTAMP]\n');

            expect(normalized).toMatchSnapshot();
        });

        test('R1 规划审视报告模板应匹配快照', async () => {
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

            // 移除动态内容
            const normalized = content
                .replace(/\*\*审视时间\*\*: .*?\n/, '**审视时间**: [TIMESTAMP]\n')
                .replace(/\*\*日期\*\*: .*?\n/, '**日期**: [DATE]\n');

            expect(normalized).toMatchSnapshot();
        });
    });

    describe('文档结构快照', () => {
        test('完整项目结构应匹配快照', async () => {
            // 创建完整流程
            await TestHelper.createBaseline(projectDir, 'A0');
            await TestHelper.createBaseline(projectDir, 'A1');
            await TestHelper.createBaseline(projectDir, 'A2');
            await TestHelper.createBaseline(projectDir, 'R0');
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir, 'B1');
            await TestHelper.createPlan(projectDir, 'B2');
            await TestHelper.review(projectDir, 'r1');

            // 获取目录结构
            const structure = await getDirectoryStructure(projectDir);

            expect(structure).toMatchSnapshot();
        });
    });
});

/**
 * 获取目录结构（用于快照测试）
 */
async function getDirectoryStructure(dir, prefix = '') {
    const fs = require('fs-extra');
    const path = require('path');

    const items = await fs.readdir(dir);
    const structure = [];

    for (const item of items.sort()) {
        // 跳过一些不需要的文件
        if (item === '.DS_Store' || item === 'node_modules' || item.startsWith('.prd')) {
            continue;
        }

        const fullPath = path.join(dir, item);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
            structure.push(`${prefix}${item}/`);
            const subStructure = await getDirectoryStructure(fullPath, `${prefix}  `);
            structure.push(...subStructure);
        } else {
            structure.push(`${prefix}${item}`);
        }
    }

    return structure;
}
