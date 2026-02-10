const TestHelper = require('../helpers/test-helper');

describe('Snapshot Tests - v2.0.0', () => {
    let testDir;
    let projectDir;

    beforeEach(async () => {
        testDir = await TestHelper.createTempDir('snapshot-test');
        projectDir = await TestHelper.initProject(testDir);
    });

    afterEach(async () => {
        await TestHelper.cleanup(testDir);
    });

    describe('文档模板快照（v2.0.0）', () => {
        test('需求规划模板应匹配快照', async () => {
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir);

            // 尝试新文件名
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

            // 移除动态内容
            const normalized = content
                .replace(/\*\*创建时间\*\*: .*?\n/, '**创建时间**: [TIMESTAMP]\n');

            expect(normalized).toMatchSnapshot();
        });
    });

    describe('文档结构快照（v2.0.0）', () => {
        test('完整项目结构应匹配快照', async () => {
            // v2.0.0 简化流程
            await TestHelper.createBaseline(projectDir, '产品定义');
            await TestHelper.createBaseline(projectDir, '代码快照');
            await TestHelper.createBaseline(projectDir, '用户反馈');
            // R0 已废弃，不再创建
            await TestHelper.createIteration(projectDir);
            await TestHelper.createPlan(projectDir);

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
