import axios from "axios";
import { createHash } from "crypto";
import { SERPAPI_KEY } from "../config.js";

function generateId(title, company, source) {
  const raw = `${title.toLowerCase().trim()}|${company.toLowerCase().trim()}|${source}`;
  return createHash("md5").update(raw).digest("hex");
}

function extractDomain(companyName) {
  const clean = companyName.toLowerCase().replace(/[\s,.\-]|inc|ltd|llc/g, "");
  return clean ? `${clean}.com` : null;
}

function detectRemote(title, location, description) {
  const text = `${title} ${location} ${description}`.toLowerCase();
  return ["remote", "work from home", "wfh", "anywhere", "distributed"].some(s => text.includes(s));
}

export async function searchSerpapi(query, location = "India", numResults = 20) {
  if (!SERPAPI_KEY) { console.log("WARNING: SERPAPI_KEY not set"); return []; }

  try {
    const { data } = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_jobs",
        q: query,
        location,
        api_key: SERPAPI_KEY,
        num: numResults,
      },
      timeout: 30000,
    });

    const results = data.jobs_results || [];
    console.log(`  SerpAPI "${query}" → ${results.length} results`);
    
    // Check for API errors in response
    if (data.error) {
      console.error(`  SerpAPI API error: ${data.error}`);
      return [];
    }

    return (data.jobs_results || []).map(item => {
      const title = item.title || "";
      const company = item.company_name || "";
      const loc = item.location || "";
      const description = item.description || "";
      const applyLinks = item.apply_options || [];
      const applyUrl = applyLinks[0]?.link || "";
      const ext = item.detected_extensions || {};

      return {
        external_id: generateId(title, company, "serpapi"),
        title,
        company,
        company_domain: extractDomain(company),
        location: loc,
        description,
        url: item.share_link || applyUrl,
        apply_url: applyUrl,
        source: "serpapi",
        date_posted: ext.posted_at || "",
        salary_min: ext.salary_min || null,
        salary_max: ext.salary_max || null,
        salary_currency: ext.salary_currency || null,
        is_remote: detectRemote(title, loc, description) ? 1 : 0,
      };
    });
  } catch (e) {
    const detail = e.response?.data?.error || e.message;
    console.error(`  SerpAPI error for "${query}": ${detail}`);
    return [];
  }
}

export async function scrapeAllQueries() {
  const queries = [
    "entrepreneur in residence",
    "founder's office",
    "chief of staff startup",
    "program manager AI",
    "AI operations manager",
    "AI consultant",
    "AI deployment strategist",
    "GTM manager AI startup",
    "strategy and operations startup",
    "strategic projects lead",
    "AI generalist",
    "entrepreneur in residence leena ai",
    "EIR AI startup India",
  ];

  const remoteQueries = [
    "entrepreneur in residence remote",
    "AI operations remote",
    "chief of staff AI remote",
  ];

  const allJobs = [];
  const seenIds = new Set();

  for (const q of queries) {
    const results = await searchSerpapi(q, "India");
    for (const job of results) {
      if (!seenIds.has(job.external_id)) {
        seenIds.add(job.external_id);
        allJobs.push(job);
      }
    }
  }

  for (const q of remoteQueries) {
    const results = await searchSerpapi(q, "");
    for (const job of results) {
      if (!seenIds.has(job.external_id)) {
        seenIds.add(job.external_id);
        allJobs.push(job);
      }
    }
  }

  console.log(`SerpAPI: scraped ${allJobs.length} unique jobs`);
  return allJobs;
}
