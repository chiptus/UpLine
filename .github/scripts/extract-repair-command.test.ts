import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { extractRepairCommand } from "./extract-repair-command.ts";

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
);

function readFixture(name: string) {
  return readFileSync(path.join(fixturesDir, name), "utf8");
}

describe("extractRepairCommand", () => {
  it("extracts the repair command from PR #273's actual failing staging-push log", () => {
    const log = readFixture("pr-273-migration-history-drift.txt");
    expect(extractRepairCommand(log)).toBe(
      "supabase migration repair --status reverted 20260814140000",
    );
  });

  it("extracts a repair command listing multiple migration versions", () => {
    const log = readFixture("multiple-reverted-versions.txt");
    expect(extractRepairCommand(log)).toBe(
      "supabase migration repair --status reverted 20260801120000 20260802093000 20260803081500",
    );
  });

  it("returns null when the log has no suggested repair command", () => {
    const log = readFixture("no-repair-command-connection-timeout.txt");
    expect(extractRepairCommand(log)).toBeNull();
  });

  it("returns null for an empty log", () => {
    expect(extractRepairCommand("")).toBeNull();
  });
});
