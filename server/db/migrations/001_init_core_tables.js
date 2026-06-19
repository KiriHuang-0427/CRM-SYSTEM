// V26.06.04: Core business tables
module.exports = {
  up(db) {
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
};
