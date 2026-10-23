import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SET_TYPES } from "@/api/sets/types";

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

describe("sets_set_type_check constraint", () => {
  it("allows exactly the values in SET_TYPES", () => {
    expect(latestConstraintValues()).toEqual([...SET_TYPES].sort());
  });
});

function latestConstraintValues() {
  const matches = readdirSync(MIGRATIONS_DIR)
    .sort()
    .flatMap((file) => {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      return [
        ...sql.matchAll(
          /ADD CONSTRAINT sets_set_type_check\s+CHECK \(set_type IN \(([^)]*)\)\)/gi,
        ),
      ];
    });
  const latest = matches.at(-1);
  if (!latest) throw new Error("sets_set_type_check migration not found");
  return [...latest[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!).sort();
}
