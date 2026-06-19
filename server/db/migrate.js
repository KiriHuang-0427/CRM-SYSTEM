const fs = require('fs');
const path = require('path');

/**
 * 确保 schema_versions 表存在
 */
function ensureVersionTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_versions (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

/**
 * 获取当前数据库版本号
 */
function getCurrentVersion(db) {
  const row = db.prepare('SELECT MAX(version) as v FROM schema_versions').get();
  return row?.v || 0;
}

/**
 * 执行所有待迁移的版本化迁移脚本
 * @param {import('better-sqlite3').Database} db
 */
function runMigrations(db) {
  ensureVersionTable(db);
  const currentVersion = getCurrentVersion(db);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.js'))
    .sort();

  let applied = 0;
  for (const file of files) {
    const version = parseInt(file.split('_')[0], 10);
    if (isNaN(version)) continue;
    if (version <= currentVersion) continue;

    const migration = require(path.join(migrationsDir, file));
    const run = db.transaction(() => {
      migration.up(db);
      db.prepare('INSERT INTO schema_versions (version, name) VALUES (?, ?)').run(version, file);
    });
    run();
    console.log(`[DB] Migration ${version} applied: ${file}`);
    applied++;
  }

  if (applied === 0) {
    console.log(`[DB] Schema up-to-date (version ${currentVersion})`);
  } else {
    console.log(`[DB] ${applied} migration(s) applied. Current version: ${getCurrentVersion(db)}`);
  }
}

module.exports = { runMigrations, getCurrentVersion };
