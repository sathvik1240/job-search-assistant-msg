import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env") });

// --- API Keys ---
export const SERPAPI_KEY = process.env.SERPAPI_KEY || "";
export const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || "";
export const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || "";
export const APOLLO_API_KEY = process.env.APOLLO_API_KEY || "";
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
export const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";

// Startup key check
console.log("API Keys loaded:");
console.log("  SerpAPI:", SERPAPI_KEY ? `✓ (${SERPAPI_KEY.slice(0, 6)}...)` : "✗ MISSING");
console.log("  Adzuna:", ADZUNA_APP_ID && ADZUNA_APP_KEY ? `✓ (ID: ${ADZUNA_APP_ID})` : "✗ MISSING");
console.log("  Apollo:", APOLLO_API_KEY ? `✓ (${APOLLO_API_KEY.slice(0, 6)}...)` : "✗ MISSING");
console.log("  Claude:", ANTHROPIC_API_KEY ? `✓ (${ANTHROPIC_API_KEY.slice(0, 12)}...)` : "✗ MISSING");
console.log("  Slack:", SLACK_WEBHOOK_URL ? "✓ configured" : "✗ not set (optional)");

// --- User Profile ---
export const USER_EMAIL = process.env.USER_EMAIL || "sathvik1240@gmail.com";
export const USER_NAME = process.env.USER_NAME || "Sathvik Boorgu";
export const USER_PHONE = process.env.USER_PHONE || "+91 75692 89556";

// --- Job Search Preferences ---
export const TARGET_TITLES = [
  "entrepreneur in residence",
  "eir",
  "founder's office",
  "chief of staff",
  "program manager",
  "ai deployment strategist",
  "ai generalist",
  "gtm manager",
  "ai consultant",
  "ai operations manager",
  "strategy and operations",
  "strategic projects lead",
  "strategy associate",
  "operations associate",
  "business operations",
];

export const DEAL_BREAKERS = [
  "unpaid",
  "volunteer",
  "intern ",
  "internship",
  "6+ years",
  "7+ years",
  "8+ years",
  "10+ years",
  "senior software engineer",
  "staff engineer",
  "principal engineer",
  "software developer",
  "backend engineer",
  "frontend engineer",
  "fullstack engineer",
  "sde ",
  "sde-",
];

export const POSITIVE_KEYWORDS = [
  "ai", "artificial intelligence", "machine learning", "llm", "generative ai",
  "ml ops", "ai agents", "automation", "saas", "startup",
  "0 to 1", "zero to one", "early stage", "seed", "series a", "series b",
  "product-led", "cross-functional", "strategy", "operations",
  "founder", "ceo", "cxo", "leadership",
];

export const NEGATIVE_KEYWORDS = [
  "intern", "internship", "contract", "freelance", "part-time",
  "night shift", "graveyard", "data entry",
];

// --- Scoring Weights ---
export const SCORING_WEIGHTS = {
  title_fit: 30,
  scope: 25,
  recency: 20,
  domain_match: 15,
  company_stage: 10,
};

export const RECENCY_LAMBDA = 0.1;
export const RECENCY_MAX_SCORE = 20;
export const RECENCY_FLOOR = 1;

// --- Location ---
export const PREFERRED_LOCATIONS = [
  "india", "bangalore", "bengaluru", "hyderabad", "mumbai",
  "delhi", "gurgaon", "noida", "pune", "chennai", "remote",
];
export const LOCATION_PENALTY_GLOBAL = 0.7;

// --- Resume ---
export const RESUME_SUMMARY = {
  name: "Sathvik Boorgu",
  email: "sathvik1240@gmail.com",
  phone: "+91 75692 89556",
  linkedin: "linkedin.com/in/sathvikboorgu",
  current_role: "AI Training Lead (Contract) at Mercor",
  previous_role: "Associate Program Manager, CEO's Office at Zomato",
  education: "B.A., Integrated Programme in Management, IIM Indore (2020-2023)",
  years_of_experience: "2.5+",
  key_achievements: [
    "Leading 90+ SME team across US, EMEA, India for Meta's frontier AI training at Mercor ($10B valuation)",
    "Built India's first gig-worker scholarship program at Zomato: scaled 500 to 13,000+ scholars, budget grew 12x to $2M",
    "Integrated scholarships into driver incentive structure, reducing churn 15%, saving $580K",
    "Led 12-person ops/data team; AI fraud filter cut bad claims by 37%, freed 1,000+ staff-hours/year",
    "Negotiated India's first cross-competitor data-sharing agreement with Swiggy and Zepto",
  ],
};

// --- Email Templates ---
export const HR_EMAIL_TEMPLATE = (contactName, jobTitle, companyName) => `Hi ${contactName},

I hope this message finds you well. My name is Sathvik Boorgu, and I'm writing to express my interest in the ${jobTitle} role at ${companyName}.

I'm currently based in India and open to relocation. Here's a quick snapshot of my background:

- AI Training Lead at Mercor (SF-based, $10B valuation) — leading 90+ person evaluation team for Meta's AI training programs
- Associate Program Manager, CEO's Office at Zomato ($31B) — built and scaled India's first gig-worker scholarship from 500 to 13,000+ scholars
- IIM Indore, GMAT 750

I'd love to be considered for this role or any relevant opportunities on your team. I've attached my resume for your reference.

Thanks for your time,
Sathvik`;

export const HM_EMAIL_FALLBACK = (contactName, personReason, insight, valueAdd) => `Hi ${contactName},

Hope you've been doing well. I'm reaching out because ${personReason}.

By way of background, I've spent the past couple of years across Zomato and more recently Mercor. At Zomato, I worked in the CEO's Office building and scaling initiatives under Deepinder Goyal's $100M education fund — took a 500-student pilot to 13,000+ scholars across 20 states. At Mercor, I've been leading a 90+ person team managing evaluation pipelines for Meta's frontier AI training programs.

${insight}

${valueAdd}

Would love to chat if you think there's a fit. Happy to share more details.

Best,
Sathvik`;

// --- Apollo Filters ---
export const HR_TITLES = [
  "talent acquisition", "recruiter", "recruiting", "hr manager",
  "human resources", "people operations", "head of people",
  "hiring manager", "talent partner",
];

export const HIRING_MANAGER_TITLES = [
  "ceo", "cto", "coo", "founder", "co-founder",
  "vp product", "vp operations", "vp strategy",
  "head of product", "head of operations", "head of strategy",
  "director of product", "director of operations",
  "chief of staff",
];
