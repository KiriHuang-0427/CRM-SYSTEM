// V26.06.05: todos.sort_order for manual reordering
module.exports = {
  up(db) {
    const cols = db.prepare("PRAGMA table_info(todos)").all().map(c => c.name);
    if (!cols.includes('sort_order')) {
      db.exec("ALTER TABLE todos ADD COLUMN sort_order INTEGER DEFAULT 0");
    }
  }
};
