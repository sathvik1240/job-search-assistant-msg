import axios from "axios";
import {
  ANTHROPIC_API_KEY, TARGET_TITLES, DEAL_BREAKERS,
  POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS, SCORING_WEIGHTS,
  RECENCY_LAMBDA, RECENCY_MAX_SCORE, RECENCY_FLOOR,
  PREFERRED_LOCATIONS, LOCATION_PENALTY_GLOBAL,
} from "../config.js";

// --- Deal-Breaker Check (FIXED: catches 5-8 yrs, 5+ years, etc.) ---

// Title-level deal-breakers: if the TITLE contains these, it's a pure SWE/specialist role
const TITLE_DEAL_BREAKERS = [
  "software engineer", "software developer", "backend engineer",
  "frontend engineer", "fullstack engineer", "full stack engineer",
  "devops engineer", "data engineer", "ml engineer", "machine learning engineer",
  "staff engineer", "principal engineer", "sde ", "sde-", "sde1", "sde2", "sde3",
  "ios developer", "android developer", "qa engineer", "test engineer",
];

export function checkDealBreakers(job) {
  const title = (job.title || "").toLowerCase();
  const text = `${title} ${job.description || ""}`.toLowerCase();

  // 1. Check title-specific deal-breakers (more targeted)
  for (const term of TITLE_DEAL_BREAKERS) {
    if (title.includes(term)) {
      return { isDealBreaker: true, reason: `Software/specialist role: '${term}' in title` };
    }
  }

  // 2. Check general deal-breakers against full text
  for (const term of DEAL_BREAKERS) {
    if (text.includes(term.toLowerCase())) {
      return { isDealBreaker: true, reason: `Matched deal-breaker: '${term}'` };
    }
  }

  // 3. Parse ALL experience formats
  const expMatches = [];

  for (const m of text.matchAll(/(\d+)\+\s*(?:years?|yrs?)/gi)) {
    expMatches.push(parseInt(m[1]));
  }
  for (const m of text.matchAll(/(\d+)\s*[-–—]\s*(\d+)\s*(?:years?|yrs?)/gi)) {
    expMatches.push(parseInt(m[1]));
  }
  for (const m of text.matchAll(/(\d+)\s+to\s+(\d+)\s*(?:years?|yrs?)/gi)) {
    expMatches.push(parseInt(m[1]));
  }
  for (const m of text.matchAll(/(?:minimum|min|at\s+least|requires?)\s*(\d+)\s*(?:years?|yrs?)/gi)) {
    expMatches.push(parseInt(m[1]));
  }
  for (const m of text.matchAll(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp|work\s*exp)/gi)) {
    expMatches.push(parseInt(m[1]));
  }

  const minRequired = expMatches.length > 0 ? Math.min(...expMatches) : 0;
  if (minRequired >= 5) {
    return { isDealBreaker: true, reason: `Requires ${minRequired}+ years of experience` };
  }

  return { isDealBreaker: false, reason: "" };
}

// --- Title Fit (30 pts) ---

export function scoreTitleFit(job) {
  const title = (job.title || "").toLowerCase();
  const maxScore = SCORING_WEIGHTS.title_fit;

  for (const target of TARGET_TITLES) {
    if (title.includes(target)) return maxScore;
  }

  const titleWords = new Set(title.split(/[\s\-\/,]+/).filter(w => w.length > 2));
  let bestOverlap = 0;
  for (const target of TARGET_TITLES) {
    const targetWords = new Set(target.split(/[\s\-\/,]+/).filter(w => w.length > 2));
    let overlap = 0;
    for (const w of titleWords) { if (targetWords.has(w)) overlap++; }
    if (targetWords.size > 0) {
      bestOverlap = Math.max(bestOverlap, overlap / targetWords.size);
    }
  }

  if (bestOverlap === 0) return 0;
  return Math.round(maxScore * bestOverlap * 10) / 10;
}

// --- Recency (20 pts) ---

function parsePostedDate(dateStr) {
  if (!dateStr) return null;
  const s = dateStr.toLowerCase().trim();

  const patterns = [
    { re: /(\d+)\s*hour/i, fn: () => 0 },
    { re: /(\d+)\s*day/i, fn: m => parseInt(m) },
    { re: /(\d+)\s*week/i, fn: m => parseInt(m) * 7 },
    { re: /(\d+)\s*month/i, fn: m => parseInt(m) * 30 },
    { re: /just\s*(?:posted|now|today)/i, fn: () => 0 },
    { re: /yesterday/i, fn: () => 1 },
  ];

  for (const { re, fn } of patterns) {
    const match = s.match(re);
    if (match) return fn(match[1] || "0");
  }

  try {
    const posted = new Date(dateStr);
    if (!isNaN(posted.getTime())) {
      return Math.max(0, Math.floor((Date.now() - posted.getTime()) / 86400000));
    }
  } catch {}

  return null;
}

export function scoreRecency(job) {
  const daysOld = parsePostedDate(job.date_posted);
  if (daysOld === null) return RECENCY_MAX_SCORE * 0.5;
  const score = RECENCY_MAX_SCORE * Math.exp(-RECENCY_LAMBDA * daysOld);
  return Math.round(Math.max(RECENCY_FLOOR, score) * 10) / 10;
}

// --- Domain Match (15 pts) ---

export function scoreDomainMatch(job) {
  const text = `${job.title || ""} ${job.description || ""} ${job.company || ""}`.toLowerCase();
  const maxScore = SCORING_WEIGHTS.domain_match;
  const posHits = POSITIVE_KEYWORDS.filter(kw => text.includes(kw)).length;
  const negHits = NEGATIVE_KEYWORDS.filter(kw => text.includes(kw)).length;
  const posRatio = Math.min(posHits / 8, 1.0);
  const negPenalty = Math.min(negHits * 2, maxScore);
  return Math.round(Math.max(0, maxScore * posRatio - negPenalty) * 10) / 10;
}

// --- Company Stage (10 pts) ---

export function scoreCompanyStage(job) {
  const text = `${job.title || ""} ${job.description || ""} ${job.company || ""}`.toLowerCase();
  const maxScore = SCORING_WEIGHTS.company_stage;

  const startupSignals = [
    "startup", "early stage", "early-stage", "seed", "series a", "series b",
    "founded in 202", "small team", "fast-paced", "wear many hats",
    "0 to 1", "zero to one", "greenfield", "founding team",
    "pre-seed", "bootstrapped", "venture-backed", "yc ", "y combinator",
  ];
  const enterpriseSignals = [
    "fortune 500", "enterprise", "10,000+ employees", "established",
    "publicly traded", "global corporation", "mnc",
  ];

  const startupHits = startupSignals.filter(s => text.includes(s)).length;
  const enterpriseHits = enterpriseSignals.filter(s => text.includes(s)).length;

  if (startupHits >= 3) return maxScore;
  if (startupHits >= 1) return Math.round(maxScore * 0.7 * 10) / 10;
  if (enterpriseHits >= 2) return Math.round(maxScore * 0.3 * 10) / 10;
  return Math.round(maxScore * 0.5 * 10) / 10;
}

// --- Scope (25 pts) - Claude API ---

export async function scoreScopeWithClaude(job) {
  if (!ANTHROPIC_API_KEY) {
    return { score: fallbackScopeScore(job), reasoning: "No API key" };
  }

  const title = job.title || "";
  const company = job.company || "";
  const description = (job.description || "").slice(0, 3000);

  if (!description || description.length < 50) {
    return { score: fallbackScopeScore(job), reasoning: "Insufficient description" };
  }

  const prompt = `Analyze this job listing and score the SCOPE of the role from 0 to 25 points.

Job Title: ${title}
Company: ${company}
Description: ${description}

Score based on these criteria (the candidate has ~2.5 years experience at Zomato CEO's Office and Mercor AI):
- Breadth of responsibilities (cross-functional > narrow)
- Ownership level (0-to-1 building > maintaining existing)
- Strategic involvement (works with leadership > execution only)
- Growth potential (role can expand > fixed scope)
- Autonomy (high agency > heavily supervised)

Also: if this role requires 5+ years of experience, score it lower on fit.

Respond with ONLY a JSON object, no markdown:
{"score": <number 0-25>, "reasoning": "<2-3 sentence explanation>"}`;

  try {
    const { data } = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        timeout: 30000,
      }
    );

    let text = data.content[0].text.trim();
    if (text.startsWith("```")) {
      text = text.split("```")[1];
      if (text.startsWith("json")) text = text.slice(4);
      text = text.trim();
    }

    const result = JSON.parse(text);
    const score = Math.min(25, Math.max(0, parseFloat(result.score ?? 12.5)));
    return { score: Math.round(score * 10) / 10, reasoning: result.reasoning || "" };
  } catch (e) {
    console.error(`Claude scope scoring failed for "${title}":`, e.message);
    return { score: fallbackScopeScore(job), reasoning: "Fallback scoring" };
  }
}

function fallbackScopeScore(job) {
  const text = `${job.title || ""} ${job.description || ""}`.toLowerCase();
  const maxScore = SCORING_WEIGHTS.scope;

  const highSignals = [
    "0 to 1", "zero to one", "build from scratch", "founding",
    "cross-functional", "end to end", "full ownership",
    "work directly with", "ceo", "founder", "c-suite",
    "strategy", "lead", "head of", "drive",
    "wear many hats", "ambiguous", "autonomy",
  ];
  const lowSignals = [
    "maintain", "support", "assist", "help with",
    "under supervision", "entry level", "junior",
  ];

  const highHits = highSignals.filter(s => text.includes(s)).length;
  const lowHits = lowSignals.filter(s => text.includes(s)).length;

  const ratio = Math.min((highHits - lowHits * 0.5) / 5, 1.0);
  return Math.round(Math.max(5, maxScore * Math.max(0.2, ratio)) * 10) / 10;
}

// --- Location Adjustment ---

function applyLocationAdjustment(score, job) {
  const location = (job.location || "").toLowerCase();
  if (PREFERRED_LOCATIONS.some(loc => location.includes(loc))) return score;
  if (job.is_remote) return score;
  if (location) return Math.round(score * LOCATION_PENALTY_GLOBAL * 10) / 10;
  return score;
}

// --- Main Scoring ---

export async function scoreJob(job) {
  const { isDealBreaker, reason } = checkDealBreakers(job);
  if (isDealBreaker) {
    return {
      total_score: 0, title_fit: 0, scope: 0, recency: 0,
      domain_match: 0, company_stage: 0,
      reasoning: `DEAL-BREAKER: ${reason}`,
      is_deal_breaker: 1, deal_breaker_reason: reason,
    };
  }

  const titleFit = scoreTitleFit(job);
  const { score: scope, reasoning: scopeReasoning } = await scoreScopeWithClaude(job);
  const recency = scoreRecency(job);
  const domainMatch = scoreDomainMatch(job);
  const companyStage = scoreCompanyStage(job);

  let total = titleFit + scope + recency + domainMatch + companyStage;
  total = applyLocationAdjustment(total, job);

  return {
    total_score: Math.round(total * 10) / 10,
    title_fit: titleFit,
    scope,
    recency,
    domain_match: domainMatch,
    company_stage: companyStage,
    reasoning: `Title: ${titleFit}/30 | Scope: ${scope}/25 (${scopeReasoning}) | Recency: ${recency}/20 | Domain: ${domainMatch}/15 | Stage: ${companyStage}/10`,
    is_deal_breaker: 0,
    deal_breaker_reason: "",
  };
}
