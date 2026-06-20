// 014_fix_weekly_all.js
// 修复服务器乱码 + 补齐全部历史周报数据
// 数据源: db/weekly_seed.json（部署时随 server/ 同步上传）

const fs = require('fs');
const path = require('path');

module.exports = {
  up(db) {
    const existing = db.prepare("SELECT COUNT(*) as c FROM schema_versions WHERE name LIKE '%014%'").get();
    if (existing.c > 0) {
      console.log('[Migration 014] Weekly fix already applied, skipping');
      return;
    }

    const seedPath = path.join(__dirname, '..', 'weekly_seed.json');
    if (!fs.existsSync(seedPath)) {
      console.log('[Migration 014] Seed file not found at', seedPath, '- skipping');
      return;
    }

    const raw = fs.readFileSync(seedPath, 'utf-8');
    const data = JSON.parse(raw);

    // 清除所有现有周报数据
    db.exec('DELETE FROM weekly_daily_notes');
    db.exec('DELETE FROM weekly_actions');
    db.exec('DELETE FROM weekly_focuses');
    db.exec('DELETE FROM weekly_reports');

    for (const [weekId, week] of Object.entries(data)) {
      // 插入周报
      db.prepare('INSERT INTO weekly_reports (week_id, label, is_current) VALUES (?, ?, ?)')
        .run(weekId, week.l, weekId === '2026-W25' ? 1 : 0);

      // 插入重点
      if (week.f && week.f.length > 0) {
        const insF = db.prepare('INSERT INTO weekly_focuses (week_id, text, sort_order) VALUES (?, ?, ?)');
        week.f.forEach((t, i) => insF.run(weekId, String(t).slice(0, 200), i));
      }

      // 插入行动项
      if (week.a && week.a.length > 0) {
        const insA = db.prepare('INSERT INTO weekly_actions (week_id, text, completed, sort_order) VALUES (?, ?, 0, ?)');
        week.a.forEach((t, i) => insA.run(weekId, String(t).slice(0, 200), i));
      }

      // 插入每日记录
      if (week.d && week.d.length > 0) {
        const insD = db.prepare('INSERT INTO weekly_daily_notes (week_id, day_key, content) VALUES (?, ?, ?)');
        week.d.forEach(([dk, ct]) => insD.run(weekId, dk, String(ct).slice(0, 200)));
      }
    }

    const total = db.prepare('SELECT COUNT(*) as c FROM weekly_reports').get();
    console.log('[Migration 014] Weekly data fixed:', total.c, 'reports restored');
  }
};
