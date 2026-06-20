// 012_import_historical_weekly.js
// 从 D:\知识库创建\06_客户追踪\周报 导入历史周报数据

const fs = require('fs');
const path = require('path');

module.exports = {
  up(db) {
    const weeklyDir = path.join('D:', '知识库创建', '06_客户追踪', '周报');

    // 检查是否已导入
    const existing = db.prepare('SELECT COUNT(*) as c FROM weekly_reports WHERE week_id = ?').get('2026-W16');
    if (existing.c > 0) {
      console.log('[Migration 012] Historical weekly data already imported, skipping');
      return;
    }

    // ─── W16 (04.13-04.19) ──────────────────────────────────
    try {
      const w16Content = fs.readFileSync(path.join(weeklyDir, '2026-W16_0413-0419.md'), 'utf-8');

      db.prepare('INSERT INTO weekly_reports (week_id, label, is_current) VALUES (?, ?, 0)').run('2026-W16', 'W16（4/13 - 4/19）');

      // 提取关键进展作为 focuses
      const focuses = extractSection(w16Content, '本周关键进展', ['- ']);
      focuses.forEach((f, i) => {
        db.prepare('INSERT INTO weekly_focuses (week_id, text, sort_order) VALUES (?, ?, ?)').run('2026-W16', f.replace(/^-\s*/, '').slice(0, 200), i);
      });

      // 提取行动承诺作为 actions
      const actions = extractW16Actions(w16Content);
      actions.forEach((a, i) => {
        db.prepare('INSERT INTO weekly_actions (week_id, text, completed, sort_order) VALUES (?, ?, 0, ?)').run('2026-W16', a.slice(0, 200), i);
      });

      // 每日记录从拜访概要中提取
      extractW16DailyNotes(db, w16Content);
      console.log('[Migration 012] W16 imported');
    } catch (e) {
      console.error('[Migration 012] W16 import failed:', e.message);
    }

    // ─── W24 (06.08-06.14) ──────────────────────────────────
    try {
      const w24Content = fs.readFileSync(path.join(weeklyDir, '2026-W24_销售周报.md'), 'utf-8');

      db.prepare('INSERT INTO weekly_reports (week_id, label, is_current) VALUES (?, ?, 0)').run('2026-W24', 'W24（6/8 - 6/14）');

      // 提取全局客户风险作为 focuses
      const w24Focuses = extractW24Focuses(w24Content);
      w24Focuses.forEach((f, i) => {
        db.prepare('INSERT INTO weekly_focuses (week_id, text, sort_order) VALUES (?, ?, ?)').run('2026-W24', f.slice(0, 200), i);
      });

      // 提取 P0/P1/P2 行动项作为 actions
      const w24Actions = extractW24Actions(w24Content);
      w24Actions.forEach((a, i) => {
        db.prepare('INSERT INTO weekly_actions (week_id, text, completed, sort_order) VALUES (?, ?, 0, ?)').run('2026-W24', a.slice(0, 200), i);
      });

      // 每日记录
      extractW24DailyNotes(db, w24Content);
      console.log('[Migration 012] W24 imported');
    } catch (e) {
      console.error('[Migration 012] W24 import failed:', e.message);
    }

    console.log('[Migration 012] Historical weekly data import complete');
  }
};

function extractSection(content, sectionTitle, markers) {
  const regex = new RegExp(`## ${sectionTitle}\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = content.match(regex);
  if (!match) return [];
  return match[1].split('\n').filter(l => markers.some(m => l.trim().startsWith(m))).map(l => l.trim());
}

function extractW16Actions(content) {
  // 从行动承诺中提取
  const section = content.match(/行动承诺[：:]\s*(.+)/g);
  if (!section) return [];
  const actions = [];
  const visitedSection = content.match(/## 本周拜访概要\n([\s\S]*?)(?=\n## )/);
  if (visitedSection) {
    const lines = visitedSection[1].split('\n');
    for (const line of lines) {
      const m = line.match(/\*\*行动承诺[：:]\*\*\s*(.+)/);
      if (m) actions.push(m[1].trim());
    }
  }
  return actions.slice(0, 20);
}

function extractW16DailyNotes(db, content) {
  // W16 没有明确的每日记录，从拜访概要提取客户名称作为标注
  const customers = content.match(/### 客户\d+[：:](.+)/g);
  if (!customers) return;
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri'];
  customers.slice(0, 5).forEach((c, i) => {
    const name = c.replace(/### 客户\d+[：:]/, '').trim();
    db.prepare('INSERT INTO weekly_daily_notes (week_id, day_key, content) VALUES (?, ?, ?)').run('2026-W16', dayKeys[i] || 'mon', `拜访: ${name}`);
  });
}

function extractW24Focuses(content) {
  const focuses = [];
  // 高风险客户作为重点
  const riskSection = content.match(/### 高风险客户\n([\s\S]*?)(?=\n### )/);
  if (riskSection) {
    const lines = riskSection[1].split('\n').filter(l => l.startsWith('- **'));
    lines.forEach(l => focuses.push(l.replace(/^-\s*\*\*(.+?)\*\*\s*[：:]\s*/, '$1: ').replace(/\*\*/g, '').trim()));
  }
  return focuses.slice(0, 10);
}

function extractW24Actions(content) {
  const actions = [];
  // 提取 [ ] 和 [x] 标记的行动项
  const checkboxLines = content.match(/-\s*\[[ x]\]\s*.+/g);
  if (checkboxLines) {
    checkboxLines.forEach(l => actions.push(l.replace(/-\s*\[[ x]\]\s*/, '').trim()));
  }
  return actions.slice(0, 30);
}

function extractW24DailyNotes(db, content) {
  const daySection = content.match(/## W24 每日记录\n([\s\S]*?)(?=\n## )/);
  if (!daySection) return;
  const lines = daySection[1].split('\n');
  let currentDay = null;
  for (const line of lines) {
    const dayMatch = line.match(/### (周一|周二|周三|周四|周五)/);
    if (dayMatch) {
      currentDay = dayMatch[1];
    }
    if (currentDay && line.startsWith('>') && line.length > 1) {
      const content = line.replace(/^>\s*/, '').trim();
      if (content && content !== '') {
        const dayMap = { '周一': 'mon', '周二': 'tue', '周三': 'wed', '周四': 'thu', '周五': 'fri' };
        db.prepare('INSERT INTO weekly_daily_notes (week_id, day_key, content) VALUES (?, ?, ?)').run('2026-W24', dayMap[currentDay] || 'mon', content.slice(0, 200));
      }
    }
  }
}
