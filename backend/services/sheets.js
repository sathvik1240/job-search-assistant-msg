import { writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORT_DIR = join(__dirname, "..", "exports");

if (!existsSync(EXPORT_DIR)) mkdirSync(EXPORT_DIR, { recursive: true });

function toCsv(headers, rows) {
  const escape = v => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) lines.push(row.map(escape).join(","));
  return lines.join("\n");
}

export function exportJobsCsv(jobs) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filepath = join(EXPORT_DIR, `jobs_${ts}.csv`);

  const headers = [
    "ID", "Title", "Company", "Location", "Total Score", "Title Fit",
    "Scope", "Recency", "Domain", "Stage", "Status", "Source",
    "Date Posted", "URL", "Apply URL", "Notes",
  ];

  const rows = jobs.map(j => [
    j.id, j.title, j.company, j.location, j.total_score,
    j.title_fit_score, j.scope_score, j.recency_score,
    j.domain_match_score, j.company_stage_score, j.status,
    j.source, j.date_posted, j.url, j.apply_url, j.notes,
  ]);

  writeFileSync(filepath, toCsv(headers, rows), "utf-8");
  console.log(`Exported ${jobs.length} jobs to ${filepath}`);
  return filepath;
}

export function exportContactsCsv(contactsByJob) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filepath = join(EXPORT_DIR, `contacts_${ts}.csv`);

  const headers = ["Job ID", "Company", "Contact Name", "Email", "Title", "Type", "LinkedIn", "Source"];
  const rows = [];

  for (const [jobId, contacts] of Object.entries(contactsByJob)) {
    for (const c of contacts) {
      rows.push([jobId, c.company, c.name, c.email, c.title, c.contact_type, c.linkedin_url, c.source]);
    }
  }

  writeFileSync(filepath, toCsv(headers, rows), "utf-8");
  return filepath;
}

export function exportEmailsCsv(emails) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filepath = join(EXPORT_DIR, `emails_${ts}.csv`);

  const headers = ["Job ID", "To Name", "To Email", "Type", "Subject", "Status", "Sent At", "Created At"];
  const rows = emails.map(e => [
    e.job_id, e.to_name, e.to_email, e.email_type, e.subject, e.status, e.sent_at, e.created_at,
  ]);

  writeFileSync(filepath, toCsv(headers, rows), "utf-8");
  return filepath;
}
