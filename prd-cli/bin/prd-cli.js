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
  .action((action, type) => {
    require('../commands/baseline')(action, type);
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
  .action((action, type) => {
    require('../commands/planning')(action, type);
  });

// 审视命令
program
  .command('review <type>')
  .description('执行审视 (r1|r2)')
  .action((type) => {
    require('../commands/review')(type);
  });

// 版本文档命令
program
  .command('version <action> [type]')
  .description('管理 C 类版本文档 (create C0|C1, freeze)')
  .action((action, type) => {
    require('../commands/version')(action, type);
  });

// 状态查看命令
program
  .command('status')
  .description('查看当前项目状态和进度')
  .action(() => {
    require('../commands/status')();
  });

// 帮助信息增强
program.on('--help', () => {
  console.log('');
  console.log(chalk.bold('典型工作流:'));
  console.log('  1. ' + chalk.cyan('prd init <项目名>') + '          # 初始化项目');
  console.log('  2. ' + chalk.cyan('prd baseline create A0') + '      # 创建产品基础文档');
  console.log('  3. ' + chalk.cyan('prd iteration new') + '           # 开始新迭代');
  console.log('  4. ' + chalk.cyan('prd plan create B1') + '          # 创建规划草案');
  console.log('  5. ' + chalk.cyan('prd review r1') + '               # R1 审视');
  console.log('  6. ' + chalk.cyan('prd plan freeze') + '             # 冻结规划(B3)');
  console.log('  7. ' + chalk.cyan('prd version create C0') + '       # 创建版本范围');
  console.log('  8. ' + chalk.cyan('prd review r2') + '               # R2 审视');
  console.log('  9. ' + chalk.cyan('prd version freeze') + '          # 冻结版本(C3)');
  console.log('');
  console.log(chalk.bold('文档说明:'));
  console.log('  A 类 - 现状基线文档 (A0, A1, A2, R0)');
  console.log('  B 类 - 需求规划文档 (B1, B2, B3)');
  console.log('  C 类 - 版本需求文档 (C0, C1, C3)');
  console.log('  R 类 - 审视报告 (R1, R2)');
  console.log('');
});

program.parse(process.argv);

// 如果没有参数，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
