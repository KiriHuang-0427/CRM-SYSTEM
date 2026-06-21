---
trigger: always_on
---
# CRM 项目开发规则

本规则适用于西门子OEM南京区域个人销售CRM系统的所有开发会话。

## 项目概况

- 项目名称：西门子OEM南京区域 · 个人销售CRM
- 当前版本：V26.06.15
- 公网地址：http://39.96.40.142
- 服务器：阿里云轻量服务器 Ubuntu 24.04 + Nginx + Node.js 20
- 技术栈：React 19 + TypeScript 6.0 + TailwindCSS v4 + Vite 8 / Express 4 + better-sqlite3 / SQLite

## 版本号规范

- 格式：`V{年}.{月}.{序号}`，如 V26.06.12
- 月份必须为实际日历月（6月只能用 V26.06.xx，禁止 V26.07.xx）
- 序号递增，同一月内不允许跳号
- 版本号需同步更新到：VERSION.md、server/index.js（2处）、ARCHITECTURE.md

## 禁止行为

- 禁止接入真实 AI 模型（**已过时** — V26.06.11 起已正式接入 DeepSeek/OpenAI）
- 禁止覆盖服务器数据库（只能通过 API 或迁移脚本修改）
- 禁止物理删除数据（仅允许 is_archived=1 软归档）
- 禁止重构现有业务功能（仅允许增量开发）
- **四域自动摘要原则：** 任何业务路由的 POST/PUT 操作成功后，必须调用 `memoryLogger` 写入一条摘要到 `ai_memories`。类型映射：客户→customer_profile、联系人→relationship、商机→project、待办→todo_context、速记→meeting、周报→weekly
- 禁止修改服务器 SSH 认证方式（复用现有 deploy_server.py）

## SQL 查询安全

- 写任何 SELECT/INSERT/UPDATE 前，必须先用 Grep 或 Read 确认表结构（`CREATE TABLE` 或 migration 文件）
- 禁止假设列名（如 todos 表用 `text` 而非 `title`，pipeline_stages 用 `pipe_stage` 而非 `stage`）
- 使用 better-sqlite3 参数化查询，禁止拼接 SQL 字符串

## API 数据一致性

- 返回分页/过滤数据时，`total` 字段必须使用与 `rows` 相同的 WHERE 条件
- 禁止出现：rows 按 domain 过滤，但 total 返回全局总数
- 统计类端点（如 getPoolSummary）必须完整包含域下所有类型，不得跳过任何类型

## 前端状态持久化

- 复杂交互状态（反思对话、AI 教练、多步骤表单）必须用 localStorage 持久化
- key 格式：`crm-{module}-{weekId/entityId}`，确保数据隔离
- 页面切换后能完整恢复状态，不应丢失用户输入
- 状态变化时自动保存（useEffect），不要依赖手动触发

## AI Prompt 工程

- 多轮对话首轮必须提出 2-3 个不同维度的问题，编号列出，禁止只问一个问题
- 后续轮次必须“简短回应 + 切换全新角度”，禁止在同一话题上深挖
- 收敛阈值建议 2-3 轮，收敛时先简短总结再提最后一个反思问题
- 前置上下文必须丰富：包含业务数据、近期操作、历史对比，禁止只用单一数据源

## 部署规范

- 部署命令：`py deploy_server.py`（Windows 用 py 不是 python）
- 部署后必须冒烟测试：
  1. `GET /api/health` — 验证版本号正确
  2. `GET /api/memories/stats/summary` — 验证记忆数据完整性
  3. `GET /api/memories/unlinked?limit=2` — 验证审核端点可用

## 版本发布流程

每次代码更新后按顺序执行：
1. 确定版本号（V{年}.{月}.{序号}递增）
2. 更新 VERSION.md（当前版本行 + 日志表新行）
3. 更新 server/index.js 版本号（health 端点 + 启动日志共 2 处）
4. 如有架构变更：更新 ARCHITECTURE.md
5. `npm run build` 构建前端
6. `py deploy_server.py` 部署
7. 冒烟测试
8. `git add` + `git commit -m "V{版本}: {摘要}"` + `git tag V{版本}`
9. KB 同步：复制 VERSION.md / ARCHITECTURE.md 到 `D:\知识库创建\08_CRM系统\`
10. 更新决策日志 `D:\知识库创建\00_会话决策日志\决策日志.md`

## 本地开发

- 前端：`cd react-vite && npx vite`（默认 http://localhost:5173）
- 后端：`cd server && node index.js`（端口 3001，自动初始化数据库）
- 构建：`npm run build`（tsc -b && vite build → dist/）

## 数据库结构

- 文件：data/crm.db（WAL 模式，16 张表）
- 业务表 12 张：customers, contacts, pipeline_stages, todos, notes, talk_points, sub_customers, invest_items, weekly_reports, weekly_focuses, weekly_actions, weekly_daily_notes
- AI 记忆层 4 张：ai_memories, ai_source_files, ai_import_jobs, ai_memory_links

## 关键路径

- 知识库根目录：`D:\知识库创建\`
- 决策日志：`D:\知识库创建\00_会话决策日志\决策日志.md`
- KB 同步目标：`D:\知识库创建\08_CRM系统\`
- 部署脚本：`react-vite/deploy_server.py`
