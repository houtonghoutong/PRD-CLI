#!/usr/bin/env node

/**
 * postinstall 脚本
 * 在 npm install 完成后自动执行，复制 workflows 和规则文件到项目中
 */

const fs = require('fs');
const path = require('path');

// 静默模式运行
const SILENT = process.env.PRD_POSTINSTALL_SILENT === 'true';
const DEBUG = process.env.PRD_DEBUG === 'true';

function log(msg) {
    if (!SILENT) {
        console.log(msg);
    }
}

function debug(msg) {
    if (DEBUG) {
        console.log('[DEBUG]', msg);
    }
}

function logError(msg) {
    console.error(msg);
}

/**
 * 比较文件是否有变化
 */
function filesAreDifferent(sourcePath, targetPath) {
    if (!fs.existsSync(targetPath)) {
        return true;
    }

    try {
        const sourceContent = fs.readFileSync(sourcePath, 'utf8');
        const targetContent = fs.readFileSync(targetPath, 'utf8');
        return sourceContent !== targetContent;
    } catch {
        return true;
    }
}

/**
 * 获取目录下所有文件（递归）
 */
function getAllFiles(dirPath, basePath = dirPath) {
    const files = [];

    if (!fs.existsSync(dirPath)) {
        return files;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            files.push(...getAllFiles(fullPath, basePath));
        } else {
            files.push({
                fullPath,
                relativePath: path.relative(basePath, fullPath)
            });
        }
    }

    return files;
}

/**
 * 检查是否是全局安装
 */
function isGlobalInstall(packagePath) {
    // 全局安装的路径通常包含 lib/node_modules 或类似结构
    // 本地安装的路径是 项目/node_modules/包名
    const normalizedPath = packagePath.toLowerCase();

    // 检查是否在项目的 node_modules 中
    const pathParts = packagePath.split(path.sep);
    const nodeModulesIndex = pathParts.lastIndexOf('node_modules');

    if (nodeModulesIndex === -1) {
        return true; // 不在 node_modules 中，可能是开发环境
    }

    // 检查 node_modules 前面是否有 lib 目录（全局安装的特征）
    if (nodeModulesIndex > 0 && pathParts[nodeModulesIndex - 1] === 'lib') {
        return true;
    }

    // 检查是否在 /usr/local 或 /opt 等系统目录下
    if (normalizedPath.includes('/usr/') || normalizedPath.includes('/opt/')) {
        return true;
    }

    return false;
}

/**
 * 主函数
 */
function main() {
    try {
        // 获取 npm 包的路径
        // 脚本路径: node_modules/prd-workflow-cli/scripts/postinstall.js
        // __dirname = node_modules/prd-workflow-cli/scripts
        // packagePath = node_modules/prd-workflow-cli
        const packagePath = path.join(__dirname, '..');

        debug(`packagePath = ${packagePath}`);

        // 检查是否是全局安装
        if (isGlobalInstall(packagePath)) {
            debug('检测到全局安装，显示使用说明');

            // 全局安装时输出使用说明
            console.log('');
            console.log('╔════════════════════════════════════════════════════════════════╗');
            console.log('║           🎉 prd-workflow-cli 安装成功！                       ║');
            console.log('╠════════════════════════════════════════════════════════════════╣');
            console.log('║                                                                ║');
            console.log('║  📋 快速开始：                                                  ║');
            console.log('║                                                                ║');
            console.log('║     1. 创建新项目:                                             ║');
            console.log('║        prd init 我的项目                                       ║');
            console.log('║        cd 我的项目                                             ║');
            console.log('║                                                                ║');
            console.log('║     2. 或在现有目录初始化:                                      ║');
            console.log('║        cd 现有目录                                             ║');
            console.log('║        prd init .                                              ║');
            console.log('║                                                                ║');
            console.log('║  📖 查看帮助: prd --help                                       ║');
            console.log('║                                                                ║');
            console.log('║  🤖 AI 集成说明:                                               ║');
            console.log('║     初始化后会自动创建 AI 规则文件:                             ║');
            console.log('║     - .agent/workflows/  PRD 工作流指引                        ║');
            console.log('║     - .cursorrules       Cursor AI 规则                        ║');
            console.log('║     - .antigravity/      Antigravity AI 规则                   ║');
            console.log('║                                                                ║');
            console.log('╚════════════════════════════════════════════════════════════════╝');
            console.log('');

            return;
        }

        // 计算项目根目录
        // packagePath = /project/node_modules/prd-workflow-cli
        // node_modules = /project/node_modules
        // projectRoot = /project
        const nodeModulesPath = path.dirname(packagePath);
        const projectRoot = path.dirname(nodeModulesPath);

        debug(`nodeModulesPath = ${nodeModulesPath}`);
        debug(`projectRoot = ${projectRoot}`);

        // 验证项目根目录存在
        if (!fs.existsSync(projectRoot)) {
            debug('项目根目录不存在，跳过');
            return;
        }

        // 检查是否有 package.json（确认是一个 npm 项目）
        const packageJsonPath = path.join(projectRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            debug('项目根目录没有 package.json，跳过');
            return;
        }

        log('\n📦 prd-workflow-cli: 正在配置 AI 工作流文件...');

        // 定义需要复制的文件/目录
        const copyItems = [
            {
                name: 'Workflows',
                source: '.agent/workflows',
                target: '.agent/workflows',
                isDir: true
            },
            {
                name: 'Cursor Rules',
                source: '.cursorrules',
                target: '.cursorrules',
                isDir: false
            },
            {
                name: 'Antigravity Rules',
                source: '.antigravity',
                target: '.antigravity',
                isDir: true
            }
        ];

        let updatedCount = 0;
        let newCount = 0;

        for (const item of copyItems) {
            const sourcePath = path.join(packagePath, item.source);
            const targetPath = path.join(projectRoot, item.target);

            if (!fs.existsSync(sourcePath)) {
                debug(`源文件不存在: ${sourcePath}`);
                continue;
            }

            if (item.isDir) {
                // 处理目录
                const files = getAllFiles(sourcePath);

                for (const file of files) {
                    const targetFilePath = path.join(targetPath, file.relativePath);
                    const isNew = !fs.existsSync(targetFilePath);
                    const isDifferent = filesAreDifferent(file.fullPath, targetFilePath);

                    if (isDifferent) {
                        // 确保目标目录存在
                        const targetDir = path.dirname(targetFilePath);
                        if (!fs.existsSync(targetDir)) {
                            fs.mkdirSync(targetDir, { recursive: true });
                        }

                        fs.copyFileSync(file.fullPath, targetFilePath);

                        if (isNew) {
                            newCount++;
                        } else {
                            updatedCount++;
                        }
                    }
                }
            } else {
                // 处理单个文件
                const isNew = !fs.existsSync(targetPath);
                const isDifferent = filesAreDifferent(sourcePath, targetPath);

                if (isDifferent) {
                    // 确保目标目录存在
                    const targetDir = path.dirname(targetPath);
                    if (!fs.existsSync(targetDir)) {
                        fs.mkdirSync(targetDir, { recursive: true });
                    }

                    fs.copyFileSync(sourcePath, targetPath);

                    if (isNew) {
                        newCount++;
                    } else {
                        updatedCount++;
                    }
                }
            }
        }

        // 输出结果
        if (newCount > 0 || updatedCount > 0) {
            if (newCount > 0) {
                log(`   ✨ 新增 ${newCount} 个文件`);
            }
            if (updatedCount > 0) {
                log(`   🔄 更新 ${updatedCount} 个文件`);
            }
            log('   ✅ AI 工作流配置完成！\n');
            log('   📁 已添加文件:');
            log('      .agent/workflows/   - PRD 工作流指引');
            log('      .cursorrules        - Cursor AI 规则');
            log('      .antigravity/       - Antigravity AI 规则');
            log('      AI-GUIDE.md         - AI 使用指南\n');
        } else {
            log('   ✅ 所有配置文件已是最新版本\n');
        }

    } catch (error) {
        // postinstall 失败不应该阻止安装
        logError(`\n⚠️ prd-workflow-cli: 配置文件复制失败: ${error.message}`);
        logError('   您可以手动运行 "npx prd upgrade" 来完成配置\n');
    }
}

main();
