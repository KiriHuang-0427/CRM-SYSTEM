// V26.06.07: ai_memories review fields (review_status, review_note, reviewed_at)
module.exports = {
  up(db) {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_memories'").all();
    if (tables.length === 0) return;

    const cols = db.prepare("PRAGMA table_info(ai_memories)").all().map(c => c.name);

    if (!cols.includes('review_status')) {
      db.exec("ALTER TABLE ai_memories ADD COLUMN review_status TEXT DEFAULT 'pending'");
    }
    if (!cols.includes('review_note')) {
      db.exec("ALTER TABLE ai_memories ADD COLUMN review_note TEXT");
    }
    if (!cols.includes('reviewed_at')) {
      db.exec("ALTER TABLE ai_memories ADD COLUMN reviewed_at TEXT");
    }

    // Backfill: records with customer_id get 'linked' status
    const result = db.prepare(
      "UPDATE ai_memories SET review_status = 'linked' WHERE customer_id IS NOT NULL AND (review_status IS NULL OR review_status = 'pending')"
    ).run();
    if (result.changes > 0) {
      console.log(`[DB] ai_memories: ${result.changes} records marked as 'linked'`);
    }
  }
};
