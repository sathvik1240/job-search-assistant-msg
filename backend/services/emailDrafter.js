import axios from "axios";
import {
  ANTHROPIC_API_KEY, RESUME_SUMMARY,
  HR_EMAIL_TEMPLATE, HM_EMAIL_FALLBACK,
} from "../config.js";

export function draftHrEmail(job, contact) {
  const contactName = contact.name?.split(" ")[0] || "Hi";
  const company = job.company || "the company";
  const title = job.title || "the open position";

  return {
    subject: `Application for ${title} – Sathvik Boorgu`,
    body: HR_EMAIL_TEMPLATE(contactName, title, company),
    email_type: "hr",
  };
}

export async function draftHiringManagerEmail(job, contact) {
  const contactName = contact.name?.split(" ")[0] || "Hi";
  const company = job.company || "";
  const title = job.title || "";
  const description = (job.description || "").slice(0, 2000);
  const contactTitle = contact.title || "";

  if (!ANTHROPIC_API_KEY) {
    return {
      subject: `Quick intro – ${title} at ${company}`,
      body: HM_EMAIL_FALLBACK(
        contactName,
        `I came across the ${title} role at ${company} and it really resonated with my background`,
        `${company}'s work in this space feels very aligned with what I've been doing.`,
        "Given my experience building programs from 0-to-1 at Zomato and managing AI evaluation at scale at Mercor, I think I could add real value to your team."
      ),
      email_type: "hiring_manager",
    };
  }

  const prompt = `Write a personalized outreach email from Sathvik Boorgu to ${contactName} (${contactTitle} at ${company}) about the ${title} role.

CONTEXT:
- Job description: ${description}
- Contact: ${contactName}, ${contactTitle}

SATHVIK'S BACKGROUND:
- Currently AI Training Lead at Mercor ($10B SF-based startup), leading 90+ person team for Meta's frontier AI training
- Previously Associate Program Manager in CEO's Office at Zomato ($31B), built gig-worker scholarship from 500 to 13,000+ scholars
- IIM Indore grad, GMAT 750

EMAIL REQUIREMENTS:
- Tone: casual, humble, conversational, professional. NO generic statements.
- Structure: 
  1. Warm greeting to ${contactName}
  2. Why reaching out (specific to this company/role)
  3. Brief background (Zomato + Mercor, with specific achievements)
  4. One specific insight about a recent trend or development the company is indexing on
  5. How Sathvik can add value (connect experience to their needs)
  6. Warm closing

VOICE REFERENCE (write like this):
"Hope you've been doing well. I'm writing to introduce myself... By way of background, I've spent the past couple of years across Zomato and more recently Mercor..."

Write ONLY the email body (no subject line). Keep it under 200 words. Start with "Hi ${contactName},".`;

  try {
    const { data } = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
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

    return {
      subject: `Quick intro – ${title} at ${company}`,
      body: data.content[0].text.trim(),
      email_type: "hiring_manager",
    };
  } catch (e) {
    console.error("Claude email drafting error:", e.message);
    return {
      subject: `Quick intro – ${title} at ${company}`,
      body: HM_EMAIL_FALLBACK(
        contactName,
        `I came across the ${title} role at ${company} and it really resonated with my background`,
        `${company}'s work in this space feels very aligned with what I've been doing.`,
        "Given my experience building programs from 0-to-1 at Zomato and managing AI evaluation at scale at Mercor, I think I could add real value to your team."
      ),
      email_type: "hiring_manager",
    };
  }
}

export async function draftEmailsForJob(job, contacts) {
  const emails = [];

  for (const contact of contacts) {
    if (!contact.email) continue;

    const email = contact.contact_type === "hr"
      ? draftHrEmail(job, contact)
      : await draftHiringManagerEmail(job, contact);

    emails.push({
      ...email,
      to_email: contact.email,
      to_name: contact.name || "",
      contact_id: contact.id,
      job_id: job.id,
      status: "draft",
    });
  }

  return emails;
}

export function generateApplyBlurb(job) {
  const r = RESUME_SUMMARY;
  const title = job.title || "this position";
  const company = job.company || "your company";

  return `Name: ${r.name}
Email: ${r.email}
Phone: ${r.phone}
LinkedIn: ${r.linkedin}

Current Role: ${r.current_role}
Previous Role: ${r.previous_role}
Education: ${r.education}
Years of Experience: ${r.years_of_experience}

Why I'm interested in ${title} at ${company}:
I bring a blend of AI operations experience (leading 90+ person evaluation team for Meta's AI training at Mercor) and 0-to-1 program building (scaled a 500-student pilot to 13,000+ scholars at Zomato's CEO Office). I'm excited about this role because it aligns with my experience in cross-functional execution and AI deployment.

Key Achievements:
- ${r.key_achievements.slice(0, 3).join("\n- ")}`;
}
