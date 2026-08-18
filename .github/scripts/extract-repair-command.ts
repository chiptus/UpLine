// GitHub's raw job-log API (repos/{owner}/{repo}/actions/jobs/{job_id}/logs) prefixes
// every line with an ISO-8601 timestamp, e.g. "2026-08-17T14:16:05.3705761Z <line>".
const REPAIR_COMMAND_RE =
  /^(?:\d{4}-\d{2}-\d{2}T[\d:.]+Z )?(supabase migration repair --status (?:applied|reverted)(?: \d+)+)$/m;

export function extractRepairCommand(logText: string): string | null {
  const match = REPAIR_COMMAND_RE.exec(logText);
  return match ? match[1].trim() : null;
}
