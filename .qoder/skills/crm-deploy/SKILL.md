---
name: crm-deploy
description: CRM系统一键部署到阿里云服务器。构建前端、SSH上传、重启服务、冒烟测试。当用户提到部署、deploy、发布到服务器、更新线上、推到服务器时使用。
---

# CRM 一键部署

将本地 CRM 项目部署到阿里云生产服务器（39.96.40.142）。

## 前置条件

- 本地项目路径：`C:\Users\tt\Desktop\react-vite`
- Python 可用（Windows 用 `py` 命令，不是 `python`）
- paramiko 库已安装（`pip install paramiko`）

## 部署流程

### Step 1: 构建前端

```bash
cd C:\Users\tt\Desktop\react-vite
npm run build
```

预期输出：dist/index.html + dist/assets/ 生成成功。

### Step 2: 执行部署脚本

```bash
py deploy_server.py
```

脚本自动完成：
- 构建前端（tsc + vite build）
- 连接服务器 SSH（root@39.96.40.142:22）
- 备份服务器数据库到 /opt/crm/data/backups/
- 上传 dist/ 和 server/ 到 /opt/crm/
- npm install + rebuild better-sqlite3（Linux native 模块）
- 配置 nginx + 重启 crm-server systemd 服务

### Step 3: 冒烟测试

部署完成后立即验证：

```
GET http://39.96.40.142/api/health
```

检查项：
1. `version` 字段为当前版本号
2. `status` 为 `"ok"`
3. `customers`、`memories` 数量与预期一致

```
GET http://39.96.40.142/api/memories/stats/summary
```

检查项：
1. `totalActive` 记忆数量正确
2. `byReviewStatus` 审核分布合理

```
GET http://39.96.40.142/api/memories/unlinked?limit=2
```

检查项：
1. 返回未关联记忆列表
2. 分页参数正确

## 服务器信息

- IP：39.96.40.142
- OS：Ubuntu 24.04
- Nginx：监听 80 端口，反向代理到 localhost:3001
- Node.js：20，端口 3001
- systemd 服务：crm-server
- 远程路径：/opt/crm/

## 常见问题

- better-sqlite3 编译失败 → 服务器自动 `npm rebuild`，如仍失败需 SSH 登录手动处理
- 端口占用 → systemd 自动重启，检查 `systemctl status crm-server`
- 数据库被覆盖 → 部署脚本自动备份，恢复用 `cp backup.db crm.db`
