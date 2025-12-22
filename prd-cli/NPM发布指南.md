# 📦 发布到 npm 指南

## 当前版本：1.1.8

---

## 🚀 快速发布（推荐）

### 步骤 1：在终端运行

```bash
cd /Users/hou/Documents/UGit/PRD-CLI/prd-cli
./publish-to-npm.sh
```

按提示输入账号密码即可。

---

## 📋 手动发布步骤

### 1. 切换到官方源

```bash
npm config set registry https://registry.npmjs.org/
```

### 2. 登录 npm

```bash
npm login
```

会提示输入：
- Username: **houtong**
- Password: **[你的密码]**
- Email: **[你的邮箱]**

### 3. 验证登录

```bash
npm whoami
# 应该显示: houtong
```

### 4. 发布前测试

```bash
npm test
# 或
npm run test:cn
```

### 5. 发布

```bash
npm publish
```

### 6. （可选）恢复国内镜像

```bash
npm config set registry https://registry.npmmirror.com/
```

---

## ✅ 发布前检查清单

- [x] 版本号已更新（1.1.8）
- [x] CHANGELOG.md 已更新
- [x] 所有测试通过（46/46）
- [x] package.json 配置正确
- [x] .npmignore 已配置
- [x] Git 已提交所有更改

---

## 📦 发布内容

### 包含的文件：
- ✅ `bin/` - CLI 入口
- ✅ `commands/` - 命令实现
- ✅ `.agent/` - 工作流定义
- ✅ `.antigravity/` - AI 规则
- ✅ `templates/` - 文档模板
- ✅ `.cursorrules` - Cursor 规则
- ✅ `AI-GUIDE.md` - AI 指南
- ✅ `README.md` - 说明文档
- ✅ `GUIDE.md` - 使用指南

### 排除的文件（.npmignore）：
- ❌ `tests/` - 测试代码
- ❌ `coverage/` - 覆盖率报告
- ❌ `*.tgz` - 打包文件
- ❌ 各种修复说明文档

---

## 🔍 发布后验证

### 1. 检查 npm 页面

```
https://www.npmjs.com/package/prd-workflow-cli
```

应该显示版本 1.1.8

### 2. 测试全局安装

```bash
# 创建临时目录测试
cd /tmp
npm install -g prd-workflow-cli@1.1.8

# 验证
prd --version
prd init test-project
```

### 3. 检查下载统计

等待几分钟后，访问：
```
https://npm-stat.com/charts.html?package=prd-workflow-cli
```

---

## ⚠️ 常见问题

### Q1: 发布失败 - 401 Unauthorized
**解决**：重新登录
```bash
npm logout
npm login
```

### Q2: 发布失败 - 版本号已存在
**解决**：更新版本号
```bash
npm version patch  # 1.1.8 -> 1.1.9
npm publish
```

### Q3: 发布失败 - 需要 2FA
**解决**：输入双因素认证码
```bash
npm publish --otp=123456
```

### Q4: 发布后无法下载
**解决**：等待 npm CDN 同步（通常 5-10 分钟）

---

## 📈 版本管理

### 语义化版本

- **补丁版本**（1.1.8 -> 1.1.9）：Bug 修复
  ```bash
  npm version patch
  ```

- **次版本**（1.1.8 -> 1.2.0）：新功能，向后兼容
  ```bash
  npm version minor
  ```

- **主版本**（1.1.8 -> 2.0.0）：破坏性变更
  ```bash
  npm version major
  ```

---

## 🎉 发布成功后

1. ✅ 在 GitHub 创建 Release
2. ✅ 更新 README.md 的安装说明
3. ✅ 通知用户更新
4. ✅ 在社交媒体宣传

---

**祝发布顺利！** 🚀
