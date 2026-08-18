const REPAIR_COMMAND_RE =
  /^supabase migration repair --status (?:applied|reverted)(?: \d+)+$/m;

export function extractRepairCommand(logText: string): string | null {
  const match = REPAIR_COMMAND_RE.exec(logText);
  return match ? match[0].trim() : null;
}
