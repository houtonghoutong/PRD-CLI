#!/bin/bash

echo "📦 PRD CLI 发布到 npm 流程"
echo "================================"
echo ""

# 1. 确保使用官方 npm 源
echo "1️⃣ 设置 npm 官方源..."
npm config set registry https://registry.npmjs.org/

# 2. 登录 npm
echo ""
echo "2️⃣ 登录 npm（请输入你的账号密码）"
echo "账号: houtong"
npm login

# 3. 确认登录状态
echo ""
echo "3️⃣ 确认登录状态..."
npm whoami

# 4. 运行测试
echo ""
echo "4️⃣ 运行测试..."
npm test

# 5. 发布
echo ""
echo "5️⃣ 发布到 npm..."
npm publish

# 6. 恢复国内镜像源（可选）
echo ""
echo "6️⃣ 恢复国内镜像源..."
npm config set registry https://registry.npmmirror.com/

echo ""
echo "🎉 发布完成！"
echo ""
echo "查看发布的包："
echo "https://www.npmjs.com/package/prd-workflow-cli"
