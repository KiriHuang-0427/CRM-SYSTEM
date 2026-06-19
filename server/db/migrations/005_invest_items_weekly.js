// V26.06.05: ensure invest_items + weekly tables exist (for DBs created before V26.06.03/04)
module.exports = {
  up(db) {
    // invest_items
    const investExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invest_items'").all();
    if (investExists.length === 0) {
      db.exec(`CREATE TABLE invest_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`);
    }

    // weekly tables
    const weeklyTables = {
      weekly_reports: `CREATE TABLE weekly_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_id TEXT UNIQUE NOT NULL,
        label TEXT NOT NULL,
        is_current INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      weekly_focuses: `CREATE TABLE weekly_focuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_id TEXT NOT NULL,
        text TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (week_id) REFERENCES weekly_reports(week_id) ON DELETE CASCADE
      )`,
      weekly_actions: `CREATE TABLE weekly_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_id TEXT NOT NULL,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (week_id) REFERENCES weekly_reports(week_id) ON DELETE CASCADE
      )`,
      weekly_daily_notes: `CREATE TABLE weekly_daily_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_id TEXT NOT NULL,
        day_key TEXT NOT NULL,
        content TEXT DEFAULT '',
        FOREIGN KEY (week_id) REFERENCES weekly_reports(week_id) ON DELETE CASCADE
      )`
    };

    for (const [tbl, ddl] of Object.entries(weeklyTables)) {
      const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tbl);
      if (!exists) {
        db.exec(ddl);
      }
    }

    // Seed invest items
    const investCount = db.prepare('SELECT COUNT(*) as cnt FROM invest_items').get();
    if (investCount.cnt === 0) {
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
  }
};
