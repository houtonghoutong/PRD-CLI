#!/bin/bash

echo "📦 PRD CLI 发布到 npm (支持2FA)"
echo "================================"
echo ""

# 1. 确保已登录
echo "✓ 检查登录状态..."
npm whoami

if [ $? -ne 0 ]; then
    echo "❌ 未登录，请先登录"
    npm login
fi

# 2. 运行测试
echo ""
echo "🧪 运行测试..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ 测试失败，请修复后再发布"
    exit 1
fi

# 3. 提示输入 OTP
echo ""
echo "🔐 你的 npm 账号启用了双因素认证"
echo "请打开你的认证器应用（Google Authenticator等）"
echo "获取 npm 的6位验证码"
echo ""
read -p "请输入6位验证码: " otp

# 4. 发布
echo ""
echo "📦 发布到 npm..."
npm publish --otp=$otp

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 发布成功！"
    echo ""
    echo "查看发布的包："
    echo "https://www.npmjs.com/package/prd-workflow-cli"
    echo ""
    echo "安装命令："
    echo "npm install -g prd-workflow-cli@2.0.0"
else
    echo ""
    echo "❌ 发布失败"
    echo "可能的原因："
    echo "- OTP 验证码错误或已过期"
    echo "- 版本号已存在"
    echo "- 网络问题"
    echo ""
    echo "请检查错误信息并重试"
fi
