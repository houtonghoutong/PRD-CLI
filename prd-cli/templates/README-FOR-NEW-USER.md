# 🚀 新用户必读 - PRD 工作流项目

欢迎使用本项目！在开始之前，请先完成以下设置。

---

## 第 1 步：安装项目依赖

在项目根目录运行：

```bash
npm install
```

这会安装 `prd-workflow-cli` 和其他依赖。

---

## 第 2 步：验证安装

安装完成后，运行以下命令验证：

```bash
npx prd --version
```

如果显示版本号（如 `1.1.12`），说明安装成功。

---

## 第 3 步：使用 CLI 命令

**⚠️ 重要：请使用 `npx prd` 而不是 `prd`**

```bash
# 查看项目状态
npx prd status

# 创建基线文档
npx prd baseline create A0

# 创建规划文档
npx prd plan create B1

# 执行审视
npx prd review r1
```

### 其他 IDE

请参考 `.agent/workflows/` 目录中的工作流文档。

---

## 第 3 步：了解项目结构

```
项目目录/
├── 00_项目总览/          # P0 项目基本信息
├── 01_产品基线/          # A0/A1/A2/R0 基线文档
├── 02_迭代记录/          # 每轮迭代的 B/C/R 文档
├── 98_对话归档/          # PM 与 AI 的对话记录
├── 99_归档区/            # 历史版本归档
├── .agent/workflows/     # AI 工作流规则
├── .cursorrules          # Cursor AI 行为规则
└── .prd-config.json      # 项目配置
```

---

## 第 4 步：开始使用

### 查看项目状态

```bash
prd status
```

### 常用命令

| 命令 | 用途 |
|------|------|
| `prd status` | 查看当前状态 |
| `prd iteration list` | 列出所有迭代 |
| `prd plan create B1` | 创建规划草案 |
| `prd review r1` | 执行 R1 审视 |
| `prd version create C1` | 创建版本需求清单 |

---

## 遇到问题？

1. **命令提示 `prd: command not found`**
   - 说明 CLI 未安装，请回到第 1 步

2. **提示 "当前目录不是一个 PRD 项目"**
   - 确保你在项目根目录（包含 `.prd-config.json` 的目录）

3. **AI 行为不正确**
   - 检查 `.cursorrules` 文件是否存在
   - 可以提醒 AI："请遵循 .cursorrules 的规则"

---

**Happy Working! 🎉**
