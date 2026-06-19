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

// ─── Schema & Data Migration ─────────────────────────────────
// 所有建表、加列、种子数据已迁移到 db/migrations/ 目录下的版本化迁移脚本
// 引入迁移执行器

const { runMigrations } = require('./db/migrate');
runMigrations(db);

module.exports = db;
