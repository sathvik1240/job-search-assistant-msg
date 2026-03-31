# Flow Walkthrough Plan — 10-15 Minutes
**Sathvik Boorgu | Leena AI EIR Assignment**

---

## Setup Before Recording
- Backend + frontend running (localhost:3000)
- Fresh database (delete jobs.db before starting)
- Claude.ai open in another tab with Gmail connected
- Apollo.io open in a tab (logged in, for contact lookup)

---

## Walkthrough Script

### 1. Introduction (1 min)
- "I built a Job Search Assistant using Claude.ai that scrapes, scores, and helps me act on job opportunities."
- Quick pan of the empty dashboard — show the layout, stats bar, buttons

### 2. Scraping Live Data (2 min)
- Click **"Scrape Jobs"** → show terminal output (SerpAPI + Adzuna queries running)
- Wait for completion → show the toast notification with count
- Click **"Score Jobs"** → show terminal: Claude scoring each job with reasoning
- "Scoring uses Claude Sonnet to analyze each job description for scope, ownership level, and strategic involvement — not just keyword matching."

### 3. Dashboard Overview (2 min)
- Show the job list sorted by score — green/yellow/gray score circles
- Expand a high-scoring job → walk through score breakdown (Title Fit, Scope, Recency, Domain, Stage)
- Show Claude's reasoning text: "Here's what Claude said about this role's scope..."
- Show a deal-breaker blocked job (if visible in terminal): "This job asked for 8+ years, so it was auto-filtered."
- Use filters — filter by score 60+, search by company name

### 4. Adding Leena AI EIR Manually (1 min)
- Click **"Add Job"** → enter Leena AI EIR details (title, company, paste full JD)
- Show it scoring immediately → "Claude scored the scope at 22/25 — high autonomy, 0-to-1, founder access"
- Show where it ranks relative to other jobs
- "This is my actual target role. The tool scored it [X]/100 — here's exactly why."

### 5. Finding Contacts — AI-Powered (2 min)
- Expand the Leena AI card → click **"Find Contacts (AI)"**
- Show the yellow panel with Claude's suggested titles to search
- "Claude analyzed this role and suggests searching for: [titles]. Let me look them up."
- Click **"Search on Apollo"** → quick lookup on Apollo.io → find a real person
- Back on dashboard → click **"Add Contact"** → enter name + email
- Repeat for 2 more contacts (1 HR + 2 leaders)
- Show the contacts appearing with confidence badges

### 6. Drafting Personalized Emails (2 min)
- Click **"Draft Emails"** → show Claude generating personalized emails
- Expand an email draft → read through it: "Notice it references my Zomato and Mercor experience, includes a specific company insight, and matches my writing tone."
- Click **"Edit"** → make a small tweak → save
- "Every email is editable. Claude drafts it, I refine it."

### 7. Sending an Email — Live Action (2 min)
- Click **"Send (opens email client)"** on one of the drafts
- Show Gmail opening with pre-filled recipient, subject, body
- Actually send it (or show the compose window as proof)
- Back on dashboard → status updated to "sent"
- **Switch to Claude.ai** → "Now let me also send a follow-up via Claude's Gmail connection."
- Type: "Send an email to [email] with subject 'Following up on [role]' and body: [short follow-up]"
- Show Claude using Gmail MCP to send → confirm in sent folder
- "That's the Gmail connector doing a live write action."

### 8. Application Tracking (1 min)
- Show the status workflow: New → Contacts Found → Contacted → Applied
- Change a job's status manually via dropdown
- Add a note: "Spoke with [name], scheduling interview"
- Show stats bar updating

### 9. Export (30 sec)
- Click **"Export CSV"** → show the file downloading
- "I can import this into Google Sheets for mobile access or sharing."

### 10. Wrap-Up (1 min)
- "5 live connectors: SerpAPI for Google Jobs, Adzuna for secondary coverage, Apollo for contact discovery, Gmail for outreach, and Claude API powering the scoring intelligence and email personalization."
- "The scoring note explains my rubric — what I included, what I excluded, and where the Leena AI EIR role landed."

---

## Key Points to Hit
- [ ] Live data (not mock) — SerpAPI + Adzuna scraping real jobs
- [ ] Scoring with defined criteria — show the 5-criterion breakdown + Claude reasoning
- [ ] At least 1 action per job — email sent, application opened
- [ ] 4+ live connectors — SerpAPI, Adzuna, Apollo (web), Gmail, Claude API
- [ ] Working dashboard with per-job actions
- [ ] Leena AI EIR scored through the same rubric — show where it lands and why
