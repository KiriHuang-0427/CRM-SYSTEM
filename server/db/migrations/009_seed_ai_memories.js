// V26.06.07: One-time seed AI memories from existing business tables
module.exports = {
  up(db) {
    const marker = db.prepare("SELECT COUNT(*) as cnt FROM ai_memories WHERE source_table = 'seed_marker' AND source_id = 'v26.06.06'").get();
    if (marker.cnt > 0) return;

    const crypto = require('crypto');
    const mkChecksum = (parts) => crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);

    const insertMemory = db.prepare(`
      INSERT OR IGNORE INTO ai_memories (customer_id, memory_type, title, content, importance, confidence,
        source_kind, source_table, source_id, tags, checksum)
      VALUES (@customer_id, @memory_type, @title, @content, @importance, @confidence,
        @source_kind, @source_table, @source_id, @tags, @checksum)
    `);

    let count = 0;

    const seedAll = db.transaction(() => {
      // customers → ai_memories
      const customers = db.prepare('SELECT * FROM customers').all();
      for (const c of customers) {
        if (c.ai_coach && c.ai_coach.trim()) {
          const checksum = mkChecksum(['seed', c.id, 'strategy', 'ai_coach', c.ai_coach]);
          const r = insertMemory.run({
            customer_id: c.id, memory_type: 'strategy',
            title: `${c.name}｜AI教练建议`, content: c.ai_coach, importance: 4, confidence: 0.9,
            source_kind: 'database', source_table: 'customers', source_id: c.id,
            tags: JSON.stringify(['seed', 'ai_coach']), checksum,
          });
          if (r.changes) count++;
        }
        if (c.risk && c.risk.trim()) {
          const checksum = mkChecksum(['seed', c.id, 'risk', 'risk', c.risk]);
          const r = insertMemory.run({
            customer_id: c.id, memory_type: 'risk',
            title: `${c.name}｜风险提醒`, content: c.risk, importance: 5, confidence: 0.9,
            source_kind: 'database', source_table: 'customers', source_id: c.id,
            tags: JSON.stringify(['seed', 'risk']), checksum,
          });
          if (r.changes) count++;
        }
        if (c.talk_strategy && c.talk_strategy.trim()) {
          const checksum = mkChecksum(['seed', c.id, 'strategy', 'talk_strategy', c.talk_strategy]);
          const r = insertMemory.run({
            customer_id: c.id, memory_type: 'strategy',
            title: `${c.name}｜话术策略`, content: c.talk_strategy, importance: 4, confidence: 0.9,
            source_kind: 'database', source_table: 'customers', source_id: c.id,
            tags: JSON.stringify(['seed', 'talk_strategy']), checksum,
          });
          if (r.changes) count++;
        }
        if (c.comp && c.comp.trim()) {
          const checksum = mkChecksum(['seed', c.id, 'competitor', 'comp', c.comp]);
          const r = insertMemory.run({
            customer_id: c.id, memory_type: 'competitor',
            title: `${c.name}｜竞品信息`, content: c.comp, importance: 4, confidence: 0.9,
            source_kind: 'database', source_table: 'customers', source_id: c.id,
            tags: JSON.stringify(['seed', 'competitor']), checksum,
          });
          if (r.changes) count++;
        }
        const profileParts = [];
        if (c.industry) profileParts.push(`行业: ${c.industry}`);
        if (c.revenue && c.revenue !== '0') profileParts.push(`营收: ${c.revenue}`);
        if (c.next_year) profileParts.push(`明年预期: ${c.next_year}`);
        if (profileParts.length > 0) {
          const profileContent = profileParts.join('\n');
          const checksum = mkChecksum(['seed', c.id, 'customer_profile', 'profile', profileContent]);
          const r = insertMemory.run({
            customer_id: c.id, memory_type: 'customer_profile',
            title: `${c.name}｜客户画像`, content: profileContent, importance: 3, confidence: 0.9,
            source_kind: 'database', source_table: 'customers', source_id: c.id,
            tags: JSON.stringify(['seed', 'profile']), checksum,
          });
          if (r.changes) count++;
        }
      }

      // contacts → relationship
      const contacts = db.prepare('SELECT ct.*, c.name as customer_name FROM contacts ct LEFT JOIN customers c ON c.id = ct.customer_id').all();
      for (const ct of contacts) {
        const parts = [ct.name, ct.role, ct.tag, String(ct.stars), ct.phone || '', ct.email || ''].filter(Boolean);
        const content = parts.join(' | ');
        const checksum = mkChecksum(['seed', String(ct.id), 'relationship', 'contact', content]);
        const r = insertMemory.run({
          customer_id: ct.customer_id, memory_type: 'relationship',
          title: `${ct.customer_name || ''}｜联系人: ${ct.name}`,
          content, importance: 3, confidence: 0.9,
          source_kind: 'database', source_table: 'contacts', source_id: String(ct.id),
          tags: JSON.stringify(['seed', 'contact']), checksum,
        });
        if (r.changes) count++;
      }

      // pipeline_stages → project
      const pipelines = db.prepare('SELECT ps.*, c.name as customer_name FROM pipeline_stages ps LEFT JOIN customers c ON c.id = ps.customer_id').all();
      for (const p of pipelines) {
        const statusParts = [p.stage, `阶段${p.pipe_stage}`, p.amount ? `金额:${p.amount}` : '', p.note || ''].filter(Boolean);
        if (p.lost) statusParts.push(`丢失:${p.lost_reason || ''}`);
        if (p.won) statusParts.push('已赢得');
        const content = `${p.name}\n${statusParts.join(' | ')}`;
        const checksum = mkChecksum(['seed', String(p.id), 'project', 'pipeline', content]);
        const r = insertMemory.run({
          customer_id: p.customer_id, memory_type: 'project',
          title: `${p.customer_name || ''}｜${p.name}`,
          content, importance: 3, confidence: 0.9,
          source_kind: 'database', source_table: 'pipeline_stages', source_id: String(p.id),
          tags: JSON.stringify(['seed', 'pipeline']), checksum,
        });
        if (r.changes) count++;
      }

      // todos → todo_context or decision
      const todos = db.prepare('SELECT * FROM todos').all();
      for (const t of todos) {
        const isCompleted = t.completed === 1;
        const memType = isCompleted ? 'decision' : 'todo_context';
        const importance = isCompleted ? 2 : 3;
        const content = `${t.text}${t.deadline ? `\n截止: ${t.deadline}` : ''}${isCompleted ? '\n状态: 已完成' : ''}`;
        const checksum = mkChecksum(['seed', String(t.id), memType, 'todo', content]);
        const r = insertMemory.run({
          customer_id: t.customer_id || null, memory_type: memType,
          title: t.text.slice(0, 50),
          content, importance, confidence: 0.9,
          source_kind: 'database', source_table: 'todos', source_id: String(t.id),
          tags: JSON.stringify(['seed', 'todo']), checksum,
        });
        if (r.changes) count++;
      }

      // notes → meeting
      const notes = db.prepare('SELECT n.*, c.name as customer_name FROM notes n LEFT JOIN customers c ON c.id = n.customer_id').all();
      for (const n of notes) {
        const checksum = mkChecksum(['seed', String(n.id), 'meeting', 'note', n.content]);
        const r = insertMemory.run({
          customer_id: n.customer_id, memory_type: 'meeting',
          title: `${n.customer_name || ''}｜速记 ${n.created_at || ''}`,
          content: n.content, importance: 3, confidence: 0.9,
          source_kind: 'database', source_table: 'notes', source_id: String(n.id),
          tags: JSON.stringify(['seed', 'note']), checksum,
        });
        if (r.changes) count++;
      }

      // weekly tables → weekly
      const reports = db.prepare('SELECT * FROM weekly_reports').all();
      for (const wr of reports) {
        const focuses = db.prepare('SELECT text FROM weekly_focuses WHERE week_id = ?').all(wr.week_id);
        const actions = db.prepare('SELECT text, completed FROM weekly_actions WHERE week_id = ?').all(wr.week_id);
        const dailyNotes = db.prepare('SELECT day_key, content FROM weekly_daily_notes WHERE week_id = ?').all(wr.week_id);
        const contentParts = [`周次: ${wr.week_id}`, `标签: ${wr.label}`];
        if (focuses.length) contentParts.push(`重点:\n${focuses.map(f => '- ' + f.text).join('\n')}`);
        if (actions.length) contentParts.push(`行动项:\n${actions.map(a => `- ${a.text}${a.completed ? ' ✓' : ''}`).join('\n')}`);
        if (dailyNotes.length) {
          for (const dn of dailyNotes) {
            if (dn.content && dn.content.trim()) contentParts.push(`${dn.day_key}: ${dn.content}`);
          }
        }
        const content = contentParts.join('\n\n');
        const checksum = mkChecksum(['seed', wr.week_id, 'weekly', 'report', content]);
        const r = insertMemory.run({
          customer_id: null, memory_type: 'weekly',
          title: `${wr.label}`,
          content, importance: 3, confidence: 0.9,
          source_kind: 'database', source_table: 'weekly_reports', source_id: wr.week_id,
          tags: JSON.stringify(['seed', 'weekly']), checksum,
        });
        if (r.changes) count++;
      }

      // Seed marker
      insertMemory.run({
        customer_id: null, memory_type: 'decision',
        title: 'V26.06.06 AI地基初始化标记',
        content: 'Business table seed completed for V26.06.06',
        importance: 1, confidence: 1.0,
        source_kind: 'database', source_table: 'seed_marker', source_id: 'v26.06.06',
        tags: JSON.stringify(['marker']), checksum: mkChecksum(['seed_marker', 'v26.06.06']),
      });
    });

    seedAll();
    console.log(`[DB] AI memory seed: ${count} memories created from business tables`);
  }
};
