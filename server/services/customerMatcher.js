// server/services/customerMatcher.js
// Match customer names from historical files to existing CRM customers
// Uses normalized matching with fuzzy fallback

const db = require('../database');

// Cache for customer lookup (loaded once per import run)
let customerCache = null;

/**
 * Load customer cache from database
 */
function loadCustomerCache() {
  const rows = db.prepare('SELECT id, name FROM customers').all();
  customerCache = rows.map(r => ({
    id: r.id,
    name: r.name,
    normalizedName: normalize(r.name),
  }));
}

/**
 * Normalize a customer name for matching
 * Removes common suffixes, whitespace, brackets, etc.
 */
function normalize(name) {
  if (!name) return '';
  return name
    .replace(/\s+/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/股份有限公司/g, '')
    .replace(/有限责任公司/g, '')
    .replace(/有限公司/g, '')
    .replace(/集团有限公司/g, '')
    .replace(/集团/g, '')
    .toLowerCase();
}

/**
 * Match a name string to an existing customer
 * Priority: exact match > normalized match > contains match
 * @param {string} name - The name to match
 * @returns {{ id: string, name: string, confidence: number } | null}
 */
function matchCustomer(name) {
  if (!name || !name.trim()) return null;
  if (!customerCache) loadCustomerCache();

  const trimmed = name.trim();
  const normalized = normalize(trimmed);

  // 1. Exact match
  for (const c of customerCache) {
    if (c.name === trimmed) {
      return { id: c.id, name: c.name, confidence: 1.0 };
    }
  }

  // 2. Normalized match
  for (const c of customerCache) {
    if (c.normalizedName === normalized && normalized.length > 0) {
      return { id: c.id, name: c.name, confidence: 0.95 };
    }
  }

  // 3. Contains match (name contains customer key or vice versa)
  let bestMatch = null;
  let bestScore = 0;

  for (const c of customerCache) {
    const cNorm = c.normalizedName;
    if (cNorm.length < 2 || normalized.length < 2) continue;

    if (normalized.includes(cNorm) || cNorm.includes(normalized)) {
      const score = Math.min(cNorm.length, normalized.length) / Math.max(cNorm.length, normalized.length);
      if (score > bestScore && score >= 0.4) {
        bestScore = score;
        bestMatch = { id: c.id, name: c.name, confidence: Math.round(score * 80) / 100 };
      }
    }
  }

  if (bestMatch) return bestMatch;

  // 4. Sub-customer match (check sub_customers table)
  const subMatch = db.prepare(`
    SELECT sc.parent_id, sc.name, c.name as parent_name
    FROM sub_customers sc
    LEFT JOIN customers c ON c.id = sc.parent_id
    WHERE sc.name = ?
  `).get(trimmed);

  if (subMatch) {
    return { id: subMatch.parent_id, name: subMatch.parent_name, confidence: 0.7 };
  }

  // No match found
  return null;
}

/**
 * Match from filename (extract customer name from file path)
 * @param {string} fileName - e.g. "南京音飞储存设备有限公司.md"
 */
function matchFromFileName(fileName) {
  const name = fileName
    .replace(/\.(md|xlsx|txt)$/i, '')
    .replace(/^_/, '')
    .replace(/^\d{4}-W\d+_/, '') // Remove week prefix like "2026-W24_"
    .trim();

  return matchCustomer(name);
}

/**
 * Match from markdown H1 title
 * @param {string} title - e.g. "# 南京音飞储存设备有限公司"
 */
function matchFromTitle(title) {
  const name = title.replace(/^#+\s*/, '').trim();
  return matchCustomer(name);
}

/**
 * Reset cache (call at start of each import run)
 */
function resetCache() {
  customerCache = null;
}

module.exports = {
  matchCustomer,
  matchFromFileName,
  matchFromTitle,
  normalize,
  loadCustomerCache,
  resetCache,
};
