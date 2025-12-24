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

        test('规则文件包含"禁止在 C1 阶段加入新需求"', () => {
            expect(cursorrules).toContain('禁止在 C1 阶段加入新需求');
            expect(antigravityRules).toContain('禁止在 C1 阶段加入新需求');
        });

        test('规则文件包含"禁止跳过审视"', () => {
            expect(cursorrules).toContain('禁止跳过审视');
            expect(antigravityRules).toContain('禁止跳过审视');
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

    describe('用户角度审计规则验证', () => {
        test('规则文件包含"用户角度审计"规则', () => {
            expect(cursorrules).toContain('用户角度审计');
            expect(antigravityRules).toContain('用户角度审计');
        });

        test('规则文件要求在 B2 阶段进行用户角度质疑', () => {
            expect(cursorrules).toContain('B2');
            expect(cursorrules).toContain('用户角度');
        });

        test('规则文件要求在 C1 阶段进行用户角度质疑', () => {
            expect(cursorrules).toContain('C1');
            expect(cursorrules).toContain('用户角度');
        });

        test('规则文件包含至少3个质疑维度', () => {
            const matches = cursorrules.match(/质疑 [123]/g);
            expect(matches).not.toBeNull();
            expect(matches.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('功能完整性检查规则验证', () => {
        test('规则文件包含"功能完整性检查"规则', () => {
            expect(cursorrules).toContain('功能完整性检查');
            expect(antigravityRules).toContain('功能完整性检查');
        });

        test('规则文件包含5个通用维度', () => {
            expect(cursorrules).toContain('用户维度');
            expect(cursorrules).toContain('技术维度');
            expect(cursorrules).toContain('管理维度');
            expect(cursorrules).toContain('产品逻辑维度');
            expect(cursorrules).toContain('体验维度');
        });

        test('规则文件在 antigravity 中也包含5个维度', () => {
            expect(antigravityRules).toContain('用户维度');
            expect(antigravityRules).toContain('技术维度');
            expect(antigravityRules).toContain('管理维度');
            expect(antigravityRules).toContain('产品逻辑维度');
            expect(antigravityRules).toContain('体验维度');
        });
    });

    describe('分段写入规则验证', () => {
        test('规则文件包含"分段写入"规则', () => {
            expect(cursorrules).toContain('分段写入');
            expect(antigravityRules).toContain('分段写入');
        });

        test('规则文件包含"确认一个，写入一个"', () => {
            expect(cursorrules).toContain('确认一个，写入一个');
            expect(antigravityRules).toContain('确认一个，写入一个');
        });

        test('规则文件包含里程碑保存点', () => {
            expect(cursorrules).toContain('里程碑保存点');
            expect(antigravityRules).toContain('里程碑保存点');
        });
    });

    describe('错误示例验证（帮助 AI 理解什么是错误行为）', () => {
        test('规则文件包含错误示例', () => {
            expect(cursorrules).toContain('❌ 错误');
            expect(cursorrules).toContain('✅ 正确');
        });

        test('规则文件包含对话示例', () => {
            expect(cursorrules).toContain('PM:');
            expect(cursorrules).toContain('AI:');
        });
    });

    describe('恶意绕过场景检测', () => {
        // 这些测试验证规则是否覆盖了常见的绕过场景

        test('场景1: 快速完成绕过 - 规则应阻止', () => {
            // PM 说"帮我快速完成"，规则应要求 AI 拒绝
            expect(cursorrules).toContain('快速完成');
            expect(cursorrules).toContain('跳过流程');
        });

        test('场景2: 只说前端不说后台 - 规则应要求追问', () => {
            // PM 只说前端需求，规则应要求 AI 追问后台
            expect(cursorrules).toContain('管理维度');
            expect(cursorrules).toContain('技术维度');
        });

        test('场景3: 跳过质疑直接记录 - 规则应阻止', () => {
            // PM 说需求，AI 直接记录，规则应要求先质疑
            expect(cursorrules).toContain('用户角度');
            expect(cursorrules).toContain('质疑');
        });

        test('场景4: 在冻结后修改文档 - 规则应阻止', () => {
            // B3 冻结后尝试修改 B1，规则应阻止
            expect(cursorrules).toContain('B3 冻结后');
            expect(cursorrules).toContain('禁止做的');
            expect(cursorrules).toContain('修改 B1');
        });

        test('场景5: 在 C1 阶段新增需求 - 规则应阻止并指引正确做法', () => {
            // C1 阶段发现新需求，规则应要求暂存到 A2
            expect(cursorrules).toContain('C1 阶段');
            expect(cursorrules).toContain('新需求');
            expect(cursorrules).toContain('暂存到 A2');
        });

        test('场景6: "需求说完了"后不检查 - 规则应要求检查', () => {
            // PM 说"需求说完了"，规则应要求 AI 做功能完整性检查
            expect(cursorrules).toContain('需求说完');
            expect(cursorrules).toContain('5 个维度');
        });
    });

    describe('规则一致性验证', () => {
        test('.cursorrules 和 .antigravity/rules.md 应有相同的核心规则', () => {
            // 验证两个文件的核心规则一致
            const coreRules = [
                '禁止未经对话就填充文档',
                '禁止替 PM 做决策',
                '禁止修改已冻结的文档',
                '用户角度审计',
                '功能完整性检查'
            ];

            coreRules.forEach(rule => {
                expect(cursorrules).toContain(rule);
                expect(antigravityRules).toContain(rule);
            });
        });
    });
});
