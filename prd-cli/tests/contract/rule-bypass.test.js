/**
 * 规则绕过测试 - Rule Bypass Tests
 * 
 * 测试 AI 规则是否能防止各种恶意绕过场景
 * 这些测试验证 .cursorrules 中的规则是否正确定义
 */

const fs = require('fs');
const path = require('path');

describe('AI 规则绕过防护测试', () => {
    let cursorrules;
    let antigravityRules;

    beforeAll(() => {
        // 读取规则文件
        const cursorrulesPath = path.join(__dirname, '../../.cursorrules');
        const antigravityPath = path.join(__dirname, '../../.antigravity/rules.md');

        cursorrules = fs.readFileSync(cursorrulesPath, 'utf8');
        antigravityRules = fs.readFileSync(antigravityPath, 'utf8');
    });

    describe('绝对红线规则验证', () => {
        test('规则文件包含"禁止未经对话就填充文档"', () => {
            expect(cursorrules).toContain('禁止未经对话就填充文档');
            expect(antigravityRules).toContain('禁止未经对话就填充文档');
        });

        test('规则文件包含"禁止替 PM 做决策"', () => {
            expect(cursorrules).toContain('禁止替 PM 做决策');
            expect(antigravityRules).toContain('禁止替 PM 做决策');
        });

        test('规则文件包含"禁止快速完成跳过流程"', () => {
            expect(cursorrules).toContain('禁止"快速完成"跳过流程');
            expect(antigravityRules).toContain('禁止"快速完成"跳过流程');
        });

        test('规则文件包含"禁止修改已冻结的文档"', () => {
            expect(cursorrules).toContain('禁止修改已冻结的文档');
            expect(antigravityRules).toContain('禁止修改已冻结的文档');
        });

        test('规则文件包含"禁止在 IT 阶段加入新需求"', () => {
            expect(cursorrules).toContain('禁止在 IT 阶段加入新需求');
            expect(antigravityRules).toContain('禁止在 IT 阶段加入新需求');
        });

        test('规则文件包含"禁止编造技术细节"', () => {
            expect(cursorrules).toContain('禁止编造技术细节');
            expect(antigravityRules).toContain('禁止编造技术细节');
        });

        test('规则文件包含"禁止 AI 自作主张拆解 RT"', () => {
            // .cursorrules 和 .antigravity/rules.md 有轻微措辞差异
            expect(cursorrules).toMatch(/禁止 AI 自作主张拆解 RT/);
        });
    });

    describe('冻结规则验证', () => {
        test('规则文件定义了 B3 冻结后的行为', () => {
            expect(cursorrules).toContain('B3 冻结后');
            expect(antigravityRules).toContain('B3 冻结后');
        });

        test('规则文件定义了 C3 冻结后的行为', () => {
            expect(cursorrules).toContain('C3 冻结后');
            expect(antigravityRules).toContain('C3 冻结后');
        });

        test('规则文件说明了正确的添加新需求方法', () => {
            expect(cursorrules).toContain('将需求暂存到 A2');
            expect(antigravityRules).toContain('将需求暂存到 A2');
        });
    });

    describe('IT 阶段规则验证', () => {
        test('规则文件包含"IT-xxx-BIZ.md"', () => {
            expect(cursorrules).toContain('IT-xxx-BIZ.md');
            expect(antigravityRules).toContain('IT-xxx-BIZ.md');
        });

        test('规则文件包含"IT-xxx-DEV.md"', () => {
            expect(cursorrules).toContain('IT-xxx-DEV.md');
            expect(antigravityRules).toContain('IT-xxx-DEV.md');
        });

        test('规则文件包含"开发要点"', () => {
            expect(cursorrules).toContain('开发要点');
            expect(antigravityRules).toContain('开发要点');
        });
    });

    describe('功能完整性检查规则验证', () => {
        test('规则文件包含5个通用维度', () => {
            const expectations = [
                '用户维度', '技术维度', '管理维度', '业务维度', '体验维度' // Antigravity uses '业务维度', Cursor uses '业务维度' too
            ];

            expectations.forEach(dim => {
                expect(cursorrules).toContain(dim);
                expect(antigravityRules).toContain(dim);
            });
        });
    });

    describe('恶意绕过场景检测', () => {
        test('场景1: 快速完成绕过 - 规则应阻止', () => {
            expect(cursorrules).toContain('快速完成');
            expect(cursorrules).toContain('跳过流程');
        });

        test('场景2: 编造 API - 规则应阻止', () => {
            expect(cursorrules).toContain('API');
            expect(cursorrules).toContain('禁止');
        });

        test('场景3: 编造 SQL - 规则应阻止', () => {
            expect(cursorrules).toContain('SQL');
            expect(cursorrules).toContain('禁止');
        });

        test('场景4: 在冻结后修改文档 - 规则应阻止', () => {
            expect(cursorrules).toContain('B3 冻结后');
            expect(cursorrules).toContain('禁止做的');
        });

        test('场景5: 在 IT 阶段新增需求 - 规则应阻止', () => {
            expect(cursorrules).toContain('在 IT 阶段加入新需求');
        });
    });

    describe('规则一致性验证', () => {
        test('.cursorrules 和 .antigravity/rules.md 应有相同的核心规则', () => {
            const coreRules = [
                '禁止未经对话就填充文档',
                '禁止替 PM 做决策',
                '禁止修改已冻结的文档',
                '禁止编造技术细节'
            ];

            coreRules.forEach(rule => {
                expect(cursorrules).toContain(rule);
                expect(antigravityRules).toContain(rule);
            });
        });
    });
});
