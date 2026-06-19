// V26.06.05: pipeline_stages lost/won/timestamp columns
module.exports = {
  up(db) {
    const cols = db.prepare("PRAGMA table_info(pipeline_stages)").all().map(c => c.name);

    const additions = [
      ['lost', "ALTER TABLE pipeline_stages ADD COLUMN lost INTEGER DEFAULT 0"],
      ['lost_reason', "ALTER TABLE pipeline_stages ADD COLUMN lost_reason TEXT DEFAULT ''"],
      ['lost_at', "ALTER TABLE pipeline_stages ADD COLUMN lost_at TEXT DEFAULT ''"],
      ['won', "ALTER TABLE pipeline_stages ADD COLUMN won INTEGER DEFAULT 0"],
      ['won_at', "ALTER TABLE pipeline_stages ADD COLUMN won_at TEXT DEFAULT ''"],
      ['created_at', "ALTER TABLE pipeline_stages ADD COLUMN created_at TEXT DEFAULT ''"],
      ['updated_at', "ALTER TABLE pipeline_stages ADD COLUMN updated_at TEXT DEFAULT ''"],
      ['expected_close_date', "ALTER TABLE pipeline_stages ADD COLUMN expected_close_date TEXT DEFAULT ''"],
      ['status_description', "ALTER TABLE pipeline_stages ADD COLUMN status_description TEXT DEFAULT ''"],
    ];

    for (const [col, sql] of additions) {
      if (!cols.includes(col)) {
        db.exec(sql);
      }
    }

    // Backfill timestamps for existing rows
    db.exec("UPDATE pipeline_stages SET created_at = datetime('now') WHERE created_at = ''");
    db.exec("UPDATE pipeline_stages SET updated_at = datetime('now') WHERE updated_at = ''");
  }
};
