// V26.06.06: invest_items.customer_id for customer association
module.exports = {
  up(db) {
    const cols = db.prepare("PRAGMA table_info(invest_items)").all().map(c => c.name);
    if (!cols.includes('customer_id')) {
      db.exec("ALTER TABLE invest_items ADD COLUMN customer_id TEXT DEFAULT ''");
    }
  }
};
