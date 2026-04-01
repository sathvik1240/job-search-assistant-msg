import express from "express";
import cors from "cors";
import cron from "node-cron";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

import {
  initDb, insertJob, updateJobScores, updateJobStatus,
  getAllJobs, getJob, getUnscoredJobs,
  insertContact, getContactsForJob,
  insertEmail, updateEmailStatus, updateEmailContent, getEmailsForJob, deleteEmailDrafts,
  logAction, getActionLog, getStats,
} from "./database.js";
import { scrapeAllQueries as scrapeSerpapi } from "./scrapers/serpapi.js";
import { scrapeAllQueries as scrapeAdzuna } from "./scrapers/adzuna.js";
import { scoreJob } from "./services/scoring.js";
import { findContacts } from "./services/contacts.js";
import { draftEmailsForJob, generateApplyBlurb } from "./services/emailDrafter.js";
import { exportJobsCsv, exportContactsCsv } from "./services/sheets.js";
import { notifyHighScoreJobs, slackMessage } from "./services/slack.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve frontend static files in production
const frontendDist = join(__dirname, "..", "frontend", "dist");
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  console.log("Serving frontend from", frontendDist);
}

// --- Init + Start ---
async function start() {
  await initDb();

  // Daily auto-scrape + score at 9 AM IST (3:30 UTC)
  cron.schedule("30 3 * * *", async () => {
    console.log("\n========== DAILY AUTO-SCRAPE (CRON) ==========");
    await slackMessage("🔄 Starting daily job scrape...");
    try {
      const results = await runFullPipeline();
      await slackMessage(`✅ Daily scrape complete: ${results.scraped} scraped, ${results.scored} scored, ${results.highScore} scoring 70+`);
    } catch (e) {
      console.error("Cron scrape failed:", e.message);
      await slackMessage(`❌ Daily scrape failed: ${e.message}`);
    }
  });
  console.log("Cron: daily scrape scheduled at 9:00 AM IST");

  app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
}
start();

// --- Full pipeline: scrape → score → notify ---
async function runFullPipeline() {
  let serpJobs = [], adzJobs = [];

  try { serpJobs = await scrapeSerpapi(); } catch (e) { console.error("SerpAPI:", e.message); }
  try { adzJobs = await scrapeAdzuna(); } catch (e) { console.error("Adzuna:", e.message); }

  const allJobs = [...serpJobs, ...adzJobs];
  let inserted = 0;
  for (const job of allJobs) { if (insertJob(job)) inserted++; }

  const unscored = getUnscoredJobs();
  let scored = 0;
  for (const job of unscored) {
    try {
      const scores = await scoreJob(job);
      updateJobScores(job.id, scores);
      scored++;
    } catch (e) { console.error(`Score error:`, e.message); }
  }

  // Notify high-score jobs via Slack
  const allScoredJobs = getAllJobs({ min_score: 70 });
  await notifyHighScoreJobs(allScoredJobs, 70);

  return { scraped: allJobs.length, inserted, scored, highScore: allScoredJobs.length };
}


// ============================================================
// SCRAPING
// ============================================================

app.post("/api/scrape", async (req, res) => {
  try {
    console.log("\n========== SCRAPING JOBS ==========");

    let serpJobs = [];
    let adzJobs = [];

    try {
      console.log("SerpAPI (Google Jobs)...");
      serpJobs = await scrapeSerpapi();
      console.log(`  → ${serpJobs.length} jobs`);
    } catch (e) {
      console.error("  SerpAPI FAILED:", e.message);
    }

    try {
      console.log("Adzuna...");
      adzJobs = await scrapeAdzuna();
      console.log(`  → ${adzJobs.length} jobs`);
    } catch (e) {
      console.error("  Adzuna FAILED:", e.message);
    }

    const allJobs = [...serpJobs, ...adzJobs];

    if (allJobs.length === 0) {
      return res.json({
        status: "warning",
        message: "No jobs scraped. Check API keys or rate limits in terminal.",
        jobs_scraped: 0, jobs_inserted: 0,
      });
    }

    let inserted = 0;
    for (const job of allJobs) {
      if (insertJob(job)) inserted++;
    }

    console.log(`Inserted ${inserted} new jobs (${allJobs.length - inserted} duplicates skipped)`);
    res.json({ status: "success", jobs_scraped: allJobs.length, jobs_inserted: inserted });
  } catch (e) {
    console.error("Scrape error:", e);
    res.status(500).json({ error: e.message });
  }
});


// ============================================================
// SCORING (separate from scraping)
// ============================================================

app.post("/api/score", async (req, res) => {
  try {
    const unscored = getUnscoredJobs();
    console.log(`\n========== SCORING ${unscored.length} JOBS ==========`);

    let scored = 0;
    let dealBreakers = 0;

    for (const job of unscored) {
      try {
        const scores = await scoreJob(job);
        updateJobScores(job.id, scores);
        if (scores.is_deal_breaker) {
          dealBreakers++;
          console.log(`  ✗ BLOCKED: "${job.title}" — ${scores.deal_breaker_reason}`);
        } else {
          scored++;
          console.log(`  ✓ ${scores.total_score}/100: "${job.title}" at ${job.company}`);
        }
      } catch (e) {
        console.error(`  Error scoring "${job.title}":`, e.message);
      }
    }

    console.log(`Done: ${scored} scored, ${dealBreakers} blocked`);
    res.json({ status: "success", jobs_scored: scored, deal_breakers: dealBreakers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Re-score a single job
app.post("/api/jobs/:id/rescore", async (req, res) => {
  const job = getJob(parseInt(req.params.id));
  if (!job) return res.status(404).json({ error: "Job not found" });

  try {
    const scores = await scoreJob(job);
    updateJobScores(job.id, scores);
    logAction(job.id, "rescored", `New score: ${scores.total_score}`);
    res.json({ status: "success", scores });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ============================================================
// JOBS
// ============================================================

app.get("/api/jobs", (req, res) => {
  const { status, min_score, source, show_dismissed } = req.query;
  let jobs = getAllJobs({
    status: status || null,
    min_score: min_score ? parseFloat(min_score) : null,
    source: source || null,
  });

  // Hide dismissed unless explicitly requested
  if (!show_dismissed) {
    jobs = jobs.filter(j => j.status !== "dismissed");
  }

  for (const job of jobs) {
    job.contacts = getContactsForJob(job.id);
    job.emails = getEmailsForJob(job.id);
  }

  res.json({ jobs, total: jobs.length });
});

app.get("/api/jobs/:id", (req, res) => {
  const job = getJob(parseInt(req.params.id));
  if (!job) return res.status(404).json({ error: "Job not found" });
  job.contacts = getContactsForJob(job.id);
  job.emails = getEmailsForJob(job.id);
  job.action_log = getActionLog(job.id);
  res.json(job);
});

app.put("/api/jobs/:id/status", (req, res) => {
  const jobId = parseInt(req.params.id);
  const job = getJob(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  const { status, notes } = req.body;
  updateJobStatus(jobId, status, notes ?? null);
  logAction(jobId, "status_update", `Status changed to ${status}`);
  res.json({ status: "updated" });
});

// Manual job entry
app.post("/api/jobs/manual", async (req, res) => {
  const { title, company, url, description, location } = req.body;

  if (!title || !company) {
    return res.status(400).json({ error: "Title and company are required" });
  }

  const jobData = {
    external_id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    company,
    company_domain: company.toLowerCase().replace(/[\s\-.,]/g, "") + ".com",
    location: location || "",
    description: description || "",
    url: url || "",
    apply_url: url || "",
    source: "manual",
    date_posted: new Date().toISOString(),
    is_remote: (location || "").toLowerCase().includes("remote") ? 1 : 0,
  };

  const jobId = insertJob(jobData);
  if (!jobId) {
    return res.status(400).json({ error: "Job already exists or insert failed" });
  }

  // Auto-score
  try {
    const scores = await scoreJob({ ...jobData, id: jobId });
    updateJobScores(jobId, scores);
    logAction(jobId, "manual_add", `Manually added and scored: ${scores.total_score}/100`);
    res.json({ status: "success", job_id: jobId, scores });
  } catch (e) {
    logAction(jobId, "manual_add", "Added but scoring failed");
    res.json({ status: "success", job_id: jobId, scores: null });
  }
});


// ============================================================
// CONTACTS
// ============================================================

// Get contact search suggestions (Claude suggests who to look for, provides Apollo + LinkedIn links)
app.post("/api/jobs/:id/contacts/suggest", async (req, res) => {
  const jobId = parseInt(req.params.id);
  const job = getJob(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  if (!job.company) {
    return res.status(400).json({ error: "No company name available" });
  }

  console.log(`\nGenerating contact suggestions for "${job.title}" at ${job.company}...`);
  const result = await findContacts(job.company_domain, job.company, job.title);

  logAction(jobId, "contact_suggestions", result.message);

  res.json({
    suggestions: result.suggestions || [],
    message: result.message,
    apollo_url: result.apollo_url,
    linkedin_url: result.linkedin_url,
  });
});

// Manual contact entry
app.post("/api/jobs/:id/contacts/manual", (req, res) => {
  const jobId = parseInt(req.params.id);
  const job = getJob(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  const { name, email, title, contact_type } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const contact = {
    job_id: jobId,
    name,
    email,
    title: title || "",
    company: job.company,
    linkedin_url: "",
    contact_type: contact_type || "hiring_manager",
    source: "manual",
    confidence: "high", // Manual entry = user verified
  };

  const cid = insertContact(contact);
  logAction(jobId, "contact_added_manually", `Added ${name} (${email})`);

  if (job.status === "new") updateJobStatus(jobId, "contacts_found");

  res.json({ contact: { ...contact, id: cid } });
});


// ============================================================
// EMAILS
// ============================================================

// Draft emails (or re-draft if force=true)
app.post("/api/jobs/:id/emails/draft", async (req, res) => {
  const jobId = parseInt(req.params.id);
  const job = getJob(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  const contacts = getContactsForJob(jobId);
  const contactsWithEmail = contacts.filter(c => c.email);

  if (contactsWithEmail.length === 0) {
    return res.status(400).json({
      error: "No contacts with email addresses found. Add contacts first (auto or manual).",
    });
  }

  // Allow re-drafting: delete existing drafts
  const existing = getEmailsForJob(jobId);
  if (existing.length > 0) {
    deleteEmailDrafts(jobId);
  }

  const emails = await draftEmailsForJob(job, contactsWithEmail);
  const saved = [];

  for (const email of emails) {
    email.job_id = jobId;
    const eid = insertEmail(email);
    saved.push({ ...email, id: eid, status: "draft" });
  }

  logAction(jobId, "emails_drafted", `Drafted ${saved.length} emails`);
  res.json({ emails: saved });
});

// Edit email
app.put("/api/emails/:id", (req, res) => {
  const { subject, body } = req.body;
  updateEmailContent(parseInt(req.params.id), subject, body);
  res.json({ status: "updated" });
});

// "Send" email — marks as sent, frontend handles mailto
app.post("/api/emails/:id/send", (req, res) => {
  updateEmailStatus(parseInt(req.params.id), "sent");
  res.json({ status: "sent" });
});


// ============================================================
// APPLY
// ============================================================

app.post("/api/jobs/:id/apply-blurb", (req, res) => {
  const job = getJob(parseInt(req.params.id));
  if (!job) return res.status(404).json({ error: "Job not found" });

  const blurb = generateApplyBlurb(job);
  logAction(job.id, "apply_blurb_generated", "Clipboard blurb ready");

  // DON'T auto-change status — let frontend decide
  res.json({
    blurb,
    apply_url: job.apply_url || "",
    job_title: job.title || "",
    company: job.company || "",
  });
});


// ============================================================
// CSV EXPORT
// ============================================================

app.get("/api/export/jobs.csv", (req, res) => {
  const jobs = getAllJobs();
  const filepath = exportJobsCsv(jobs);
  res.download(filepath, "jobs.csv");
});

app.get("/api/export/contacts.csv", (req, res) => {
  const contactsByJob = {};
  for (const job of getAllJobs()) {
    const contacts = getContactsForJob(job.id);
    if (contacts.length > 0) contactsByJob[job.id] = contacts;
  }
  const filepath = exportContactsCsv(contactsByJob);
  res.download(filepath, "contacts.csv");
});


// ============================================================
// STATS + HEALTH
// ============================================================

app.get("/api/stats", (req, res) => res.json(getStats()));
app.get("/api/health", (req, res) => res.json({ status: "ok", version: "2.0.0" }));

// Full pipeline: scrape + score + notify (for manual trigger or cron)
app.post("/api/pipeline", async (req, res) => {
  try {
    console.log("\n========== FULL PIPELINE ==========");
    const results = await runFullPipeline();
    res.json({ status: "success", ...results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SPA catch-all — serve frontend for any non-API route (production only)
if (existsSync(frontendDist)) {
  app.get("*", (req, res) => {
    res.sendFile(join(frontendDist, "index.html"));
  });
}
