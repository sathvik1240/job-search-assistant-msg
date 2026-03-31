/**
 * Contact finder module.
 *
 * Apollo's free tier does NOT support the People Search API (returns 403).
 * So we provide:
 * 1. A direct link to Apollo's web UI (free to search manually)
 * 2. A direct link to LinkedIn search
 * 3. Manual contact entry on the dashboard
 *
 * Claude is used to suggest WHAT titles to search for based on the role.
 */

import axios from "axios";
import { ANTHROPIC_API_KEY } from "../config.js";

/**
 * Generate search URLs and suggested titles for finding contacts at a company.
 * Returns Apollo + LinkedIn URLs that the user can open to manually find people.
 */
export async function findContacts(companyDomain, companyName, jobTitle = "") {
  console.log(`  Generating contact search links for "${companyName}"...`);

  // Use Claude to suggest WHO to look for
  const suggestions = await claudeSuggestContacts(companyName, jobTitle);

  const apolloUrl = `https://app.apollo.io/#/people?organizationName=${encodeURIComponent(companyName)}`;
  const linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName)}&origin=GLOBAL_SEARCH_HEADER`;

  return {
    contacts: [], // No auto-found contacts on free tier
    source: "manual",
    message: suggestions.message,
    suggestions: suggestions.titles,
    apollo_url: apolloUrl,
    linkedin_url: linkedinUrl,
  };
}

/**
 * Use Claude to suggest what titles/roles to search for at this company.
 */
async function claudeSuggestContacts(companyName, jobTitle) {
  if (!ANTHROPIC_API_KEY) {
    return {
      message: `Search for HR/recruiting + senior leadership at ${companyName}`,
      titles: ["HR Manager", "Talent Acquisition", "CEO", "CTO", "Head of Product"],
    };
  }

  const prompt = `I'm applying for the "${jobTitle}" role at ${companyName}. I need to find 3 people to reach out to: 1 HR/recruiting person and 2 senior leaders with hiring influence.

Suggest exactly 5 specific job titles I should search for on Apollo.io or LinkedIn to find the right people at ${companyName}. Consider the company size and type.

Respond with ONLY a JSON object, no markdown:
{"titles": ["title1", "title2", "title3", "title4", "title5"], "message": "<1 sentence advice on who to contact>"}`;

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
        timeout: 20000,
      }
    );

    let text = data.content[0].text.trim();
    if (text.startsWith("```")) {
      text = text.split("```")[1];
      if (text.startsWith("json")) text = text.slice(4);
      text = text.trim();
    }

    return JSON.parse(text);
  } catch (e) {
    console.error("  Claude suggestion failed:", e.message);
    return {
      message: `Search for HR/recruiting + senior leadership at ${companyName}`,
      titles: ["HR Manager", "Talent Acquisition", "CEO", "CTO", "Founder"],
    };
  }
}
