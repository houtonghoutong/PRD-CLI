#!/bin/bash

# PRD CLI 快速安装脚本
# 用于内部测试人员快速安装

set -e

echo "================================"
echo "  PRD CLI 工具 - 快速安装"
echo "================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js (>= 14.0.0)"
    echo "访问: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js 版本: $NODE_VERSION"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PACKAGE_FILE="$SCRIPT_DIR/prd-workflow-cli-1.0.0.tgz"

# 检查安装包
if [ ! -f "$PACKAGE_FILE" ]; then
    echo "❌ 找不到安装包: $PACKAGE_FILE"
    echo "请确保 prd-workflow-cli-1.0.0.tgz 文件在脚本同一目录"
    exit 1
fi

echo "📦 找到安装包: prd-workflow-cli-1.0.0.tgz"
echo ""

# 检查是否已安装
if command -v prd &> /dev/null; then
    INSTALLED_VERSION=$(prd --version 2>/dev/null || echo "unknown")
    echo "⚠️  检测到已安装版本: $INSTALLED_VERSION"
    read -p "是否覆盖安装？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "取消安装"
        exit 0
    fi
    
    echo "正在卸载旧版本..."
    npm uninstall -g prd-workflow-cli 2>/dev/null || true
fi

# 安装
echo "正在安装 PRD CLI 工具..."
echo ""

if npm install -g "$PACKAGE_FILE"; then
    echo ""
    echo "================================"
    echo "  ✅ 安装成功！"
    echo "================================"
    echo ""
    echo "验证安装："
    prd --version
    echo ""
    echo "查看帮助："
    echo "  prd --help"
    echo ""
    echo "快速开始："
    echo "  prd init 测试项目"
    echo "  cd 测试项目"
    echo "  prd status"
    echo ""
    echo "详细文档：内部测试安装指南.md"
    echo ""
else
    echo ""
    echo "❌ 安装失败"
    echo ""
    echo "可能的解决方案："
    echo "1. 使用 sudo 安装:"
    echo "   sudo npm install -g \"$PACKAGE_FILE\""
    echo ""
    echo "2. 配置用户级 npm 目录:"
    echo "   mkdir ~/.npm-global"
    echo "   npm config set prefix '~/.npm-global'"
    echo "   echo 'export PATH=~/.npm-global/bin:\$PATH' >> ~/.bashrc"
    echo "   source ~/.bashrc"
    echo ""
    exit 1
fi
