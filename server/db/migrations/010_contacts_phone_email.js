// V26.06.07: contacts phone/email columns
module.exports = {
  up(db) {
    const cols = db.prepare("PRAGMA table_info(contacts)").all().map(c => c.name);
    if (!cols.includes('phone')) {
      db.exec("ALTER TABLE contacts ADD COLUMN phone TEXT DEFAULT ''");
    }
    if (!cols.includes('email')) {
      db.exec("ALTER TABLE contacts ADD COLUMN email TEXT DEFAULT ''");
    }
  }
};
