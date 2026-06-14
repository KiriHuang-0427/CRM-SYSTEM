// server/services/archiveParser.js
// Parse Markdown customer archives and Excel weekly reports into memory entries

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const matcher = require('./customerMatcher');

// ─── Memory type mapping for Markdown headings ──────────────────

const HEADING_TYPE_MAP = [
  { keywords: ['基本信息', '基本画像', '客户画像', '客户背景', '7531'], type: 'customer_profile' },
  { keywords: ['联系人', '关键人', '关系', '关键人画像'], type: 'relationship' },
  { keywords: ['项目', '商机', 'Pipeline', '机会', '项目机会'], type: 'project' },
  { keywords: ['风险', '问题', '卡点', '流失', '风险提醒'], type: 'risk' },
  { keywords: ['竞品', '对手', '汇川', 'SEW', 'ABB', '三菱', '竞品动态', '竞品渗透'], type: 'competitor' },
  { keywords: ['策略', '话术', '打法', '推进', '战略', '战略机会'], type: 'strategy' },
  { keywords: ['决策', '结论', '判断'], type: 'decision' },
  { keywords: ['拜访', '沟通', '会议', '记录', '拜访记录'], type: 'meeting' },
  { keywords: ['周报', '本周', '下周', '本周拜访复盘', '本周关键进展'], type: 'weekly' },
  { keywords: ['待办', '下一步', '行动', '下周计划', '重点任务'], type: 'todo_context' },
  { keywords: ['客户总览', '客户状态速览', '按风险等级', '活跃Pipeline'], type: 'customer_profile' },
  { keywords: ['方法论', '学习', '读书'], type: 'decision' },
  { keywords: ['备注', 'AI伙伴', '复盘'], type: 'archive_raw' },
];

/**
 * Classify a heading into a memory_type
 */
function classifyHeading(heading) {
  const cleanHeading = heading.replace(/^#+\s*/, '').trim();
  for (const mapping of HEADING_TYPE_MAP) {
    for (const kw of mapping.keywords) {
      if (cleanHeading.includes(kw)) {
        return mapping.type;
      }
    }
  }
  return 'archive_raw';
}

/**
 * Generate checksum for deduplication
 */
function mkChecksum(sourcePath, sourceAnchor, content) {
  const normalized = content.replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256')
    .update(`${sourcePath}|${sourceAnchor}|${normalized}`)
    .digest('hex').slice(0, 32);
}

// ─── Markdown Parser ─────────────────────────────────────────

/**
 * Parse a Markdown file into memory entries
 * @param {string} filePath - absolute path to the .md file
 * @param {string} sourceRoot - the archive root directory
 * @returns {Array<object>} array of memory entry objects
 */
function parseMarkdown(filePath, sourceRoot) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const relativePath = path.relative(sourceRoot, filePath);

  // Try to identify customer from filename
  const fileCustomer = matcher.matchFromFileName(fileName);

  // Split into sections by ## headings
  const sections = splitIntoSections(content);

  const memories = [];
  let currentH1 = '';

  for (const section of sections) {
    if (section.level === 1) {
      currentH1 = section.heading;
      continue;
    }

    const trimmedContent = section.content.trim();
    if (!trimmedContent || trimmedContent.length < 10) continue;

    const memType = classifyHeading(section.heading);
    const customerMatch = fileCustomer || matcher.matchFromTitle(currentH1);

    // Build title
    const customerName = customerMatch ? customerMatch.name : (currentH1 || fileName);
    const sectionTitle = section.heading.replace(/^#+\s*/, '').trim();
    const title = `${customerName}｜${sectionTitle}`;

    // Determine occurred_at from heading dates
    const dateMatch = section.heading.match(/(\d{4}-\d{2}-\d{2})/) || section.heading.match(/W(\d+)/);
    const occurredAt = dateMatch ? (dateMatch[1].length === 10 ? dateMatch[1] : null) : null;

    const checksum = mkChecksum(relativePath, section.heading, trimmedContent);

    memories.push({
      customer_id: customerMatch ? customerMatch.id : null,
      memory_type: memType,
      title: title.slice(0, 200),
      content: trimmedContent,
      summary: null,
      importance: getDefaultImportance(memType),
      confidence: customerMatch ? customerMatch.confidence : 0.5,
      source_kind: 'markdown',
      source_file: fileName,
      source_path: relativePath,
      source_anchor: section.heading.replace(/^#+\s*/, '').trim(),
      source_table: null,
      source_id: null,
      occurred_at: occurredAt,
      tags: JSON.stringify([memType, 'archive', fileName.replace(/\.md$/, '')]),
      metadata_json: null,
      checksum,
    });
  }

  // If no sections were found, treat the entire file as one memory
  if (memories.length === 0 && content.trim().length > 20) {
    const customerMatch = fileCustomer || matcher.matchFromTitle(currentH1);
    const customerName = customerMatch ? customerMatch.name : fileName;
    const checksum = mkChecksum(relativePath, 'full', content);

    memories.push({
      customer_id: customerMatch ? customerMatch.id : null,
      memory_type: 'archive_raw',
      title: `${customerName}｜原文`,
      content: content.trim(),
      summary: null,
      importance: 2,
      confidence: customerMatch ? customerMatch.confidence : 0.5,
      source_kind: 'markdown',
      source_file: fileName,
      source_path: relativePath,
      source_anchor: 'full',
      source_table: null,
      source_id: null,
      occurred_at: null,
      tags: JSON.stringify(['archive_raw', 'archive']),
      metadata_json: null,
      checksum,
    });
  }

  return memories;
}

/**
 * Split markdown content into sections by headings
 */
function splitIntoSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        level: headingMatch[1].length,
        heading: line,
        content: '',
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    } else {
      // Content before any heading — create a synthetic section
      if (line.trim()) {
        currentSection = {
          level: 0,
          heading: '## 前言',
          content: line + '\n',
        };
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// ─── Excel Parser ────────────────────────────────────────────

/**
 * Parse an Excel file into memory entries
 * @param {string} filePath - absolute path to the .xlsx file
 * @param {string} sourceRoot - the archive root directory
 * @returns {Array<object>} array of memory entry objects
 */
function parseExcel(filePath, sourceRoot) {
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(filePath);
  const fileName = path.basename(filePath);
  const relativePath = path.relative(sourceRoot, filePath);

  const memories = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rows.length === 0) continue;

    // Try to identify if this is a weekly report or customer data
    const headerRow = rows[0].map(String);
    const isWeekly = detectWeeklyColumns(headerRow);

    if (isWeekly) {
      // Parse as weekly data
      const weekId = extractWeekId(fileName, sheetName);
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(cell => !cell || String(cell).trim() === '')) continue;

        const rowData = mapWeeklyRow(row, isWeekly);
        if (!rowData.content) continue;

        const customerMatch = rowData.customerName ? matcher.matchCustomer(rowData.customerName) : null;
        const memType = classifyExcelRow(rowData);
        const checksum = mkChecksum(relativePath, `sheet:${sheetName}:row:${i}`, rowData.content);

        memories.push({
          customer_id: customerMatch ? customerMatch.id : null,
          memory_type: memType,
          title: `${weekId || sheetName}｜行${i + 1}${rowData.customerName ? ' ' + rowData.customerName : ''}`,
          content: rowData.content,
          summary: null,
          importance: getDefaultImportance(memType),
          confidence: customerMatch ? customerMatch.confidence : 0.6,
          source_kind: 'xlsx',
          source_file: fileName,
          source_path: relativePath,
          source_anchor: `sheet:${sheetName}:row:${i + 1}`,
          source_table: null,
          source_id: null,
          occurred_at: rowData.date || null,
          tags: JSON.stringify([memType, 'archive', 'weekly', weekId || ''].filter(Boolean)),
          metadata_json: JSON.stringify(rowData.meta || {}),
          checksum,
        });
      }
    } else {
      // Parse as generic data — whole sheet as one memory
      const sheetContent = rows.map(row => row.map(String).join('\t')).join('\n');
      if (sheetContent.trim().length < 20) continue;

      const checksum = mkChecksum(relativePath, `sheet:${sheetName}`, sheetContent);

      memories.push({
        customer_id: null,
        memory_type: 'archive_raw',
        title: `${fileName}｜${sheetName}`,
        content: sheetContent.trim(),
        summary: null,
        importance: 2,
        confidence: 0.5,
        source_kind: 'xlsx',
        source_file: fileName,
        source_path: relativePath,
        source_anchor: `sheet:${sheetName}`,
        source_table: null,
        source_id: null,
        occurred_at: null,
        tags: JSON.stringify(['archive_raw', 'archive', 'xlsx']),
        metadata_json: JSON.stringify({ sheetName, rowCount: rows.length }),
        checksum,
      });
    }
  }

  return memories;
}

/**
 * Detect weekly report columns
 */
function detectWeeklyColumns(headerRow) {
  const lowerHeaders = headerRow.map(h => String(h).toLowerCase().trim());
  const weeklyKeywords = ['客户', '周次', 'week', '本周', '重点', '行动', '待办', '完成', '风险', '项目', '日期'];
  const matched = weeklyKeywords.filter(kw => lowerHeaders.some(h => h.includes(kw)));
  return matched.length >= 2 ? buildColumnMap(lowerHeaders) : null;
}

function buildColumnMap(headers) {
  const map = {};
  const patterns = {
    customer: ['客户', '公司', 'customer'],
    week: ['周次', 'week'],
    date: ['日期', '时间', 'date'],
    focus: ['重点', 'focus', '本周重点'],
    action: ['行动', '待办', '下一步', 'action'],
    completed: ['完成', '已完成', 'completed'],
    project: ['项目', '商机', 'project'],
    risk: ['风险', '问题', 'risk'],
    content: ['备注', '记录', '内容', 'content'],
  };

  for (const [key, kws] of Object.entries(patterns)) {
    const idx = headers.findIndex(h => kws.some(kw => h.includes(kw)));
    if (idx >= 0) map[key] = idx;
  }

  return Object.keys(map).length >= 2 ? map : null;
}

function extractWeekId(fileName, sheetName) {
  const match = fileName.match(/(\d{4}-W\d+)/i);
  if (match) return match[1];
  const sheetMatch = sheetName.match(/(W\d+)/i);
  if (sheetMatch) return sheetMatch[1];
  return null;
}

function mapWeeklyRow(row, columnMap) {
  const result = { customerName: null, content: '', date: null, meta: {} };
  const parts = [];

  if (columnMap.customer !== undefined) {
    result.customerName = String(row[columnMap.customer] || '').trim() || null;
  }
  if (columnMap.date !== undefined) {
    result.date = String(row[columnMap.date] || '').trim() || null;
  }

  for (const [key, idx] of Object.entries(columnMap)) {
    const val = String(row[idx] || '').trim();
    if (val && key !== 'customer' && key !== 'date') {
      parts.push(val);
      result.meta[key] = val;
    }
  }

  result.content = parts.join(' | ');
  return result;
}

function classifyExcelRow(rowData) {
  if (rowData.meta.risk) return 'risk';
  if (rowData.meta.action) return 'todo_context';
  if (rowData.meta.project) return 'project';
  if (rowData.meta.focus) return 'weekly';
  return 'weekly';
}

// ─── Helpers ──────────────────────────────────────────────────

function getDefaultImportance(memoryType) {
  const importanceMap = {
    customer_profile: 3,
    relationship: 3,
    project: 3,
    risk: 5,
    competitor: 4,
    strategy: 4,
    decision: 3,
    meeting: 3,
    weekly: 3,
    todo_context: 3,
    sales_data: 3,
    archive_raw: 2,
  };
  return importanceMap[memoryType] || 3;
}

module.exports = {
  parseMarkdown,
  parseExcel,
  classifyHeading,
  mkChecksum,
};
