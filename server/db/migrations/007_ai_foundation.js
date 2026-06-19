// V26.06.06: AI Foundation tables (ai_memories, ai_source_files, ai_import_jobs, ai_memory_links)
module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT,
        memory_type TEXT NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        summary TEXT,
        importance INTEGER DEFAULT 3,
        confidence REAL DEFAULT 0.8,
        source_kind TEXT,
        source_file TEXT,
        source_path TEXT,
        source_anchor TEXT,
        source_table TEXT,
        source_id TEXT,
        occurred_at TEXT,
        tags TEXT,
        metadata_json TEXT,
        checksum TEXT UNIQUE,
        is_archived INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_source_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_root TEXT NOT NULL,
        file_path TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        file_ext TEXT,
        file_size INTEGER,
        file_mtime TEXT,
        checksum TEXT,
        import_status TEXT DEFAULT 'pending',
        imported_at TEXT,
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_import_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_root TEXT NOT NULL,
        status TEXT DEFAULT 'running',
        total_files INTEGER DEFAULT 0,
        imported_files INTEGER DEFAULT 0,
        skipped_files INTEGER DEFAULT 0,
        failed_files INTEGER DEFAULT 0,
        created_memories INTEGER DEFAULT 0,
        linked_customers INTEGER DEFAULT 0,
        unlinked_memories INTEGER DEFAULT 0,
        started_at TEXT DEFAULT CURRENT_TIMESTAMP,
        finished_at TEXT,
        error_message TEXT,
        metadata_json TEXT
      );

      CREATE TABLE IF NOT EXISTS ai_memory_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory_id INTEGER NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        relation_type TEXT DEFAULT 'related',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(memory_id, entity_type, entity_id, relation_type)
      );
    `);

    // Indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ai_memories_customer ON ai_memories(customer_id);
      CREATE INDEX IF NOT EXISTS idx_ai_memories_type ON ai_memories(memory_type);
      CREATE INDEX IF NOT EXISTS idx_ai_memories_source ON ai_memories(source_kind, source_file);
      CREATE INDEX IF NOT EXISTS idx_ai_memories_occurred ON ai_memories(occurred_at);
      CREATE INDEX IF NOT EXISTS idx_ai_memory_links_entity ON ai_memory_links(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_ai_source_files_status ON ai_source_files(import_status);
    `);

    console.log('[DB] AI Foundation tables ready');
  }
};
