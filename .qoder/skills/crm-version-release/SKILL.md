---
name: crm-version-release
description: CRM系统完整版本发布流程。包含版本号递增、文件更新、构建、部署、Git提交标签、知识库同步、决策日志更新。当用户提到新版本、发版、version release、版本发布时使用。
---

# CRM 版本发布全流程

执行从代码变更到生产上线的完整版本发布流程。

## 版本号规则

- 格式：`V{年}.{月}.{序号}`
- 当前最新：V26.06.10
- 月份必须为实际日历月（6月 → V26.06.xx，7月才能用 V26.07.xx）
- 序号递增，同一月内不跳号

## 执行步骤（严格按顺序）

### 1. 确定版本号

读取 VERSION.md 中当前版本，在同一月份内递增序号：
- V26.06.08 → V26.06.09
- 如果跨月（如从6月到7月）：V26.07.01

### 2. 更新 VERSION.md

- 修改"当前版本"行：`**V{新版本}** — {版本描述}`
- 在日志表顶部新增一行：版本号 | 日期 | 变更摘要 | 备注

### 3. 更新 server/index.js 版本号

搜索并替换 **2 处**：
- health 端点：`version: 'V{新版本}'`
- 启动日志：`Version: V{新版本}`

### 4. 更新 ARCHITECTURE.md（如有架构变更）

- 修改文档头版本号和日期
- 更新相关章节（新增 API、表结构、模块等）

### 5. 构建前端

```bash
cd C:\Users\tt\Desktop\react-vite
npm run build
```

### 6. 部署到服务器

```bash
py deploy_server.py
```

### 7. 冒烟测试

```
GET http://39.96.40.142/api/health           → 验证 version 字段
GET http://39.96.40.142/api/memories/stats/summary → 验证数据完整性
GET http://39.96.40.142/api/memories/unlinked?limit=2 → 验证审核端点
```

### 8. Git 提交 + 标签

```bash
git add <所有变更文件>
git commit -m "V{版本}: {变更摘要}"
git tag V{版本}
```

Git 路径（Windows PowerShell）：`& "C:\Program Files\Git\bin\git.exe"`

### 9. KB 同步

```powershell
Copy-Item "C:\Users\tt\Desktop\react-vite\VERSION.md" "D:\知识库创建\08_CRM系统\VERSION.md" -Force
Copy-Item "C:\Users\tt\Desktop\react-vite\ARCHITECTURE.md" "D:\知识库创建\08_CRM系统\ARCHITECTURE.md" -Force
```

### 10. 更新决策日志

在 `D:\知识库创建\00_会话决策日志\决策日志.md` 的 `---` 分割线后、最新日期条目之前插入：

```markdown
## {日期} {星期}

### {版本描述}（V{版本}）

**背景：** {为什么做这个版本}

**变更内容：**
- {具体变更1}
- {具体变更2}

**修改文件清单：**

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| ... | 修改 | ... |

---
```

### 11. 推送到远程仓库

```bash
git push
git push --tags
```

如远程仓库未配置，先执行：
```bash
git remote add origin <仓库URL>
git push -u origin main
```

推送前建议执行密钥扫描（参考 `git-secret-scan` Skill）。

## 完成后确认

向用户报告：
- 版本号
- 部署状态（health 响应）
- 数据完整性（记忆数量）
- Git commit hash + tag
- KB 同步状态
- 远程推送状态
