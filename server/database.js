const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'crm.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema Creation ─────────────────────────────────────────

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT 'gray',
      industry TEXT DEFAULT '',
      revenue TEXT DEFAULT '0',
      next_year TEXT DEFAULT '',
      comp TEXT DEFAULT '',
      last_visit TEXT DEFAULT '',
      sales_py REAL DEFAULT 0,
      sales_py_ytd REAL DEFAULT 0,
      sales_cy_ytd REAL DEFAULT 0,
      sales_cy_p8 REAL DEFAULT 0,
      ai_coach TEXT DEFAULT '',
      risk TEXT DEFAULT '',
      talk_strategy TEXT DEFAULT '',
      is_group INTEGER DEFAULT 0,
      parent_project TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT '',
      tag TEXT DEFAULT '',
      stars INTEGER DEFAULT 3,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      stage TEXT DEFAULT '',
      amount TEXT DEFAULT '',
      pipe_stage INTEGER DEFAULT 1,
      note TEXT DEFAULT '',
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      customer_id TEXT DEFAULT '',
      deadline TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      completed_at TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS talk_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL,
      title TEXT NOT NULL,
      color TEXT DEFAULT '',
      bg TEXT DEFAULT '',
      text TEXT DEFAULT '',
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sub_customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id TEXT NOT NULL,
      name TEXT NOT NULL,
      tag TEXT DEFAULT '',
      FOREIGN KEY (parent_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invest_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weekly_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      is_current INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weekly_focuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id TEXT NOT NULL,
      text TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (week_id) REFERENCES weekly_reports(week_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weekly_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id TEXT NOT NULL,
      text TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (week_id) REFERENCES weekly_reports(week_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weekly_daily_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id TEXT NOT NULL,
      day_key TEXT NOT NULL,
      content TEXT DEFAULT '',
      FOREIGN KEY (week_id) REFERENCES weekly_reports(week_id) ON DELETE CASCADE
    );
  `);
}

// ─── Seed Data Migration ─────────────────────────────────────

function seedData() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM customers').get();
  if (count.cnt > 0) return; // Already seeded

  const customers = [
    {
      id: 'huazhang', name: '江苏华章物流科技股份有限公司', color: 'red',
      industry: '场内物流/仓储自动化', revenue: '4.38M', next_year: '6-8M',
      comp: '伟创、雷赛、信捷', last_visit: '2026-06-05',
      sales_py: 2209.7, sales_cy_ytd: 4384.1, sales_cy_p8: 4384.1,
      risk: 'SIMOTICS E零提货',
      talk_strategy: '900系列年需求1000套是核心机会，先提供样机建立信任；顶升移载替代雷赛方案已有初步意向，抓紧推进技术验证',
      contacts: [
        { name: '王超全', role: '电气部长/股东', tag: '核心决策', stars: 4 },
        { name: '张彪', role: '铁杆盟友', tag: '铁杆', stars: 5 },
        { name: '周佳源', role: '供应链主管', tag: '新对接', stars: 3 },
      ],
      pipeline: [
        { name: 'SIMOTICS E', stage: '推迟提货', amount: '~2M', pipe_stage: 6 },
        { name: '900系列穿梭车', stage: '样机窗口期', amount: '年1000套', pipe_stage: 3 },
        { name: '顶升移载', stage: '方案准备', pipe_stage: 2 },
      ],
    },
    {
      id: 'taikeman', name: '泰克曼（南京）安防技术股份有限公司', color: 'red',
      industry: '制造/数字化', revenue: '1.19M', next_year: '2.5-3M',
      last_visit: '2026-06-04',
      sales_py: 0, sales_cy_ytd: 1185.8, sales_cy_p8: 1185.8,
      talk_strategy: '图纸危机关键是给信心+给时间线；危机解决后是切入数字化方案的好时机',
      contacts: [
        { name: '吴老板', role: '老板', stars: 5 },
        { name: '阮经理', role: '项目经理', stars: 4 },
      ],
      pipeline: [
        { name: '2500PCS图纸危机', stage: '紧急', pipe_stage: 4 },
        { name: 'DCJ零件', stage: '已下单', pipe_stage: 6 },
      ],
      talk_points: [
        { title: '回复图纸问题', color: 'var(--status-warning)', bg: 'rgba(243, 156, 18, 0.08)', text: '阮经理，德国那边图纸复核已经在推进中，我们这边也在积极配合，预计本周内会有明确回复。' },
        { title: '给信心', color: 'var(--status-success)', bg: 'rgba(39, 174, 96, 0.08)', text: '2500套的产品我们已经全部交付了，后续的产品也会按照计划推进，质量方面您放心。' },
        { title: '如果催得急', color: 'var(--status-danger)', bg: 'rgba(231, 76, 60, 0.08)', text: '完全理解，这个确实是我们需要改进的地方，我会亲自跟进，确保不会再出现类似情况。' },
        { title: '危机后切入数字化', color: 'var(--status-info)', bg: 'rgba(41, 128, 185, 0.08)', text: '阮经理/吴老板，图纸这个事总算解决了，接下来我们可以聊聊数字化产线的规划，我们有DDT预测性维护方案。' },
      ],
    },
    {
      id: 'liuwei', name: '江苏六维智能物流装备股份有限公司', color: 'red',
      industry: '场内物流', revenue: '0.57M', next_year: '1-2M',
      comp: '丹佛斯', last_visit: '2026-06-05',
      sales_py_ytd: 705, sales_cy_ytd: 571.9, sales_cy_p8: 571.9,
      talk_strategy: '飞箱机器人是切入六维的关键项目，突破万峰华是绕开丹佛斯壁垒的关键路径',
      contacts: [{ name: '阎激光', role: '铁杆', tag: '铁杆', stars: 5 }],
      pipeline: [{ name: '飞箱机器人', stage: '报价待反馈', pipe_stage: 3 }],
    },
    {
      id: 'guanchao', name: '江苏冠超物流科技有限公司', color: 'red',
      industry: '物流科技', revenue: '0.16M',
      comp: '汇川', last_visit: '2026-04-21',
      sales_py_ytd: 502.5, sales_cy_ytd: 164.7, sales_cy_p8: 164.7,
      risk: '47天未拜访',
      talk_strategy: '汇川已入名录，需要在方案打包上做差异化，不能只拼价格',
      contacts: [{ name: '朱明成', role: '采购', stars: 4 }],
      pipeline: [{ name: 'V20替代', stage: '评估中', pipe_stage: 2 }],
    },
    {
      id: 'yinfei', name: '南京音飞储存设备（集团）股份有限公司', color: 'orange',
      industry: '仓储物流', revenue: '1.26M', next_year: '2-3M',
      last_visit: '2026-06-04',
      sales_py_ytd: 486.3, sales_cy_ytd: 1260.1, sales_cy_p8: 1260.1,
      talk_strategy: '年框6月底到期是最大紧迫点，谈判时把900系列写入框架；贵阳安达项目是音飞旗下，要一起谈',
      contacts: [{ name: '钟观香', role: '供应链', stars: 4 }],
      pipeline: [
        { name: '年框续签', stage: '紧急', pipe_stage: 5 },
        { name: '提升机', stage: '受阻', pipe_stage: 4 },
        { name: '贵阳安达输送线', stage: '样机推进', pipe_stage: 4, note: '音飞旗下项目' },
      ],
    },
    {
      id: 'huade', name: '南京华德仓储设备制造有限公司', color: 'orange',
      industry: '仓储物流', revenue: '0.72M', next_year: '1-2M',
      comp: 'SEW', last_visit: '2026-06-05',
      sales_py_ytd: 1374.9, sales_cy_ytd: 720.6, sales_cy_p8: 720.6,
      talk_strategy: '西门子55kW+第三方减速机总价<SEW 65W，这是核心卖点；周义术是导师型客户，要给足面子',
      contacts: [{ name: '周义术', role: '副总', stars: 4 }],
      pipeline: [{ name: '重载堆垛机', stage: 'W25确认', pipe_stage: 4 }],
    },
    {
      id: 'zhuoneng', name: '南京卓能机械设备有限公司', color: 'green',
      industry: '制造/包装', revenue: '3.39M', next_year: '3.5-4M',
      comp: '三菱', last_visit: '2026-05-20',
      sales_py_ytd: 1465.2, sales_cy_ytd: 3388.1, sales_cy_p8: 3388.1,
      talk_strategy: '王琳凯是铁杆盟友，关键是帮他在内部替你说话；S200问题要尽快解决避免影响信任',
      contacts: [{ name: '王琳凯', role: '铁杆', tag: '铁杆', stars: 5 }],
      pipeline: [{ name: '纸袋机', stage: '批量执行', amount: '~3M', pipe_stage: 6 }],
    },
    {
      id: 'tiandiren', name: '南京天地人自动化技术有限公司', color: 'green',
      industry: '穿梭车/四向车', revenue: '0.63M',
      last_visit: '2026-05-29',
      sales_py_ytd: 552.7, sales_cy_ytd: 632, sales_cy_p8: 632,
      talk_strategy: 'SIPLUS 1200特价延续性是核心关注点，要提前确认避免后续价格波动',
      contacts: [],
      pipeline: [{ name: 'SIPLUS 1200', stage: '执行中', pipe_stage: 6 }],
    },
    {
      id: 'rongzhida', name: '南京融智达电气科技有限公司', color: 'green',
      industry: '数据中心', revenue: '0.51M',
      sales_py_ytd: 62, sales_cy_ytd: 511.6, sales_cy_p8: 511.6,
      talk_strategy: '同比增长7倍是亮点，需要尽快安排拜访了解新需求',
      contacts: [],
      pipeline: [{ name: '动力方案', stage: '初步接触', pipe_stage: 1 }],
    },
    {
      id: 'xinghang', name: '南京兴航船舶电气有限公司', color: 'green',
      industry: '船舶电器', revenue: '0',
      comp: 'ABB', last_visit: '2026-06-05',
      sales_py: 0, sales_cy_ytd: 0, sales_cy_p8: 0,
      talk_strategy: '先提供EP样机和报价，建立信任后推批量',
      contacts: [],
      pipeline: [{ name: 'EP替代', stage: '需样机', pipe_stage: 1 }],
    },
    {
      id: 'chengrui', name: '江苏成瑞储能科技有限公司', color: 'green',
      industry: '储能', revenue: '0',
      comp: 'ABB', last_visit: '2026-06-05',
      sales_py: 0, sales_cy_ytd: 0, sales_cy_p8: 0,
      talk_strategy: 'FA已被竞对签走，EP替代ABB从小批量开始建立信任',
      contacts: [],
      pipeline: [{ name: 'EP替代', stage: '小项目先行', pipe_stage: 1 }],
    },
    {
      id: 'shengjiu', name: '南京盛玖新能源科技有限公司', color: 'green',
      industry: '新能源', revenue: '0',
      last_visit: '2026-06-02',
      sales_py: 0, sales_cy_ytd: 0, sales_cy_p8: 0,
      talk_strategy: '港机储能是核心方向，主推ESSM+DCDC整套方案',
      contacts: [],
      pipeline: [{ name: '港机储能', stage: '方案完成', pipe_stage: 1 }],
    },
    {
      id: 'yixing', name: '南京翌星自动化系统有限公司', color: 'green',
      industry: 'AGV/AMR', revenue: '0.14M',
      last_visit: '2026-05-23',
      sales_py_ytd: 1268.3, sales_cy_ytd: 139.6, sales_cy_p8: 139.6,
      talk_strategy: '多个机会点值得深耕，数字孪生和SIMOVE都可以切入',
      contacts: [{ name: '祖工', role: '电气', stars: 3 }],
      pipeline: [{ name: '数字孪生', stage: '需求了解', pipe_stage: 2 }],
    },
    {
      id: 'zhiku', name: '江苏智库智能科技有限公司', color: 'green',
      industry: '智能科技', revenue: '0.15M',
      sales_py_ytd: 132, sales_cy_ytd: 145.7, sales_cy_p8: 145.7,
      contacts: [],
      pipeline: [{ name: '中标项目', pipe_stage: 2 }],
    },
    {
      id: 'wuyao', name: '伍曜智能', color: 'gray',
      industry: '待确认', revenue: '0',
      contacts: [],
      pipeline: [{ name: '新客户', stage: '初步', pipe_stage: 1 }],
    },
    {
      id: 'other', name: '新客户/待开发', color: 'gray',
      industry: '混合', revenue: '0', is_group: 1,
      contacts: [],
      pipeline: [],
      sub_customers: [
        { name: '南京迈瑞', tag: '医疗' },
        { name: '溢泰环保', tag: '净水' },
        { name: '苏星智能', tag: '装备' },
        { name: '四向智能', tag: '仓储' },
        { name: '创彩出智', tag: '待确认' },
        { name: '顺丰压缩机', tag: '待确认' },
        { name: '微伽自动化', tag: '待确认' },
      ],
    },
  ];

  // Seed seed next actions as todos
  const nextActions = [
    { text: '约周佳源确认库存', customer_id: 'huazhang', deadline: 'W24' },
    { text: '回复图纸进展', customer_id: 'taikeman', deadline: 'W24周一' },
    { text: '联系阎激光', customer_id: 'liuwei', deadline: 'W24周二' },
    { text: '确认折扣', customer_id: 'guanchao', deadline: '已过期' },
    { text: '整理年框清单', customer_id: 'yinfei', deadline: 'W24周二' },
    { text: '核对价格', customer_id: 'huade', deadline: 'W24周一' },
    { text: 'S200问题', customer_id: 'zhuoneng', deadline: '已过期' },
    { text: '安排拜访', customer_id: 'rongzhida', deadline: '待安排' },
    { text: 'EP配置', customer_id: 'xinghang', deadline: 'W24' },
    { text: 'EP清单', customer_id: 'chengrui', deadline: 'W24' },
    { text: '成本明细', customer_id: 'shengjiu', deadline: 'W24' },
    { text: '7月拜访', customer_id: 'wuyao', deadline: '7月' },
  ];

  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, color, industry, revenue, next_year, comp, last_visit,
      sales_py, sales_py_ytd, sales_cy_ytd, sales_cy_p8, risk, talk_strategy, is_group)
    VALUES (@id, @name, @color, @industry, @revenue, @next_year, @comp, @last_visit,
      @sales_py, @sales_py_ytd, @sales_cy_ytd, @sales_cy_p8, @risk, @talk_strategy, @is_group)
  `);

  const insertContact = db.prepare(`
    INSERT INTO contacts (customer_id, name, role, tag, stars)
    VALUES (@customer_id, @name, @role, @tag, @stars)
  `);

  const insertPipeline = db.prepare(`
    INSERT INTO pipeline_stages (customer_id, name, stage, amount, pipe_stage, note)
    VALUES (@customer_id, @name, @stage, @amount, @pipe_stage, @note)
  `);

  const insertTalkPoint = db.prepare(`
    INSERT INTO talk_points (customer_id, title, color, bg, text)
    VALUES (@customer_id, @title, @color, @bg, @text)
  `);

  const insertSubCustomer = db.prepare(`
    INSERT INTO sub_customers (parent_id, name, tag)
    VALUES (@parent_id, @name, @tag)
  `);

  const insertTodo = db.prepare(`
    INSERT INTO todos (text, customer_id, deadline)
    VALUES (@text, @customer_id, @deadline)
  `);

  const seedAll = db.transaction(() => {
    for (const c of customers) {
      insertCustomer.run({
        id: c.id, name: c.name, color: c.color, industry: c.industry || '',
        revenue: c.revenue || '0', next_year: c.next_year || '', comp: c.comp || '',
        last_visit: c.last_visit || '',
        sales_py: c.sales_py || 0, sales_py_ytd: c.sales_py_ytd || 0,
        sales_cy_ytd: c.sales_cy_ytd || 0, sales_cy_p8: c.sales_cy_p8 || 0,
        risk: c.risk || '', talk_strategy: c.talk_strategy || '',
        is_group: c.is_group || 0,
      });

      for (const p of (c.contacts || [])) {
        insertContact.run({
          customer_id: c.id, name: p.name, role: p.role || '', tag: p.tag || '', stars: p.stars || 3,
        });
      }

      for (const p of (c.pipeline || [])) {
        insertPipeline.run({
          customer_id: c.id, name: p.name, stage: p.stage || '',
          amount: p.amount || '', pipe_stage: p.pipe_stage || 1, note: p.note || '',
        });
      }

      for (const tp of (c.talk_points || [])) {
        insertTalkPoint.run({
          customer_id: c.id, title: tp.title, color: tp.color || '', bg: tp.bg || '', text: tp.text || '',
        });
      }

      for (const sc of (c.sub_customers || [])) {
        insertSubCustomer.run({ parent_id: c.id, name: sc.name, tag: sc.tag || '' });
      }
    }

    // Seed next actions as initial todos
    for (const na of nextActions) {
      insertTodo.run({ text: na.text, customer_id: na.customer_id, deadline: na.deadline });
    }
  });

  seedAll();
  console.log('[DB] Seed data inserted: ' + customers.length + ' customers');
}

// ─── Safe Schema Migration ────────────────────────────────────
// Add new columns to existing tables without data loss

function migrateSchema() {
  // pipeline_stages: add lost management columns
  const pipeCols = db.prepare("PRAGMA table_info(pipeline_stages)").all().map(c => c.name);
  if (!pipeCols.includes('lost')) {
    db.exec("ALTER TABLE pipeline_stages ADD COLUMN lost INTEGER DEFAULT 0");
  }
  if (!pipeCols.includes('lost_reason')) {
    db.exec("ALTER TABLE pipeline_stages ADD COLUMN lost_reason TEXT DEFAULT ''");
  }
  if (!pipeCols.includes('lost_at')) {
    db.exec("ALTER TABLE pipeline_stages ADD COLUMN lost_at TEXT DEFAULT ''");
  }
  if (!pipeCols.includes('won')) {
    db.exec("ALTER TABLE pipeline_stages ADD COLUMN won INTEGER DEFAULT 0");
  }
  if (!pipeCols.includes('won_at')) {
    db.exec("ALTER TABLE pipeline_stages ADD COLUMN won_at TEXT DEFAULT ''");
  }
  if (!pipeCols.includes('created_at')) {
    db.exec("ALTER TABLE pipeline_stages ADD COLUMN created_at TEXT DEFAULT ''");
    db.exec("UPDATE pipeline_stages SET created_at = datetime('now') WHERE created_at = ''");
  }
  if (!pipeCols.includes('updated_at')) {
    db.exec("ALTER TABLE pipeline_stages ADD COLUMN updated_at TEXT DEFAULT ''");
    db.exec("UPDATE pipeline_stages SET updated_at = datetime('now') WHERE updated_at = ''");
  }
  if (!pipeCols.includes('expected_close_date')) {
    db.exec("ALTER TABLE pipeline_stages ADD COLUMN expected_close_date TEXT DEFAULT ''");
  }
  if (!pipeCols.includes('status_description')) {
    db.exec("ALTER TABLE pipeline_stages ADD COLUMN status_description TEXT DEFAULT ''");
  }

  // todos: add sort_order for manual reordering
  const todoCols = db.prepare("PRAGMA table_info(todos)").all().map(c => c.name);
  if (!todoCols.includes('sort_order')) {
    db.exec("ALTER TABLE todos ADD COLUMN sort_order INTEGER DEFAULT 0");
  }

  // invest_items: ensure table exists (for DBs created before V26.06.03)
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invest_items'").all();
  if (tables.length === 0) {
    db.exec(`CREATE TABLE invest_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
  }

  // weekly tables: ensure exist (for DBs created before V26.06.04)
  const weeklyTables = ['weekly_reports', 'weekly_focuses', 'weekly_actions', 'weekly_daily_notes'];
  for (const tbl of weeklyTables) {
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tbl);
    if (!exists) {
      if (tbl === 'weekly_reports') {
        db.exec(`CREATE TABLE weekly_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          week_id TEXT UNIQUE NOT NULL,
          label TEXT NOT NULL,
          is_current INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        )`);
      } else if (tbl === 'weekly_focuses') {
        db.exec(`CREATE TABLE weekly_focuses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          week_id TEXT NOT NULL,
          text TEXT NOT NULL,
          sort_order INTEGER DEFAULT 0,
          FOREIGN KEY (week_id) REFERENCES weekly_reports(week_id) ON DELETE CASCADE
        )`);
      } else if (tbl === 'weekly_actions') {
        db.exec(`CREATE TABLE weekly_actions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          week_id TEXT NOT NULL,
          text TEXT NOT NULL,
          completed INTEGER DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          FOREIGN KEY (week_id) REFERENCES weekly_reports(week_id) ON DELETE CASCADE
        )`);
      } else if (tbl === 'weekly_daily_notes') {
        db.exec(`CREATE TABLE weekly_daily_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          week_id TEXT NOT NULL,
          day_key TEXT NOT NULL,
          content TEXT DEFAULT '',
          FOREIGN KEY (week_id) REFERENCES weekly_reports(week_id) ON DELETE CASCADE
        )`);
      }
    }
  }

  // invest_items: add customer_id for customer association
  const investCols = db.prepare("PRAGMA table_info(invest_items)").all().map(c => c.name);
  if (!investCols.includes('customer_id')) {
    db.exec("ALTER TABLE invest_items ADD COLUMN customer_id TEXT DEFAULT ''");
  }

  // contacts: add phone/email columns
  const contactCols = db.prepare("PRAGMA table_info(contacts)").all().map(c => c.name);
  if (!contactCols.includes('phone')) {
    db.exec("ALTER TABLE contacts ADD COLUMN phone TEXT DEFAULT ''");
  }
  if (!contactCols.includes('email')) {
    db.exec("ALTER TABLE contacts ADD COLUMN email TEXT DEFAULT ''");
  }
}

// ─── Seed Invest Items ────────────────────────────────────────
// Default investment scoring items (persisted to DB)

function seedInvestItems() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM invest_items').get();
  if (count.cnt > 0) return; // Already seeded

  const defaults = [
    { key: 'score_900', name: '900系列穿梭车（华章）' },
    { key: 'score_feixiang', name: '飞箱机器人（六维）' },
    { key: 'score_duoduo', name: '重载堆垛机（华德）' },
  ];

  const insert = db.prepare('INSERT OR IGNORE INTO invest_items (key, name) VALUES (?, ?)');
  for (const item of defaults) {
    insert.run(item.key, item.name);
  }
}

// ─── Seed Weekly Data ──────────────────────────────────────────
// Migrate old WEEKLY_DATA (W24/W23/W22) into weekly database tables

function seedWeeklyData() {
  // Use W23 existence as migration marker — W24 may already exist via ensureCurrentWeek
  const w23Exists = db.prepare("SELECT id FROM weekly_reports WHERE week_id = '2026-W23'").get();
  if (w23Exists) {
    console.log('[DB] Weekly seed data already migrated, skipping');
    return;
  }

  const insertReport = db.prepare(
    'INSERT OR IGNORE INTO weekly_reports (week_id, label, is_current) VALUES (?, ?, ?)'
  );
  const insertFocus = db.prepare(
    'INSERT INTO weekly_focuses (week_id, text, sort_order) VALUES (?, ?, ?)'
  );
  const insertAction = db.prepare(
    'INSERT INTO weekly_actions (week_id, text, completed, sort_order) VALUES (?, ?, ?, ?)'
  );

  const seed = db.transaction(() => {
    // W22 — empty historical week
    insertReport.run('2026-W22', 'W22（5/25 - 5/29）', 0);

    // W23 — last week (completed items not mapped to new schema)
    insertReport.run('2026-W23', 'W23（6/1 - 6/5）', 0);

    // W24 — current week report (may already exist via ensureCurrentWeek)
    insertReport.run('2026-W24', 'W24（6/8 - 6/12）', 1);

    // Always check W24 focuses/actions independently (W24 may exist but be empty)
    const w24FocusCount = db.prepare('SELECT COUNT(*) as cnt FROM weekly_focuses WHERE week_id = ?').get('2026-W24');
    if (w24FocusCount.cnt === 0) {
      const focuses = [
        '音飞年框续签 — 6月底到期，必须本周推进清单确认',
        '泰克曼图纸危机 — 给信心+时间线，避免客户流失',
        '华章900系列样机 — 窗口期，抓紧技术验证',
      ];
      focuses.forEach((text, i) => insertFocus.run('2026-W24', text, i));
    }

    const w24ActionCount = db.prepare('SELECT COUNT(*) as cnt FROM weekly_actions WHERE week_id = ?').get('2026-W24');
    if (w24ActionCount.cnt === 0) {
      const actions = [
        '周一：音飞年框清单整理',
        '周一：泰克曼图纸进展回复',
        '周二：华德价格核对',
        '周二：六维-联系阎激光',
        '周三：华章-约周佳源确认库存',
        '周四：兴航/成瑞 EP配置清单',
        '周五：盛玖成本明细输出',
      ];
      actions.forEach((text, i) => insertAction.run('2026-W24', text, 0, i));
    }
  });

  seed();
  console.log('[DB] Weekly seed data inserted: W22, W23, W24 (focuses + actions)');
}

// ─── Initialize ──────────────────────────────────────────────

initSchema();
migrateSchema();
seedData();
seedInvestItems();
seedWeeklyData();

module.exports = db;
