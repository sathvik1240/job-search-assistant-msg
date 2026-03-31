import axios from "axios";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";

/**
 * Send a Slack notification for high-scoring jobs.
 */
export async function notifyHighScoreJobs(jobs, threshold = 70) {
  if (!SLACK_WEBHOOK_URL) {
    console.log("  Slack: webhook not configured, skipping notification");
    return;
  }

  const highScoreJobs = jobs.filter(j => j.total_score >= threshold && !j.is_deal_breaker);

  if (highScoreJobs.length === 0) {
    console.log(`  Slack: no jobs above ${threshold} score, skipping`);
    return;
  }

  const jobLines = highScoreJobs.slice(0, 10).map(j =>
    `• *${j.title}* at ${j.company} — Score: ${j.total_score}/100${j.location ? ` (${j.location})` : ""}`
  ).join("\n");

  const message = {
    text: `🔔 *Job Search Alert*\n\nFound ${highScoreJobs.length} job${highScoreJobs.length > 1 ? "s" : ""} scoring ${threshold}+:\n\n${jobLines}\n\n_Open your dashboard to review and take action._`,
  };

  try {
    await axios.post(SLACK_WEBHOOK_URL, message, { timeout: 10000 });
    console.log(`  Slack: notified ${highScoreJobs.length} high-score jobs`);
  } catch (e) {
    console.error("  Slack notification failed:", e.message);
  }
}

/**
 * Send a simple text message to Slack.
 */
export async function slackMessage(text) {
  if (!SLACK_WEBHOOK_URL) return;

  try {
    await axios.post(SLACK_WEBHOOK_URL, { text }, { timeout: 10000 });
  } catch (e) {
    console.error("  Slack message failed:", e.message);
  }
}
