import initSqlJs from "sql.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "jobs.db");

let db;
let SQL;

export async function initDb() {
  SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      company_domain TEXT,
      location TEXT,
      description TEXT,
      url TEXT,
      apply_url TEXT,
      source TEXT NOT NULL,
      date_posted TEXT,
      date_scraped TEXT NOT NULL,
      salary_min REAL,
      salary_max REAL,
      salary_currency TEXT,
      is_remote INTEGER DEFAULT 0,
      total_score REAL DEFAULT 0,
      title_fit_score REAL DEFAULT 0,
      scope_score REAL DEFAULT 0,
      recency_score REAL DEFAULT 0,
      domain_match_score REAL DEFAULT 0,
      company_stage_score REAL DEFAULT 0,
      score_reasoning TEXT,
      is_deal_breaker INTEGER DEFAULT 0,
      deal_breaker_reason TEXT,
      status TEXT DEFAULT 'new',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      title TEXT,
      company TEXT,
      linkedin_url TEXT,
      contact_type TEXT NOT NULL,
      source TEXT DEFAULT 'apollo',
      confidence TEXT DEFAULT 'low',
      created_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      email_type TEXT NOT NULL,
      to_email TEXT NOT NULL,
      to_name TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      sent_at TEXT,
      gmail_message_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS action_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `);

  save();
  console.log("Database initialized");
}

function save() {
  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

function now() {
  return new Date().toISOString();
}

// Helper: run SELECT and return array of objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: run SELECT and return first row or null
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run INSERT/UPDATE and return lastInsertRowid
function runSql(sql, params = []) {
  db.run(sql, params);
  save();
}

function getLastId() {
  const result = db.exec("SELECT last_insert_rowid() as id");
  return result[0]?.values[0]?.[0] || null;
}

// --- Jobs ---

export function insertJob(data) {
  const ts = now();
  try {
    db.run(
      `INSERT OR IGNORE INTO jobs
      (external_id, title, company, company_domain, location, description,
       url, apply_url, source, date_posted, date_scraped, salary_min, salary_max,
       salary_currency, is_remote, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.external_id, data.title, data.company, data.company_domain || null,
        data.location || null, data.description || null, data.url || null,
        data.apply_url || null, data.source || "unknown", data.date_posted || null,
        ts, data.salary_min || null, data.salary_max || null,
        data.salary_currency || null, data.is_remote || 0, ts, ts,
      ]
    );
    const changes = db.getRowsModified();
    if (changes > 0) {
      save();
      // Query back the ID by external_id
      const row = queryOne("SELECT id FROM jobs WHERE external_id = ?", [data.external_id]);
      return row ? row.id : null;
    }
    return null;
  } catch (e) {
    console.error("Insert job error:", e.message);
    return null;
  }
}

export function updateJobScores(jobId, scores) {
  runSql(
    `UPDATE jobs SET total_score=?, title_fit_score=?, scope_score=?,
    recency_score=?, domain_match_score=?, company_stage_score=?,
    score_reasoning=?, is_deal_breaker=?, deal_breaker_reason=?, updated_at=?
    WHERE id=?`,
    [
      scores.total_score || 0, scores.title_fit || 0, scores.scope || 0,
      scores.recency || 0, scores.domain_match || 0, scores.company_stage || 0,
      scores.reasoning || "", scores.is_deal_breaker || 0,
      scores.deal_breaker_reason || "", now(), jobId,
    ]
  );
}

export function updateJobStatus(jobId, status, notes = null) {
  if (notes !== null) {
    runSql("UPDATE jobs SET status=?, notes=?, updated_at=? WHERE id=?",
      [status, notes, now(), jobId]);
  } else {
    runSql("UPDATE jobs SET status=?, updated_at=? WHERE id=?",
      [status, now(), jobId]);
  }
}

export function getAllJobs(filters = {}) {
  let query = "SELECT * FROM jobs WHERE is_deal_breaker = 0";
  const params = [];

  if (filters.status) { query += " AND status = ?"; params.push(filters.status); }
  if (filters.min_score != null) { query += " AND total_score >= ?"; params.push(filters.min_score); }
  if (filters.source) { query += " AND source = ?"; params.push(filters.source); }

  query += " ORDER BY total_score DESC, date_posted DESC";
  return queryAll(query, params);
}

export function getJob(jobId) {
  return queryOne("SELECT * FROM jobs WHERE id = ?", [jobId]);
}

export function getUnscoredJobs() {
  return queryAll("SELECT * FROM jobs WHERE total_score = 0 AND is_deal_breaker = 0");
}

// --- Contacts ---

export function insertContact(data) {
  db.run(
    `INSERT INTO contacts (job_id, name, email, title, company, linkedin_url, contact_type, source, confidence, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.job_id, data.name, data.email || null, data.title || null,
      data.company || null, data.linkedin_url || null,
      data.contact_type, data.source || "apollo", data.confidence || "low", now(),
    ]
  );
  save();
  const row = queryOne("SELECT MAX(id) as id FROM contacts");
  return row?.id || 0;
}

export function getContactsForJob(jobId) {
  return queryAll("SELECT * FROM contacts WHERE job_id = ?", [jobId]);
}

// --- Emails ---

export function insertEmail(data) {
  const ts = now();
  db.run(
    `INSERT INTO emails (job_id, contact_id, email_type, to_email, to_name, subject, body, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.job_id, data.contact_id, data.email_type,
      data.to_email, data.to_name || null, data.subject, data.body,
      data.status || "draft", ts, ts,
    ]
  );
  save();
  const row = queryOne("SELECT MAX(id) as id FROM emails");
  return row?.id || 0;
}

export function updateEmailStatus(emailId, status, gmailMsgId = null) {
  const ts = now();
  runSql(
    "UPDATE emails SET status=?, gmail_message_id=?, sent_at=?, updated_at=? WHERE id=?",
    [status, gmailMsgId, status === "sent" ? ts : null, ts, emailId]
  );
}

export function updateEmailContent(emailId, subject, body) {
  runSql(
    "UPDATE emails SET subject=?, body=?, updated_at=? WHERE id=?",
    [subject, body, now(), emailId]
  );
}

export function getEmailsForJob(jobId) {
  return queryAll("SELECT * FROM emails WHERE job_id = ?", [jobId]);
}

export function deleteEmailDrafts(jobId) {
  runSql("DELETE FROM emails WHERE job_id = ? AND status = 'draft'", [jobId]);
}

// --- Action Log ---

export function logAction(jobId, actionType, details = null) {
  db.run(
    "INSERT INTO action_log (job_id, action_type, details, created_at) VALUES (?, ?, ?, ?)",
    [jobId, actionType, details, now()]
  );
  save();
}

export function getActionLog(jobId = null) {
  if (jobId) {
    return queryAll(
      "SELECT * FROM action_log WHERE job_id = ? ORDER BY created_at DESC", [jobId]
    );
  }
  return queryAll("SELECT * FROM action_log ORDER BY created_at DESC LIMIT 100");
}

// --- Stats ---

export function getStats() {
  return {
    total_jobs: queryOne("SELECT COUNT(*) as c FROM jobs WHERE is_deal_breaker=0")?.c || 0,
    total_contacted: queryOne("SELECT COUNT(*) as c FROM jobs WHERE status='contacted'")?.c || 0,
    total_applied: queryOne("SELECT COUNT(*) as c FROM jobs WHERE status='applied'")?.c || 0,
    total_replied: queryOne("SELECT COUNT(*) as c FROM jobs WHERE status='replied'")?.c || 0,
    total_emails_sent: queryOne("SELECT COUNT(*) as c FROM emails WHERE status='sent'")?.c || 0,
    avg_score: queryOne("SELECT AVG(total_score) as a FROM jobs WHERE is_deal_breaker=0 AND total_score > 0")?.a || 0,
  };
}
