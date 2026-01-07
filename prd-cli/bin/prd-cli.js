#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const package = require('../package.json');

const program = new Command();

program
  .name('prd')
  .description('产品需求管理规范 CLI 工具 - 基于 A→R→B→C 流程')
  .version(package.version);

// 初始化命令
program
  .command('init <project-name>')
  .description('初始化一个新的产品需求管理项目')
  .action((projectName) => {
    require('../commands/init')(projectName);
  });

// 基线文档命令
program
  .command('baseline <action> [type]')
  .description('管理 A 类基线文档 (create A0|A1|A2|R0)')
  .option('--pm-confirmed', 'PM 已在对话中确认，跳过交互式确认（仅用于 R0）')
  .action((action, type, options) => {
    require('../commands/baseline')(action, type, options);
  });

// 迭代管理命令
program
  .command('iteration <action>')
  .description('管理迭代 (new|list|current)')
  .action((action) => {
    require('../commands/iteration')(action);
  });

// 规划文档命令  
program
  .command('plan <action> [type]')
  .description('管理 B 类规划文档 (create B1|B2, freeze)')
  .option('--pm-confirmed', 'PM 已在对话中确认，跳过交互式确认')
  .option('--pm-signature <name>', 'PM 签名（用于冻结操作）')
  .option('--force', '强制冻结，跳过前置检查（不推荐）')
  .action((action, type, options) => {
    require('../commands/planning')(action, type, options);
  });

// 审视命令
program
  .command('review <type>')
  .description('执行审视 (r1|r2)')
  .option('--pm-confirmed', 'PM 已在对话中确认，跳过交互式确认')
  .action((type, options) => {
    require('../commands/review')(type, options);
  });

// 版本文档命令
program
  .command('version <action> [type]')
  .description('管理 C 类版本文档 (create C0|C1, freeze)')
  .option('--pm-confirmed', 'PM 已在对话中确认，跳过交互式确认')
  .option('--pm-signature <name>', 'PM 签名（用于冻结操作）')
  .option('--force', '强制冻结，跳过前置检查（不推荐）')
  .action((action, type, options) => {
    require('../commands/version')(action, type, options);
  });

// IT (INVEST) 命令
program
  .command('it <action> [name]')
  .description('管理 IT 用户故事 (create|list|show)')
  .action((action, name, options) => {
    require('../commands/it')(action, name, options);
  });

// 需求变更命令
program
  .command('change')
  .description('记录需求变更（自动判断当前状态）')
  .action(() => {
    require('../commands/change')();
  });

// 状态查看命令
program
  .command('status')
  .description('查看当前项目状态和进度')
  .action(() => {
    require('../commands/status')();
  });

// 迭代索引命令
program
  .command('index')
  .description('生成/更新 P1 迭代索引')
  .action(() => {
    require('../commands/index')();
  });

// 升级命令
program
  .command('upgrade')
  .description('更新项目中的 workflows 和 AI 规则文件到最新版本')
  .option('--force', '强制更新所有文件，即使内容相同')
  .option('--dry-run', '预览模式，不实际更新文件')
  .option('-v, --verbose', '显示详细信息，包括跳过的文件')
  .action((options) => {
    require('../commands/upgrade')(options);
  });

// A2UI 预览服务
program
  .command('ui [file]')
  .description('启动 A2UI 界面预览服务 [可指定 .json 文件]')
  .option('-p, --port <number>', '指定端口号', '3333')
  .action((file, options) => {
    const A2UIServer = require('../commands/a2ui-server');
    const server = new A2UIServer(options.port, file);
    server.start();
  });

// 规则校验命令
program
  .command('check')
  .description('检查当前项目是否符合 PRD 规则')
  .option('--json', '输出 JSON 格式（供 AI 读取）')
  .option('--category <cat>', '只运行指定分类的规则 (G/D/F/S/V/I/U/C/W)')
  .option('--rule <id>', '只运行指定规则 (如 D001)')
  .option('--no-log', '不保存日志到 .prd-logs/')
  .action((options) => {
    require('../commands/check')(options);
  });

// 规则统计命令
program
  .command('stats')
  .description('显示规则校验统计报告（基于历史日志）')
  .option('--json', '输出 JSON 格式')
  .action((options) => {
    require('../commands/stats')(options);
  });

// 帮助信息增强
program.on('--help', () => {
  console.log('');
  console.log(chalk.bold('简化工作流（6 步）:'));
  console.log('  1. ' + chalk.cyan('prd init <项目名>') + '          # 初始化项目');
  console.log('  2. ' + chalk.cyan('prd plan create B1') + '          # 创建规划草案');
  console.log('  3. ' + chalk.cyan('prd plan create B2') + '          # 创建规划拆解');
  console.log('  4. ' + chalk.cyan('prd plan freeze') + '             # 冻结规划（自动 R1 审视）');
  console.log('  5. ' + chalk.cyan('prd version create C1') + '       # 创建版本需求（含版本范围）');
  console.log('  6. ' + chalk.cyan('prd version freeze') + '          # 冻结版本（自动 R2 审视）');
  console.log('');
  console.log(chalk.bold('文档说明:'));
  console.log('  A 类 - 现状基线文档 (A0, A1, A2)');
  console.log('  B 类 - 需求规划文档 (B1, B2, B3)');
  console.log('  C 类 - 版本需求文档 (C1 已含版本范围, C3)');
  console.log('  R 类 - 审视（已集成到 freeze 命令）');
  console.log('');
  console.log(chalk.bold('维护命令:'));
  console.log('  ' + chalk.cyan('prd upgrade') + '                 # 更新 workflows 和 AI 规则到最新版本');
  console.log('  ' + chalk.cyan('prd upgrade --dry-run') + '       # 预览将要更新的文件');
  console.log('');
});

// 智能处理：无参数时自动初始化
if (process.argv.length === 2) {
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(process.cwd(), '.prd-config.json');

  if (!fs.existsSync(configPath)) {
    // 不是 PRD 项目，自动初始化
    console.log(chalk.blue('📦 检测到当前目录尚未初始化 PRD 项目'));
    console.log(chalk.blue('🚀 正在自动初始化...'));
    console.log('');
    require('../commands/init')('.').then(() => {
      process.exit(0);
    }).catch((err) => {
      console.error(chalk.red('初始化失败:'), err.message);
      process.exit(1);
    });
  } else {
    // 已经是 PRD 项目，显示帮助
    program.parse(process.argv);
    program.outputHelp();
  }
} else {
  program.parse(process.argv);
}
