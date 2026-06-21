# CRM 版本记录

> 西门子OEM南京区域 · 个人销售CRM系统

## 当前版本

**V26.06.14** — 周报AI反思系统：多轮反思对话+自动收敛+结束反思四步闭环(客户识别→销售域写入→成长域写入→交付报告) + 每日记录智能提取 + 下周计划跨周自动同步 + 交互哲学注入AI域

## 版本命名规范

格式: `V{年}.{月}.{序号}`，例如 `V26.06.01` = 2026年6月第1个版本

## 架构概况

- **前端**: React 18 + TypeScript + TailwindCSS v4 + Framer Motion + Recharts
- **后端**: Node.js + Express + better-sqlite3
- **数据库**: SQLite (crm.db)
- **服务器**: 阿里云轻量应用服务器 39.96.40.142 (Ubuntu 24.04 + Nginx + Node.js 20)
- **域名**: kirihuang.com (ICP备案中)

## 版本更新日志

| 版本号 | 日期 | 变更摘要 | 备注 |
|--------|------|----------|------|
| V26.06.14 | 2026-06-21 | 周报AI反思系统：多轮反思对话+自动收敛+结束反思四步闭环(客户识别→销售域→成长域→交付报告) + 每日记录智能提取 + 下周计划跨周同步 + 交互哲学注入AI域 | AI反思闭环版 |
| V26.06.13 | 2026-06-20 | 工程化沉淀：fullstack-scaffold v2(含memoryLogger模板+Vite代理) + crm-development规则更新(四域自动摘要) + memoryAudit域审计服务 + salesMemoryAgent战术报告 | 工程化沉淀版 |
| V26.06.12 | 2026-06-20 | 四域闭环：memoryLogger自动摘要(16处钩子) + AI教练反馈闭环 + 手动写入记忆域卡片 + 待办/速记/周报全联动 | 四域闭环版 |
| V26.06.11 | 2026-06-20 | AI全面接入：openaiProvider.js(多模型) + AI销售教练7卡片(10数据源) + AI周报智能总结 + 历史周报导入(7周/37重点/96行动) + AI中枢UI统一 | AI全面接入版 |
| V26.06.10 | 2026-06-16 | AI记忆四层架构升级：memoryRouter.js关键词智能路由、17种类型×4域体系(memoryTypes.js+memory_domains表)、L3 insight/L4 strategy_plan分层、统一/api/context/query入口(4端点)、contextBuilder.js重构接入Router+TopK、Phase3-7框架预留(6新表+4服务骨架)、AI中枢前端页面 | AI记忆架构升级版 |
| V26.06.09 | 2026-06-16 | 架构分层重构：database.js 953→27行、index.js 207→85行；新增db/migrations/目录(10个版本化迁移脚本)、middleware/目录(validate.js+errorHandler.js)、config/目录(config/index.js)、routes/notes.js+investItems.js提取；11处写操作添加参数校验 | 架构稳定性重构版 |
| V26.06.07 | 2026-06-14 | 本地历史资料上传服务器/opt/crm/imports/并导入257条记忆(184新增+73种子)，ai_memories新增review_status/review_note/reviewed_at三字段，新增5个审核API端点(unlinked/link-customer/mark-unlinked-reviewed/archive/batch)，新增第8导航页AI记忆审核(统计栏+筛选器+记忆卡片+关联/标记/归档+批量操作) | 服务器历史导入+记忆审核版 |
| V26.06.06 | 2026-06-14 | 新增ai_memories/ai_source_files/ai_import_jobs/ai_memory_links四张AI地基表，新增Memory API(查询/详情/统计/软删除)，新增客户上下文聚合接口/api/customers/:id/context，历史资料迁移脚本(29文件184条记忆从D:\知识库创建\06_客户追踪导入)，客户详情新增AI记忆面板，AI Provider预留目录 | AI地基与历史资料迁移版 |
| V26.06.05 | 2026-06-14 | Todo创建时间戳显示、Revenue图表YAxis200+滚动+柱宽1.2x、Pipeline卡片Win/Lost按钮+赢得商机区+手动添加删除、投资评分矩阵客户列+名称可编辑、周报W22-W24数据迁移修复、速记弹窗历史笔记回顾、Git仓库初始化 | 交互增强版+Git版本管理 |
| V26.06.04 | 2026-06-14 | Todo状态筛选切换、周报独立API(4表8端点)+自动生成当前周+去Todo同步、客户CRUD全功能(新增/编辑/删除+联系人增删改含电话邮箱)、Pipeline丢失原因内联编辑、contacts表新增phone/email字段 | 结构优化版 |
| V26.06.03 | 2026-06-14 | 移除AI端点、Pipeline新增expected_close_date/status_description、Todos排序分状态优化、invest_items持久化表、optimistic UI、图表label≥180px | 非AI稳定版 |
| V26.06.02 | 2026-06-14 | Pipeline完整CRUD+丢失/恢复、仪表盘待办编辑、周报checkbox同步、AI教练动态样机增删、安全数据库迁移 | 全功能升级 |
| V26.06.01-patch1 | 2026-06-13 | 前端内容修正：全称显示、空状态、评分交互、周报受控、精力分配动态化 | 按设计计划审计修复12项 |
| V26.06.01 | 2026-06-13 | 全栈架构升级：前后端分离 + SQLite数据库 + RESTful API + 阿里云全栈部署 | 从纯静态前端升级为全栈应用 |
| V26.06.04 | 2026-06-12 | 云服务器公网部署，nginx静态文件服务 | 阿里云轻量服务器部署 |
| V26.06.03 | 2026-06-11 | 移动端适配：汉堡菜单+侧边栏抽屉+底部Tab导航 | 768px断点响应式 |
| V26.06.02 | 2026-06-10 | Vite+React+TypeScript重写，西门子品牌设计系统 | 从HTML单文件迁移 |
| V26.06.00 | 2026-06-01 | 初始HTML版本CRM看板 | 保留在知识库作为备份 |

## 文件存储路径

| 文件 | 路径 |
|------|------|
| 项目根目录 | `react-vite/` |
| 架构文档 | `react-vite/ARCHITECTURE.md` |
| 版本记录 | `react-vite/VERSION.md` |
| 架构可视化 | `D:\知识库创建\08_CRM系统\V26.06.01_architecture.html` |
| 架构文档副本 | `D:\知识库创建\08_CRM系统\ARCHITECTURE.md` |
| 版本记录副本 | `D:\知识库创建\08_CRM系统\VERSION.md` |
| 决策日志 | `D:\知识库创建\00_会话决策日志\决策日志.md` |
| 部署脚本 | `react-vite/deploy_server.py` |
| Git 仓库 | `react-vite/.git/`（本地版本管理） |
| 服务器代码 | `/opt/crm/` (远程) |

## 备份路径

- 服务器代码: `/opt/crm/`
- 知识库: `D:\知识库创建\08_CRM系统\`
