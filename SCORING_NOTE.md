# Scoring Note — Job Search Assistant
**Sathvik Boorgu | Leena AI EIR Assignment**

## Criteria & Weights

Every job is scored out of 100 across five criteria, ordered by importance to my search:

**Role/Title Fit (30 pts)** — Fuzzy-matched against 15 target titles (EIR, Founder's Office, Chief of Staff, Program Manager, AI Consultant, GTM Manager, Strategy & Operations, etc.). Exact substring match = full points; partial word overlap scores proportionally; zero overlap = 0 points. This is the heaviest weight because a title mismatch almost always signals a role mismatch.

**Scope of Role (25 pts)** — Analyzed by Claude (Sonnet), which reads the full job description and evaluates: breadth of responsibilities, ownership level (0-to-1 vs. maintenance), strategic involvement with leadership, growth potential, and autonomy. This is the most nuanced criterion — keywords alone can't distinguish a "strategy" role with real ownership from one that's pure execution support. Claude returns a score + written reasoning, visible in the dashboard.

**Recency (20 pts)** — Exponential decay: `max(1, 20 × e^(-0.1 × days_old))`. A job posted today scores 20/20; at 7 days ~10/20; at 14 days ~5/20; at 30+ days it floors at 1. The λ=0.1 rate was chosen because in an active search, a 3-day-old posting is meaningfully more actionable than a 14-day-old one where screening has likely started.

**Domain Match (15 pts)** — Keyword scoring against positive signals (AI, LLM, startup, 0-to-1, SaaS, cross-functional, founder) and negative signals (intern, contract, data entry). Eight or more positive hits = full score. Negative keywords apply a deduction.

**Company Stage & Size (10 pts)** — Detects startup signals (seed, Series A, small team, YC, fast-paced) vs. enterprise signals (Fortune 500, MNC, 10,000+ employees). Startups score highest — my preferred environment.

## Deal-Breaker Filters (Auto-Reject)

Before scoring, every job runs through a deal-breaker check. Any match = score of 0 and hidden from the dashboard:
- **Experience**: 5+ years required in any format ("5-8 years", "minimum 5 years", "5+ yrs experience")
- **Role type**: Software/ML/DevOps engineer, SDE, data engineer (even if title includes "Founder's Office")
- **Other**: Unpaid, volunteer, internship roles

## What I Excluded (and Why)

**Compensation** — Startup and EIR roles almost never list salary. Including it creates a scoring bias toward the few jobs that disclose compensation, skewing rankings toward transparency rather than fit.

**Company Reputation** — No reliable metric exists for early-stage startup reputation. Glassdoor ratings are sparse for 20-person companies; Fortune 500 rankings don't apply. Any score here would be noise.

## Location Handling

India-based and remote roles score at full value. International roles receive a 30% total-score penalty to reflect visa complexity — visible but ranked below equivalent domestic opportunities.

## Where the Leena AI EIR Role Lands

The Leena AI EIR position was added to the pipeline and scored through the identical rubric. It benefits from: exact title match (30/30), strong scope signals (0-to-1, founder access, AI deployment, high autonomy), recent posting, strong domain alignment (AI agents, enterprise SaaS), and clear startup indicators. Its final score, breakdown, and Claude's reasoning are visible in the dashboard alongside all other listings.
