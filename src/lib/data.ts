// CRM Data Model & Seed Data
// Extracted from 个人销售CRM_v5.1.html
//
// ┌─────────────────────────────────────────────────────────────┐
// │  v7 架构升级说明 (V26.06.01)                                │
// │                                                             │
// │  客户数据已迁移至后端 SQLite 数据库 (server/database.js)     │
// │  前端通过 /api/* 接口获取数据 (src/lib/api.ts)               │
// │                                                             │
// │  本文件保留 CUSTOMERS 数组作为:                              │
// │    1. SQLite 初始种子数据源 (server/database.js 引用)      │
// │    2. 离线/降级场景的 fallback 数据                          │
// │                                                             │
// │  日常数据修改请通过 CRM 界面操作，后端会持久化到 SQLite。    │
// │  如需批量导入/修改种子数据，更新本文件后重启服务即可。        │
// └─────────────────────────────────────────────────────────────┘

// ─── Interfaces ───────────────────────────────────────────────

export interface SalesData {
  PY?: number;
  PY_YTD?: number;
  CY_YTD?: number;
  CY_P8?: number;
}

export interface KeyPerson {
  name: string;
  role: string;
  tag?: string;
  tagCls?: string;
  stars: number;
}

export interface PipelineItem {
  name: string;
  stage?: string;
  amount?: string;
  pipeStage: number;
  note?: string;
}

export interface NextAction {
  action: string;
  deadline: string;
}

export interface TalkPoint {
  title: string;
  color: string;
  bg: string;
  text: string;
}

export interface Customer {
  id: string;
  name: string;
  color: 'red' | 'orange' | 'green' | 'gray';
  industry: string;
  revenue: string;
  nextYear?: string;
  comp?: string;
  lastVisit?: string;
  salesData: SalesData;
  keyPersons: KeyPerson[];
  pipeline: PipelineItem[];
  nextActions: NextAction[];
  aiCoach?: string;
  risk?: string;
  talkStrategy?: string;
  talkPoints?: TalkPoint[];
  isGroup?: boolean;
  parentProject?: string;
  subCustomers?: { name: string; tag: string }[];
}

export interface PipeStage {
  num: number;
  name: string;
  color: string;
}

export interface CompetitorIntel {
  name: string;
  desc: string;
}

// ─── Customers ────────────────────────────────────────────────

export const CUSTOMERS: Customer[] = [
  {
    id: 'huazhang',
    name: '江苏华章物流科技股份有限公司',
    color: 'red',
    industry: '场内物流/仓储自动化',
    revenue: '4.38M',
    nextYear: '6-8M',
    comp: '伟创、雷赛、信捷',
    lastVisit: '2026-06-05',
    salesData: { PY: 2209.7, CY_YTD: 4384.1, CY_P8: 4384.1 },
    keyPersons: [
      { name: '王超全', role: '电气部长/股东', tag: '核心决策', tagCls: 'tag-blue', stars: 4 },
      { name: '张彪', role: '铁杆盟友', tag: '铁杆', tagCls: 'tag-green', stars: 5 },
      { name: '周佳源', role: '供应链主管', tag: '新对接', tagCls: 'tag-blue', stars: 3 },
    ],
    pipeline: [
      { name: 'SIMOTICS E', stage: '推迟提货', amount: '~2M', pipeStage: 6 },
      { name: '900系列穿梭车', stage: '样机窗口期', amount: '年1000套', pipeStage: 3 },
      { name: '顶升移载', stage: '方案准备', pipeStage: 2 },
    ],
    nextActions: [{ action: '约周佳源确认库存', deadline: 'W24' }],
    aiCoach: '精力放在900系列和顶升移载',
    risk: 'SIMOTICS E零提货',
    talkStrategy: '900系列年需求1000套是核心机会，先提供样机建立信任；顶升移载替代雷赛方案已有初步意向，抓紧推进技术验证',
  },
  {
    id: 'taikeman',
    name: '泰克曼（南京）安防技术股份有限公司',
    color: 'red',
    industry: '制造/数字化',
    revenue: '1.19M',
    nextYear: '2.5-3M',
    lastVisit: '2026-06-04',
    salesData: { PY: 0, CY_YTD: 1185.8, CY_P8: 1185.8 },
    keyPersons: [
      { name: '吴老板', role: '老板', tagCls: 'tag-blue', stars: 5 },
      { name: '阮经理', role: '项目经理', tagCls: 'tag-orange', stars: 4 },
    ],
    pipeline: [
      { name: '2500PCS图纸危机', stage: '紧急', pipeStage: 4 },
      { name: 'DCJ零件', stage: '已下单', pipeStage: 6 },
    ],
    nextActions: [{ action: '回复图纸进展', deadline: 'W24周一' }],
    aiCoach: '给信心+给时间线',
    talkPoints: [
      { title: '回复图纸问题', color: 'var(--status-warning)', bg: 'rgba(243, 156, 18, 0.08)', text: '阮经理，德国那边图纸复核已经在推进中，我们这边也在积极配合，预计本周内会有明确回复。' },
      { title: '给信心', color: 'var(--status-success)', bg: 'rgba(39, 174, 96, 0.08)', text: '2500套的产品我们已经全部交付了，后续的产品也会按照计划推进，质量方面您放心。' },
      { title: '如果催得急', color: 'var(--status-danger)', bg: 'rgba(231, 76, 60, 0.08)', text: '完全理解，这个确实是我们需要改进的地方，我会亲自跟进，确保不会再出现类似情况。' },
      { title: '危机后切入数字化', color: 'var(--status-info)', bg: 'rgba(41, 128, 185, 0.08)', text: '阮经理/吴老板，图纸这个事总算解决了，接下来我们可以聊聊数字化产线的规划，我们有DDT预测性维护方案。' },
    ],
    talkStrategy: '图纸危机关键是给信心+给时间线；危机解决后是切入数字化方案的好时机',
  },
  {
    id: 'liuwei',
    name: '江苏六维智能物流装备股份有限公司',
    color: 'red',
    industry: '场内物流',
    revenue: '0.57M',
    nextYear: '1-2M',
    comp: '丹佛斯',
    lastVisit: '2026-06-05',
    salesData: { PY_YTD: 705, CY_YTD: 571.9, CY_P8: 571.9 },
    keyPersons: [
      { name: '阎激光', role: '铁杆', tagCls: 'tag-green', stars: 5 },
    ],
    pipeline: [
      { name: '飞箱机器人', stage: '报价待反馈', pipeStage: 3 },
    ],
    nextActions: [{ action: '联系阎激光', deadline: 'W24周二' }],
    aiCoach: '突破万峰华',
    talkStrategy: '飞箱机器人是切入六维的关键项目，突破万峰华是绕开丹佛斯壁垒的关键路径',
  },
  {
    id: 'guanchao',
    name: '江苏冠超物流科技有限公司',
    color: 'red',
    industry: '物流科技',
    revenue: '0.16M',
    comp: '汇川',
    lastVisit: '2026-04-21',
    salesData: { PY_YTD: 502.5, CY_YTD: 164.7, CY_P8: 164.7 },
    keyPersons: [
      { name: '朱明成', role: '采购', tagCls: 'tag-blue', stars: 4 },
    ],
    pipeline: [
      { name: 'V20替代', stage: '评估中', pipeStage: 2 },
    ],
    nextActions: [{ action: '确认折扣', deadline: '已过期' }],
    aiCoach: '方案打包差异化',
    risk: '47天未拜访',
    talkStrategy: '汇川已入名录，需要在方案打包上做差异化，不能只拼价格',
  },
  {
    id: 'yinfei',
    name: '南京音飞储存设备（集团）股份有限公司',
    color: 'orange',
    industry: '仓储物流',
    revenue: '1.26M',
    nextYear: '2-3M',
    lastVisit: '2026-06-04',
    salesData: { PY_YTD: 486.3, CY_YTD: 1260.1, CY_P8: 1260.1 },
    keyPersons: [
      { name: '钟观香', role: '供应链', tagCls: 'tag-blue', stars: 4 },
    ],
    pipeline: [
      { name: '年框续签', stage: '紧急', pipeStage: 5 },
      { name: '提升机', stage: '受阻', pipeStage: 4 },
      { name: '贵阳安达输送线', stage: '样机推进', pipeStage: 4, note: '音飞旗下项目' },
    ],
    nextActions: [{ action: '整理年框清单', deadline: 'W24周二' }],
    aiCoach: '年框写入900系列',
    talkStrategy: '年框6月底到期是最大紧迫点，谈判时把900系列写入框架；贵阳安达项目是音飞旗下，要一起谈',
  },
  {
    id: 'huade',
    name: '南京华德仓储设备制造有限公司',
    color: 'orange',
    industry: '仓储物流',
    revenue: '0.72M',
    nextYear: '1-2M',
    comp: 'SEW',
    lastVisit: '2026-06-05',
    salesData: { PY_YTD: 1374.9, CY_YTD: 720.6, CY_P8: 720.6 },
    keyPersons: [
      { name: '周义术', role: '副总', tagCls: 'tag-blue', stars: 4 },
    ],
    pipeline: [
      { name: '重载堆垛机', stage: 'W25确认', pipeStage: 4 },
    ],
    nextActions: [{ action: '核对价格', deadline: 'W24周一' }],
    aiCoach: '55kW总价<SEW 65W',
    talkStrategy: '西门子55kW+第三方减速机总价<SEW 65W，这是核心卖点；周义术是导师型客户，要给足面子',
  },
  {
    id: 'zhuoneng',
    name: '南京卓能机械设备有限公司',
    color: 'green',
    industry: '制造/包装',
    revenue: '3.39M',
    nextYear: '3.5-4M',
    comp: '三菱',
    lastVisit: '2026-05-20',
    salesData: { PY_YTD: 1465.2, CY_YTD: 3388.1, CY_P8: 3388.1 },
    keyPersons: [
      { name: '王琳凯', role: '铁杆', tagCls: 'tag-green', stars: 5 },
    ],
    pipeline: [
      { name: '纸袋机', stage: '批量执行', amount: '~3M', pipeStage: 6 },
    ],
    nextActions: [{ action: 'S200问题', deadline: '已过期' }],
    aiCoach: '帮王琳凯内部防守',
    talkStrategy: '王琳凯是铁杆盟友，关键是帮他在内部替你说话；S200问题要尽快解决避免影响信任',
  },
  {
    id: 'tiandiren',
    name: '南京天地人自动化技术有限公司',
    color: 'green',
    industry: '穿梭车/四向车',
    revenue: '0.63M',
    lastVisit: '2026-05-29',
    salesData: { PY_YTD: 552.7, CY_YTD: 632, CY_P8: 632 },
    keyPersons: [],
    pipeline: [
      { name: 'SIPLUS 1200', stage: '执行中', pipeStage: 6 },
    ],
    nextActions: [],
    aiCoach: '确认特价延续',
    talkStrategy: 'SIPLUS 1200特价延续性是核心关注点，要提前确认避免后续价格波动',
  },
  {
    id: 'rongzhida',
    name: '南京融智达电气科技有限公司',
    color: 'green',
    industry: '数据中心',
    revenue: '0.51M',
    salesData: { PY_YTD: 62, CY_YTD: 511.6, CY_P8: 511.6 },
    keyPersons: [],
    pipeline: [
      { name: '动力方案', stage: '初步接触', pipeStage: 1 },
    ],
    nextActions: [{ action: '安排拜访', deadline: '待安排' }],
    aiCoach: '增长7倍',
    talkStrategy: '同比增长7倍是亮点，需要尽快安排拜访了解新需求',
  },
  {
    id: 'xinghang',
    name: '南京兴航船舶电气有限公司',
    color: 'green',
    industry: '船舶电器',
    revenue: '0',
    comp: 'ABB',
    lastVisit: '2026-06-05',
    salesData: { PY: 0, CY_YTD: 0, CY_P8: 0 },
    keyPersons: [],
    pipeline: [
      { name: 'EP替代', stage: '需样机', pipeStage: 1 },
    ],
    nextActions: [{ action: 'EP配置', deadline: 'W24' }],
    aiCoach: '先样机后批量',
    talkStrategy: '先提供EP样机和报价，建立信任后推批量',
  },
  {
    id: 'chengrui',
    name: '江苏成瑞储能科技有限公司',
    color: 'green',
    industry: '储能',
    revenue: '0',
    comp: 'ABB',
    lastVisit: '2026-06-05',
    salesData: { PY: 0, CY_YTD: 0, CY_P8: 0 },
    keyPersons: [],
    pipeline: [
      { name: 'EP替代', stage: '小项目先行', pipeStage: 1 },
    ],
    nextActions: [{ action: 'EP清单', deadline: 'W24' }],
    aiCoach: '小批量先行',
    talkStrategy: 'FA已被竞对签走，EP替代ABB从小批量开始建立信任',
  },
  {
    id: 'shengjiu',
    name: '南京盛玖新能源科技有限公司',
    color: 'green',
    industry: '新能源',
    revenue: '0',
    lastVisit: '2026-06-02',
    salesData: { PY: 0, CY_YTD: 0, CY_P8: 0 },
    keyPersons: [],
    pipeline: [
      { name: '港机储能', stage: '方案完成', pipeStage: 1 },
    ],
    nextActions: [{ action: '成本明细', deadline: 'W24' }],
    aiCoach: '主推ESSM+DCDC',
    talkStrategy: '港机储能是核心方向，主推ESSM+DCDC整套方案',
  },
  {
    id: 'yixing',
    name: '南京翌星自动化系统有限公司',
    color: 'green',
    industry: 'AGV/AMR',
    revenue: '0.14M',
    lastVisit: '2026-05-23',
    salesData: { PY_YTD: 1268.3, CY_YTD: 139.6, CY_P8: 139.6 },
    keyPersons: [
      { name: '祖工', role: '电气', tagCls: 'tag-blue', stars: 3 },
    ],
    pipeline: [
      { name: '数字孪生', stage: '需求了解', pipeStage: 2 },
    ],
    nextActions: [],
    aiCoach: '多机会深耕',
    talkStrategy: '多个机会点值得深耕，数字孪生和SIMOVE都可以切入',
  },
  {
    id: 'zhiku',
    name: '江苏智库智能科技有限公司',
    color: 'green',
    industry: '智能科技',
    revenue: '0.15M',
    salesData: { PY_YTD: 132, CY_YTD: 145.7, CY_P8: 145.7 },
    keyPersons: [],
    pipeline: [
      { name: '中标项目', pipeStage: 2 },
    ],
    nextActions: [],
    aiCoach: '',
  },
  {
    id: 'wuyao',
    name: '伍曜智能',
    color: 'gray',
    industry: '待确认',
    revenue: '0',
    salesData: {},
    keyPersons: [],
    pipeline: [
      { name: '新客户', stage: '初步', pipeStage: 1 },
    ],
    nextActions: [{ action: '7月拜访', deadline: '7月' }],
    aiCoach: '音飞推荐',
  },
  {
    id: 'other',
    name: '新客户/待开发',
    color: 'gray',
    industry: '混合',
    revenue: '0',
    isGroup: true,
    salesData: {},
    subCustomers: [
      { name: '南京迈瑞', tag: '医疗' },
      { name: '溢泰环保', tag: '净水' },
      { name: '苏星智能', tag: '装备' },
      { name: '四向智能', tag: '仓储' },
      { name: '创彩出智', tag: '待确认' },
      { name: '顺丰压缩机', tag: '待确认' },
      { name: '微伽自动化', tag: '待确认' },
    ],
    keyPersons: [],
    pipeline: [],
    nextActions: [],
    aiCoach: '',
  },
];

// ─── Pipeline Stages ──────────────────────────────────────────

export const PIPE_STAGES: PipeStage[] = [
  { num: 1, name: '初步接触', color: '#2980B9' },
  { num: 2, name: '需求确认', color: '#8E44AD' },
  { num: 3, name: '方案报价', color: '#F39C12' },
  { num: 4, name: '商务谈判', color: '#E74C3C' },
  { num: 5, name: '签约在即', color: '#009999' },
  { num: 6, name: '执行交付', color: '#27AE60' },
];

// ─── Competitor Intel ─────────────────────────────────────────

export const COMPETITOR_INTEL: CompetitorIntel[] = [
  { name: '汇川', desc: '产品线覆盖伺服/PLC/HMI，价格比西门子低30-40%，服务响应快，在物流行业渗透率高' },
  { name: 'ABB', desc: '变频器+电机整体方案，品牌认知度高，在储能和新能源领域活跃' },
  { name: 'SEW', desc: '减速机+电机+变频一体化方案，在堆垛机领域是传统强者' },
  { name: '三菱', desc: '日系品牌，在包装机械领域有长期合作关系' },
  { name: '丹佛斯', desc: '液压+电驱双线，在场内物流有特定客户群' },
];

// ─── FY Target (K units) ──────────────────────────────────────

export const FY_TARGET = 15000;

// ─── Weekly Report Data ───────────────────────────────────────

export const WEEKLY_DATA = [
  {
    id: 'w24',
    label: 'W24 \u00b7 本周 (6/9 - 6/13)',
    isCurrent: true,
    focuses: [
      '音飞年框续签 \u2014 6月底到期，必须本周推进清单确认',
      '泰克曼图纸危机 \u2014 给信心+时间线，避免客户流失',
      '华章900系列样机 \u2014 窗口期，抓紧技术验证',
    ],
    actions: [
      { key: 'w24_a1', text: '周一：音飞年框清单整理' },
      { key: 'w24_a2', text: '周一：泰克曼图纸进展回复' },
      { key: 'w24_a3', text: '周二：华德价格核对' },
      { key: 'w24_a4', text: '周二：六维-联系阎激光' },
      { key: 'w24_a5', text: '周三：华章-约周佳源确认库存' },
      { key: 'w24_a6', text: '周四：兴航/成瑞 EP配置清单' },
      { key: 'w24_a7', text: '周五：盛玖成本明细输出' },
    ],
    days: [
      { key: 'w24_d1', label: '周一' },
      { key: 'w24_d2', label: '周二' },
      { key: 'w24_d3', label: '周三' },
      { key: 'w24_d4', label: '周四' },
      { key: 'w24_d5', label: '周五' },
    ],
  },
  {
    id: 'w23',
    label: 'W23 \u00b7 上周 (6/2 - 6/6)',
    isCurrent: false,
    completedItems: [
      '华章拜访(6/5)：确认900系列样机窗口期',
      '泰克曼拜访(6/4)：图纸问题沟通中',
      '音飞拜访(6/4)：年框续签启动',
      '六维拜访(6/5)：飞箱机器人报价提交',
      '华德拜访(6/5)：堆垛机方案推进',
      '兴航/成瑞拜访(6/5)：EP替代需求了解',
    ],
  },
  {
    id: 'w22',
    label: 'W22 \u00b7 (5/26 - 5/30)',
    isCurrent: false,
  },
];

// ─── AI Coach Scenarios ───────────────────────────────────────

export const COACH_SCENARIOS = [
  {
    title: '该催单了 \u2014 三种力度话术',
    icon: 'megaphone',
    levels: [
      {
        label: '轻度 \u00b7 友好提醒',
        color: 'var(--status-success)',
        bg: 'rgba(39, 174, 96, 0.06)',
        text: '\u201cX总，上次聊的那个方案我这边已经整理好了，随时可以给您过目。您看这周还是下周方便？\u201d',
      },
      {
        label: '中度 \u00b7 制造紧迫感',
        color: 'var(--status-warning)',
        bg: 'rgba(243, 156, 18, 0.06)',
        text: '\u201cX总，跟您说个情况，我们Q2的产能排期快满了，如果这周能确认的话我还能帮您卡住这个交期，不然后面可能要排到Q3了。\u201d',
      },
      {
        label: '重度 \u00b7 直接推进',
        color: 'var(--status-danger)',
        bg: 'rgba(231, 76, 60, 0.06)',
        text: '\u201cX总，这个项目已经拖了一段时间了，我这边压力也比较大。咱们能不能这周把合同签了？如果有什么顾虑您直接跟我说，我来想办法解决。\u201d',
      },
    ],
  },
  {
    title: '优雅说不 \u2014 拒绝不合理要求',
    icon: 'shield',
    levels: [
      {
        label: '拒绝降价',
        color: 'var(--status-danger)',
        bg: 'rgba(231, 76, 60, 0.06)',
        text: '\u201cX总，价格方面确实已经到底了，西门子品质您是知道的。不过我可以在服务上给您更多支持，比如延长质保、增加技术培训次数。\u201d',
      },
      {
        label: '拒绝紧急交期',
        color: 'var(--status-warning)',
        bg: 'rgba(243, 156, 18, 0.06)',
        text: '\u201cX总，完全理解您的紧急需求，但这个交期确实是生产周期决定的。我可以帮您申请加急，但最快也要X周。不如我们先把前期准备工作做好？\u201d',
      },
      {
        label: '拒绝免费样机',
        color: 'var(--status-warning)',
        bg: 'rgba(243, 156, 18, 0.06)',
        text: '\u201cX总，样机我们确实有成本压力。不过我有个方案：您先采购一台，如果后续批量达到X台，我把样机成本折算到批量价格里，相当于样机免费。\u201d',
      },
    ],
  },
  {
    title: '向上管理 \u2014 向老板争取资源',
    icon: 'arrow-up-circle',
    levels: [
      {
        label: '争取样机折扣',
        color: 'var(--accent)',
        bg: 'var(--alpha-teal-06)',
        text: '\u201c老板，华章的900系列穿梭车年需求1000套，这是战略级客户。我申请样机5折支持，预计3个月内可以转化批量订单，ROI非常高。\u201d',
      },
      {
        label: '请求高层出面',
        color: 'var(--accent)',
        bg: 'var(--alpha-teal-06)',
        text: '\u201c老板，音飞年框续签在关键期，对方供应链总监希望和我们高层见一面。如果您能出面，对续签的成功率会有很大帮助，时间大概需要2小时。\u201d',
      },
      {
        label: '争取战略客户政策',
        color: 'var(--accent)',
        bg: 'var(--alpha-teal-06)',
        text: '\u201c老板，卓能今年CY已经3400K，全年预计能到4M+。我建议给他们战略客户价格政策，这样可以锁定竞对三菱的替代空间。\u201d',
      },
    ],
  },
];

// ─── Investment Scoring ───────────────────────────────────────

export const INVESTMENT_ITEMS = [
  { name: '900系列穿梭车（华章）', key: 'score_900' },
  { name: '飞箱机器人（六维）', key: 'score_feixiang' },
  { name: '重载堆垛机（华德）', key: 'score_duoduo' },
];

export const INVESTMENT_DIMS = ['历史转化率', '复制可能性', '竞品锁定度', '关键人支持度'];
