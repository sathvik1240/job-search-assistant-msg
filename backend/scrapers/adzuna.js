import axios from "axios";
import { createHash } from "crypto";
import { ADZUNA_APP_ID, ADZUNA_APP_KEY } from "../config.js";

function generateId(title, company) {
  const raw = `${title.toLowerCase().trim()}|${company.toLowerCase().trim()}|adzuna`;
  return createHash("md5").update(raw).digest("hex");
}

function detectRemote(title, location, description) {
  const text = `${title} ${location} ${description}`.toLowerCase();
  return ["remote", "work from home", "wfh", "anywhere"].some(s => text.includes(s));
}

export async function searchAdzuna(query, country = "in", resultsPerPage = 20) {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.log("WARNING: Adzuna credentials not set");
    return [];
  }

  try {
    const { data } = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1`,
      {
        params: {
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_APP_KEY,
          what: query,
          results_per_page: resultsPerPage,
          sort_by: "date",
          "content-type": "application/json",
        },
        timeout: 30000,
      }
    );

    return (data.results || []).map(item => {
      const title = item.title || "";
      const company = item.company?.display_name || "Unknown";
      const location = item.location?.display_name || "";
      const description = item.description || "";

      const companyClean = company.toLowerCase().replace(/[\s,.\-]|inc|ltd|llc/g, "");
      const domain = companyClean && companyClean !== "unknown" ? `${companyClean}.com` : null;

      const currencyMap = { in: "INR", us: "USD", gb: "GBP" };

      return {
        external_id: generateId(title, company),
        title,
        company,
        company_domain: domain,
        location,
        description,
        url: item.redirect_url || "",
        apply_url: item.redirect_url || "",
        source: "adzuna",
        date_posted: item.created || "",
        salary_min: item.salary_min || null,
        salary_max: item.salary_max || null,
        salary_currency: currencyMap[country] || "USD",
        is_remote: detectRemote(title, location, description) ? 1 : 0,
      };
    });
  } catch (e) {
    console.error(`Adzuna error for "${query}" in ${country}:`, e.message);
    return [];
  }
}

export async function scrapeAllQueries() {
  const queries = [
    "entrepreneur in residence",
    "founder office",
    "chief of staff",
    "program manager AI",
    "AI operations",
    "AI consultant",
    "strategy operations startup",
    "GTM manager",
    "AI deployment",
  ];

  const allJobs = [];
  const seenIds = new Set();

  // India first
  for (const q of queries) {
    const results = await searchAdzuna(q, "in");
    for (const job of results) {
      if (!seenIds.has(job.external_id)) {
        seenIds.add(job.external_id);
        allJobs.push(job);
      }
    }
  }

  // Global (remote roles)
  for (const q of ["entrepreneur in residence", "AI operations remote", "chief of staff AI"]) {
    for (const country of ["gb", "us"]) {
      const results = await searchAdzuna(q, country, 10);
      for (const job of results) {
        if (!seenIds.has(job.external_id)) {
          seenIds.add(job.external_id);
          allJobs.push(job);
        }
      }
    }
  }

  console.log(`Adzuna: scraped ${allJobs.length} unique jobs`);
  return allJobs;
}
