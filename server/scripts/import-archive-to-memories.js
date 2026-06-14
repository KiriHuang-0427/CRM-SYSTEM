#!/usr/bin/env node
// server/scripts/import-archive-to-memories.js
// Idempotent import script: reads historical Markdown/Excel from D:\知识库创建\06_客户追踪
// and writes them into the AI memory layer (ai_memories, ai_source_files, ai_import_jobs)
//
// Usage:
//   node server/scripts/import-archive-to-memories.js "D:\知识库创建\06_客户追踪"
//   ARCHIVE_ROOT="D:\知识库创建\06_客户追踪" node server/scripts/import-archive-to-memories.js
//   npm run import:archive

const fs = require('fs');
const path = require('path');
const db = require('../database');
const { parseMarkdown, parseExcel } = require('../services/archiveParser');
const customerMatcher = require('../services/customerMatcher');

// ─── Configuration ─────────────────────────────────────────────

const ARCHIVE_ROOT = process.argv[2] || process.env.ARCHIVE_ROOT || 'D:\\知识库创建\\06_客户追踪';
const SUPPORTED_EXT = ['.md', '.xlsx'];
const IGNORED_EXT = ['.html', '.png', '.jpg', '.pdf', '.tmp', '.lock', '.mermaid'];

// ─── Main ──────────────────────────────────────────────────────

function main() {
  console.log('='.repeat(60));
  console.log('CRM V26.07.00 — Historical Archive Import');
  console.log('='.repeat(60));
  console.log(`Archive root: ${ARCHIVE_ROOT}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('');

  // Validate archive root
  if (!fs.existsSync(ARCHIVE_ROOT)) {
    console.error(`ERROR: Archive root not found: ${ARCHIVE_ROOT}`);
    process.exit(1);
  }

  // Reset customer matcher cache
  customerMatcher.resetCache();
  customerMatcher.loadCustomerCache();

  // Create import job
  const jobId = createImportJob(ARCHIVE_ROOT);

  // Scan files
  const files = scanFiles(ARCHIVE_ROOT);
  console.log(`Scanned ${files.length} files (${SUPPORTED_EXT.join(', ')})`);
  console.log(`Ignored extensions: ${IGNORED_EXT.join(', ')}`);
  console.log('');

  // Update job total
  db.prepare('UPDATE ai_import_jobs SET total_files = ? WHERE id = ?').run(files.length, jobId);

  // Process files
  const stats = {
    imported: 0,
    skipped: 0,
    failed: 0,
    memoriesCreated: 0,
    linkedCustomers: new Set(),
    unlinkedMemories: 0,
    failedFiles: [],
    newCustomerCandidates: [],
  };

  for (const file of files) {
    try {
      const result = processFile(file, ARCHIVE_ROOT);
      if (result.status === 'imported') {
        stats.imported++;
        stats.memoriesCreated += result.memoriesInserted;
        result.customerIds.forEach(id => stats.linkedCustomers.add(id));
        stats.unlinkedMemories += result.unlinkedCount;
        if (result.newCustomerCandidate) {
          stats.newCustomerCandidates.push(result.newCustomerCandidate);
        }
      } else if (result.status === 'skipped') {
        stats.skipped++;
      }
    } catch (err) {
      stats.failed++;
      stats.failedFiles.push({ file: file.relativePath, error: err.message });
      console.error(`  FAIL: ${file.relativePath} — ${err.message}`);

      // Mark file as failed
      db.prepare(`
        UPDATE ai_source_files SET import_status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE file_path = ?
      `).run(err.message, file.relativePath);
    }
  }

  // Finalize import job
  const finishedAt = new Date().toISOString();
  db.prepare(`
    UPDATE ai_import_jobs SET
      status = 'completed',
      imported_files = ?,
      skipped_files = ?,
      failed_files = ?,
      created_memories = ?,
      linked_customers = ?,
      unlinked_memories = ?,
      finished_at = ?,
      metadata_json = ?
    WHERE id = ?
  `).run(
    stats.imported,
    stats.skipped,
    stats.failed,
    stats.memoriesCreated,
    stats.linkedCustomers.size,
    stats.unlinkedMemories,
    finishedAt,
    JSON.stringify({ failedFiles: stats.failedFiles, newCustomerCandidates: stats.newCustomerCandidates }),
    jobId
  );

  // Print report
  printReport(stats, files.length);
}

// ─── File Scanning ─────────────────────────────────────────────

function scanFiles(dir, root = null) {
  if (!root) root = dir;
  const results = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip hidden dirs and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      results.push(...scanFiles(fullPath, root));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!SUPPORTED_EXT.includes(ext)) continue;

      // Skip files starting with _ (meta files like _使用说明.txt, _客户总览.md is included)
      // Actually, _客户总览.md should be included as it has customer data

      const stat = fs.statSync(fullPath);
      results.push({
        fullPath,
        relativePath: path.relative(root, fullPath),
        fileName: entry.name,
        ext,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
      });
    }
  }

  return results;
}

// ─── File Processing ───────────────────────────────────────────

function processFile(file, sourceRoot) {
  const result = {
    status: 'imported',
    memoriesInserted: 0,
    customerIds: [],
    unlinkedCount: 0,
    newCustomerCandidate: null,
  };

  // Check if already imported (source_files record)
  const existing = db.prepare('SELECT import_status FROM ai_source_files WHERE file_path = ?').get(file.relativePath);
  if (existing && existing.import_status === 'imported') {
    // Check if any memories from this file already exist
    const memCount = db.prepare('SELECT COUNT(*) as cnt FROM ai_memories WHERE source_file = ? AND source_path = ?')
      .get(file.fileName, file.relativePath);
    if (memCount.cnt > 0) {
      console.log(`  SKIP: ${file.relativePath} (already imported, ${memCount.cnt} memories exist)`);
      result.status = 'skipped';
      return result;
    }
  }

  // Register source file
  db.prepare(`
    INSERT OR REPLACE INTO ai_source_files
      (source_root, file_path, file_name, file_ext, file_size, file_mtime, import_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(sourceRoot, file.relativePath, file.fileName, file.ext, file.size, file.mtime);

  // Parse file
  let memories = [];
  if (file.ext === '.md') {
    memories = parseMarkdown(file.fullPath, sourceRoot);
  } else if (file.ext === '.xlsx') {
    memories = parseExcel(file.fullPath, sourceRoot);
  }

  if (memories.length === 0) {
    console.log(`  EMPTY: ${file.relativePath} (no parseable content)`);
    db.prepare(`
      UPDATE ai_source_files SET import_status = 'skipped', updated_at = CURRENT_TIMESTAMP WHERE file_path = ?
    `).run(file.relativePath);
    result.status = 'skipped';
    return result;
  }

  // Insert memories (idempotent via checksum)
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO ai_memories
      (customer_id, memory_type, title, content, summary, importance, confidence,
       source_kind, source_file, source_path, source_anchor, source_table, source_id,
       occurred_at, tags, metadata_json, checksum)
    VALUES
      (@customer_id, @memory_type, @title, @content, @summary, @importance, @confidence,
       @source_kind, @source_file, @source_path, @source_anchor, @source_table, @source_id,
       @occurred_at, @tags, @metadata_json, @checksum)
  `);

  const insertAll = db.transaction(() => {
    for (const mem of memories) {
      const r = insertStmt.run(mem);
      if (r.changes > 0) {
        result.memoriesInserted++;
        if (mem.customer_id) {
          result.customerIds.push(mem.customer_id);
        } else {
          result.unlinkedCount++;
        }
      }
    }
  });

  insertAll();

  // Update source file status
  db.prepare(`
    UPDATE ai_source_files SET import_status = 'imported', imported_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE file_path = ?
  `).run(file.relativePath);

  console.log(`  OK: ${file.relativePath} — ${memories.length} sections, ${result.memoriesInserted} new memories`);

  return result;
}

// ─── Import Job Management ─────────────────────────────────────

function createImportJob(sourceRoot) {
  const result = db.prepare(`
    INSERT INTO ai_import_jobs (source_root, status, started_at)
    VALUES (?, 'running', CURRENT_TIMESTAMP)
  `).run(sourceRoot);
  return result.lastInsertRowid;
}

// ─── Report ────────────────────────────────────────────────────

function printReport(stats, totalFiles) {
  console.log('');
  console.log('='.repeat(60));
  console.log('Import Report — V26.07.00');
  console.log('='.repeat(60));
  console.log(`扫描目录：${ARCHIVE_ROOT}`);
  console.log(`扫描文件数：${totalFiles}`);
  console.log(`成功导入文件数：${stats.imported}`);
  console.log(`跳过文件数：${stats.skipped}`);
  console.log(`失败文件数：${stats.failed}`);
  console.log(`新增 memories 数：${stats.memoriesCreated}`);
  console.log(`关联客户 memories 数：${stats.linkedCustomers.size} 个客户`);
  console.log(`未关联 memories 数：${stats.unlinkedMemories}`);

  if (stats.newCustomerCandidates.length > 0) {
    console.log(`识别到的新客户候选：`);
    for (const c of stats.newCustomerCandidates) {
      console.log(`  - ${c}`);
    }
  }

  if (stats.failedFiles.length > 0) {
    console.log(`失败文件列表：`);
    for (const f of stats.failedFiles) {
      console.log(`  - ${f.file}: ${f.error}`);
    }
  }

  console.log('='.repeat(60));

  // Also print database summary
  const totalMem = db.prepare('SELECT COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0').get();
  const byType = db.prepare('SELECT memory_type, COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0 GROUP BY memory_type ORDER BY cnt DESC').all();
  const bySource = db.prepare('SELECT source_kind, COUNT(*) as cnt FROM ai_memories WHERE is_archived = 0 GROUP BY source_kind ORDER BY cnt DESC').all();

  console.log('');
  console.log('Database Summary:');
  console.log(`  Total memories: ${totalMem.cnt}`);
  console.log('  By type:');
  for (const t of byType) {
    console.log(`    ${t.memory_type}: ${t.cnt}`);
  }
  console.log('  By source:');
  for (const s of bySource) {
    console.log(`    ${s.source_kind}: ${s.cnt}`);
  }
  console.log('='.repeat(60));
}

// ─── Run ───────────────────────────────────────────────────────
main();
