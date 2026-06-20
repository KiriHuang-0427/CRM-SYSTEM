// 011_memory_layer_upgrade.js
// 四层记忆体系升级：memory_domains 配置表 + AI系统预留表 + 路由记录表

module.exports = {
  up(db) {
    // ─── 1. memory_domains — 记忆域配置表 ─────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS memory_domains (
        domain_key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        layer TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // ─── 2. memory_types — 记忆类型注册表 ──────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS memory_types_registry (
        type_value TEXT PRIMARY KEY,
        domain_key TEXT NOT NULL REFERENCES memory_domains(domain_key),
        label TEXT NOT NULL,
        layer TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // ─── 3. ai_query_log — AI查询记录表（Phase 6 预留）────
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_query_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        customer_id TEXT,
        tags TEXT,
        matched_pools TEXT,
        result_count INTEGER,
        latency_ms INTEGER,
        source TEXT DEFAULT 'api',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // ─── 4. ai_coach_sessions — 销售教练会话记录（Phase 3 预留）
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_coach_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT,
        session_type TEXT NOT NULL,
        topic TEXT,
        content TEXT,
        summary TEXT,
        action_items TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // ─── 5. ai_strategy_plans — 战略规划记录（Phase 5 预留）─
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_strategy_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        plan_type TEXT NOT NULL,
        timeframe TEXT,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // ─── 6. ai_system_state — AI系统状态（Phase 7 预留）────
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_system_state (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // ─── 7. 种子数据：记忆域 ────────────────────────────────
    const seedDomains = db.prepare(
      'INSERT OR IGNORE INTO memory_domains (domain_key, label, layer, description) VALUES (?, ?, ?, ?)'
    );
    seedDomains.run('customer', '客户域', 'L2', '客户画像、关系、项目、风险、竞品、会议');
    seedDomains.run('sales', '销售域', 'L2', '销售策略、决策、数据、待办、周报');
    seedDomains.run('growth', '成长域', 'L3+L4', '洞察、战略规划、教练、学习、市场');
    seedDomains.run('ai', 'AI域', 'L2+L3', '原始归档、系统记忆');

    // ─── 8. 种子数据：记忆类型 ─────────────────────────────
    const seedTypes = db.prepare(
      'INSERT OR IGNORE INTO memory_types_registry (type_value, domain_key, label, layer, description) VALUES (?, ?, ?, ?, ?)'
    );
    // 客户域 (L2)
    seedTypes.run('customer_profile', 'customer', '客户画像', 'L2', '客户基本信息、规模、业务范围');
    seedTypes.run('relationship', 'customer', '客户关系', 'L2', '关键人关系、拜访记录');
    seedTypes.run('project', 'customer', '项目', 'L2', '商机项目、需求、技术方案');
    seedTypes.run('risk', 'customer', '风险', 'L2', '丢失风险、竞品威胁');
    seedTypes.run('competitor', 'customer', '竞品', 'L2', '竞品动态、价格策略');
    seedTypes.run('meeting', 'customer', '会议', 'L2', '客户会议纪要、电话沟通');

    // 销售域 (L2)
    seedTypes.run('strategy', 'sales', '销售策略', 'L2', '客户策略、谈判策略');
    seedTypes.run('decision', 'sales', '决策记录', 'L2', '关键决策、报价决策');
    seedTypes.run('sales_data', 'sales', '销售数据', 'L2', '出货数据、营收统计');
    seedTypes.run('todo_context', 'sales', '待办上下文', 'L2', '待办事项的背景信息');
    seedTypes.run('weekly', 'sales', '周报', 'L2', '周报重点、行动项、每日记录');

    // 成长域 (L3/L4)
    seedTypes.run('insight', 'growth', '洞察', 'L3', 'AI总结的认知推断');
    seedTypes.run('strategy_plan', 'growth', '战略规划', 'L4', '中长期销售战略');
    seedTypes.run('coach', 'growth', '销售教练', 'L3', '话术建议、拜访准备');
    seedTypes.run('learning', 'growth', '经验学习', 'L3', '失败教训、成功经验');
    seedTypes.run('market', 'growth', '市场情报', 'L3', '行业趋势、市场规模');

    // AI域 (L2/L3)
    seedTypes.run('archive_raw', 'ai', '原始归档', 'L2', '多客户融合原始记忆');
    seedTypes.run('system_memory', 'ai', '系统记忆', 'L3', 'AI自身状态、路由记录');

    // ─── 9. 索引 ───────────────────────────────────────────
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_memory_types_domain ON memory_types_registry(domain_key);
      CREATE INDEX IF NOT EXISTS idx_ai_query_log_created ON ai_query_log(created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_coach_customer ON ai_coach_sessions(customer_id);
      CREATE INDEX IF NOT EXISTS idx_ai_strategy_status ON ai_strategy_plans(status);
    `);

    console.log('[Migration 011] Memory layer upgrade: 6 new tables + 4 domains + 18 types seeded');
  }
};
