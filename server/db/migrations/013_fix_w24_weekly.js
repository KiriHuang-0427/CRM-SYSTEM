// 013_fix_w24_weekly.js
// 修正 W24 周报的 focuses 和 daily notes 解析

const fs = require('fs');
const path = require('path');

module.exports = {
  up(db) {
    const existing = db.prepare("SELECT COUNT(*) as c FROM schema_versions WHERE name LIKE '%013%'").get();
    if (existing.c > 0) {
      console.log('[Migration 013] W24 fix already applied, skipping');
      return;
    }

    try {
      const content = fs.readFileSync(path.join('D:', '知识库创建', '06_客户追踪', '周报', '2026-W24_销售周报.md'), 'utf-8');

      // 清除旧的 W24 focuses（如果无数据则跳过）
      db.prepare('DELETE FROM weekly_focuses WHERE week_id = ?').run('2026-W24');
      db.prepare('DELETE FROM weekly_daily_notes WHERE week_id = ?').run('2026-W24');

      // ─── 1. 从全局客户风险中提取 focuses ──────────────
      const riskSection = content.match(/## 全局客户风险[^\n]*\n([\s\S]*?)(?=\n## )/);
      if (riskSection) {
        const focuses = [];
        const lines = riskSection[1].split('\n');
        for (const line of lines) {
          // 匹配 - **客户名** ： 描述
          const m = line.match(/^-\s*\*\*(.+?)\*\*\s*[：:]\s*(.+)/);
          if (m) focuses.push(`【${m[1].trim()}】${m[2].trim()}`);
        }
        focuses.forEach((f, i) => {
          if (i >= 10) return;
          db.prepare('INSERT INTO weekly_focuses (week_id, text, sort_order) VALUES (?, ?, ?)').run('2026-W24', f.slice(0, 200), i);
        });
      }

      // ─── 2. 每日记录 ──────────────────────────────────
      const daySection = content.match(/## W24 每日记录\n([\s\S]*?)(?=\n## |$)/);
      if (daySection) {
        const lines = daySection[1].split('\n');
        let currentDay = null;
        const dayMap = { '周一': 'mon', '周二': 'tue', '周三': 'wed', '周四': 'thu', '周五': 'fri' };
        for (const line of lines) {
          const dayMatch = line.match(/### (周一|周二|周三|周四|周五)/);
          if (dayMatch) {
            currentDay = dayMatch[1];
            // 检查下一行是否有内容
            continue;
          }
          if (currentDay && line.startsWith('>')) {
            const text = line.replace(/^>\s*/, '').trim();
            if (text) {
              const dayKey = dayMap[currentDay] || 'mon';
              db.prepare('INSERT INTO weekly_daily_notes (week_id, day_key, content) VALUES (?, ?, ?)').run('2026-W24', dayKey, text.slice(0, 200));
            }
          }
        }
        // 如果没有每日记录内容，从标题中生成
        const existingNotes = db.prepare('SELECT COUNT(*) as c FROM weekly_daily_notes WHERE week_id = ?').get('2026-W24');
        if (existingNotes.c === 0) {
          const dayTitles = lines.filter(l => l.match(/### (周一|周二|周三|周四|周五)/));
          dayTitles.forEach(l => {
            const m = l.match(/### (周一|周二|周三|周四|周五)\s*[（(](.+?)[）)]/);
            if (m) {
              const dayKey = dayMap[m[1]] || 'mon';
              db.prepare('INSERT INTO weekly_daily_notes (week_id, day_key, content) VALUES (?, ?, ?)').run('2026-W24', dayKey, m[2].slice(0, 200));
            }
          });
        }
      }

      console.log('[Migration 013] W24 data fixed');
    } catch (e) {
      console.error('[Migration 013] W24 fix failed:', e.message);
    }
  }
};
