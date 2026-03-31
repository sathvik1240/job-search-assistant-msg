# Job Search Assistant
### Built by Sathvik Boorgu — Leena AI EIR Assignment

An AI-powered job search tool that scrapes, scores, and acts on job opportunities. Built with Express.js + React, using Claude API for intelligent scoring and email personalization.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│        React Dashboard (localhost:3000)       │
│  Job Cards → Score Breakdown → Actions        │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│         Express Backend (localhost:8000)      │
│  /scrape → /score → /contacts → /emails      │
└──────────────────────────────────────────────┘
         │          │          │          │
    SerpAPI     Adzuna    Apollo.io    Gmail
  (Google Jobs) (secondary) (contacts)  (send)
```

## Live Connectors

| # | System | What It Does |
|---|--------|-------------|
| 1 | **SerpAPI** (Google Jobs) | Scrapes job listings from Google Jobs aggregator |
| 2 | **Adzuna API** | Secondary job source, catches listings SerpAPI misses |
| 3 | **Apollo.io** (web UI) | Contact discovery — Claude suggests who to search for, user looks up on Apollo |
| 4 | **Gmail** | Outreach emails via mailto: (pre-filled) + Gmail MCP in Claude.ai for live sends |
| 5 | **Claude API** | Powers scope scoring (25 pts), contact suggestions, and email personalization |

## Scoring Engine (100 pts)

| Criteria | Weight | Method |
|----------|--------|--------|
| Role/title fit | 30 | Fuzzy match against 15 target titles |
| Scope of role | 25 | Claude API analyzes JD for ownership, breadth, autonomy |
| Recency | 20 | Exponential decay: `max(1, 20 × e^(-0.1 × days))` |
| Domain match | 15 | AI/startup keyword scoring |
| Company stage | 10 | Startup signal detection |

Deal-breaker auto-filters: 5+ years experience, software/engineer roles, internships, unpaid/volunteer.

See `SCORING_NOTE.md` for the full methodology writeup.

## Setup

### 1. Install dependencies

```bash
cd job-search-assistant

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. API keys needed

| Service | Free Tier | Get it at |
|---------|-----------|-----------|
| SerpAPI | 100 searches/mo | https://serpapi.com |
| Adzuna | 250 req/mo | https://developer.adzuna.com |
| Apollo.io | Web search free | https://www.apollo.io |
| Anthropic | $5 credits | https://console.anthropic.com |

### 3. Configure

```bash
cp .env.example .env
# Fill in your API keys
```

### 4. Run

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open http://localhost:3000

### 5. Use

1. Click **"Scrape Jobs"** — pulls listings from Google Jobs + Adzuna
2. Click **"Score Jobs"** — Claude scores each job across 5 criteria
3. Click **"Add Job"** — manually add any job (e.g., Leena AI EIR)
4. Expand a job → **"Find Contacts (AI)"** — Claude suggests titles to search, opens Apollo/LinkedIn
5. **"Add Contact"** — manually enter contacts you find
6. **"Draft Emails"** — Claude writes personalized outreach in your voice
7. **"Send"** — opens Gmail with everything pre-filled
8. **"Open & Apply"** — copies application blurb + opens the apply page
9. **"Export CSV"** — download jobs/contacts for Google Sheets import
10. Track status per job: New → Contacted → Applied → Replied → Interview → Offer

## Project Structure

```
job-search-assistant/
├── backend/
│   ├── server.js             # Express app + all API endpoints
│   ├── config.js             # API keys, preferences, scoring weights, email templates
│   ├── database.js           # SQLite (sql.js) setup + CRUD
│   ├── package.json
│   ├── scrapers/
│   │   ├── serpapi.js        # Google Jobs via SerpAPI
│   │   └── adzuna.js         # Adzuna job listings
│   └── services/
│       ├── scoring.js        # 5-criteria scoring engine + Claude API
│       ├── contacts.js       # Claude-powered contact suggestions + Apollo/LinkedIn links
│       ├── emailDrafter.js   # Claude API email personalization
│       └── sheets.js         # CSV export
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Full React dashboard
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .env                      # API keys (never commit)
├── .env.example
├── .gitignore
├── SCORING_NOTE.md           # Scoring methodology (assignment deliverable)
├── WALKTHROUGH_PLAN.md       # Demo script
└── README.md
```

## Where Claude Does the Heavy Lifting

| Feature | How Claude is used |
|---------|-------------------|
| **Scope scoring** | Reads full JD, evaluates ownership level, breadth, strategic access, autonomy → returns score + reasoning |
| **Contact suggestions** | Analyzes the company + role, suggests 5 specific titles to search for on Apollo/LinkedIn |
| **Email personalization** | Drafts hiring manager outreach with company-specific insights, matching the user's conversational tone |
| **Deal-breaker nuance** | Scope prompt asks Claude to flag roles that require 5+ years even if keywords don't catch it |

## Leena AI EIR

Added manually via "Add Job" and scored through the identical rubric. Score breakdown and Claude's reasoning visible in the dashboard. See `SCORING_NOTE.md` for where it lands and why.
