const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * 获取 CLI 包的安装路径
 * 优先从 node_modules 中查找（项目内安装），否则使用当前模块路径（全局安装）
 */
function getPackagePath() {
    // 项目内安装：检查当前工作目录的 node_modules
    const localPath = path.join(process.cwd(), 'node_modules', 'prd-workflow-cli');
    if (fs.existsSync(localPath)) {
        return localPath;
    }

    // 全局安装：使用模块自身的路径
    return path.join(__dirname, '..');
}

/**
 * 比较文件是否有变化
 */
async function filesAreDifferent(sourcePath, targetPath) {
    if (!await fs.pathExists(targetPath)) {
        return true; // 目标不存在，需要复制
    }

    try {
        const sourceContent = await fs.readFile(sourcePath, 'utf8');
        const targetContent = await fs.readFile(targetPath, 'utf8');
        return sourceContent !== targetContent;
    } catch {
        return true;
    }
}

/**
 * 递归获取目录下所有文件
 */
async function getAllFiles(dirPath, basePath = dirPath) {
    const files = [];
    const items = await fs.readdir(dirPath);

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
            const subFiles = await getAllFiles(fullPath, basePath);
            files.push(...subFiles);
        } else {
            files.push({
                fullPath,
                relativePath: path.relative(basePath, fullPath)
            });
        }
    }

    return files;
}

module.exports = async function (options = {}) {
    const projectPath = process.cwd();
    const { force = false, dryRun = false } = options;

    try {
        // 检查是否是 PRD 项目
        const configPath = path.join(projectPath, '.prd-config.json');
        if (!await fs.pathExists(configPath)) {
            console.log(chalk.red('✗ 当前目录不是 PRD 项目'));
            console.log(chalk.gray('  请在 PRD 项目根目录下运行此命令'));
            return;
        }

        const packagePath = getPackagePath();
        console.log(chalk.blue('📦 正在检查更新...'));
        console.log(chalk.gray(`   包路径: ${packagePath}`));

        // 获取包版本
        const packageJsonPath = path.join(packagePath, 'package.json');
        let packageVersion = 'unknown';
        if (await fs.pathExists(packageJsonPath)) {
            const pkg = await fs.readJSON(packageJsonPath);
            packageVersion = pkg.version;
        }
        console.log(chalk.gray(`   包版本: ${packageVersion}`));
        console.log('');

        // 定义需要更新的文件/目录
        const updateItems = [
            {
                name: 'Workflows (工作流)',
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

        const updatedFiles = [];
        const skippedFiles = [];
        const newFiles = [];

        for (const item of updateItems) {
            const sourcePath = path.join(packagePath, item.source);
            const targetPath = path.join(projectPath, item.target);

            if (!await fs.pathExists(sourcePath)) {
                console.log(chalk.yellow(`⚠ ${item.name}: 源文件不存在，跳过`));
                continue;
            }

            if (item.isDir) {
                // 处理目录
                const files = await getAllFiles(sourcePath);

                for (const file of files) {
                    const targetFilePath = path.join(targetPath, file.relativePath);
                    const isDifferent = await filesAreDifferent(file.fullPath, targetFilePath);
                    const isNew = !await fs.pathExists(targetFilePath);

                    if (isDifferent || force) {
                        if (!dryRun) {
                            await fs.ensureDir(path.dirname(targetFilePath));
                            await fs.copy(file.fullPath, targetFilePath);
                        }

                        const displayPath = path.join(item.target, file.relativePath);
                        if (isNew) {
                            newFiles.push(displayPath);
                        } else if (isDifferent) {
                            updatedFiles.push(displayPath);
                        }
                    } else {
                        skippedFiles.push(path.join(item.target, file.relativePath));
                    }
                }
            } else {
                // 处理单个文件
                const isDifferent = await filesAreDifferent(sourcePath, targetPath);
                const isNew = !await fs.pathExists(targetPath);

                if (isDifferent || force) {
                    if (!dryRun) {
                        await fs.ensureDir(path.dirname(targetPath));
                        await fs.copy(sourcePath, targetPath);
                    }

                    if (isNew) {
                        newFiles.push(item.target);
                    } else if (isDifferent) {
                        updatedFiles.push(item.target);
                    }
                } else {
                    skippedFiles.push(item.target);
                }
            }
        }

        // 输出结果
        console.log(chalk.bold('📋 更新结果:'));
        console.log('');

        if (dryRun) {
            console.log(chalk.yellow('🔍 预览模式（未实际更新）'));
            console.log('');
        }

        if (newFiles.length > 0) {
            console.log(chalk.green(`✨ 新增 ${newFiles.length} 个文件:`));
            for (const file of newFiles) {
                console.log(chalk.green(`   + ${file}`));
            }
            console.log('');
        }

        if (updatedFiles.length > 0) {
            console.log(chalk.cyan(`🔄 更新 ${updatedFiles.length} 个文件:`));
            for (const file of updatedFiles) {
                console.log(chalk.cyan(`   ~ ${file}`));
            }
            console.log('');
        }

        if (skippedFiles.length > 0 && options.verbose) {
            console.log(chalk.gray(`⏭ 跳过 ${skippedFiles.length} 个文件（无变化）:`));
            for (const file of skippedFiles) {
                console.log(chalk.gray(`   - ${file}`));
            }
            console.log('');
        }

        const totalChanges = newFiles.length + updatedFiles.length;

        if (totalChanges === 0) {
            console.log(chalk.green('✓ 所有文件已是最新版本！'));
        } else if (!dryRun) {
            console.log(chalk.green(`✓ 升级完成！共更新 ${totalChanges} 个文件`));
            console.log('');
            console.log(chalk.gray('提示: 建议检查更新后的文件，确保与项目配置兼容'));
        } else {
            console.log(chalk.yellow(`ℹ 如需执行更新，请去掉 --dry-run 参数`));
        }

    } catch (error) {
        console.log(chalk.red('✗ 升级失败:'), error.message);
        if (options.verbose) {
            console.error(error);
        }
    }
};
