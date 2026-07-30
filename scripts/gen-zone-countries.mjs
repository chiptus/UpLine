#!/usr/bin/env node
// Regenerate src/components/Admin/ScheduleImport/zoneCountries.ts from the
// system's IANA tz database (zone1970.tab). Run after a tzdata upgrade if you
// want fresh country mappings.
//
// Usage: node scripts/gen-zone-countries.mjs
//
// Default source: /usr/share/zoneinfo/zone1970.tab (Linux/macOS default).
// Override with: ZONE1970_PATH=/some/other/path node scripts/...

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = process.env.ZONE1970_PATH ?? "/usr/share/zoneinfo/zone1970.tab";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(
  __dirname,
  "..",
  "src/components/Admin/ScheduleImport/zoneCountries.ts",
);

const text = fs.readFileSync(SOURCE, "utf8");
const map = {};
for (const line of text.split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const cols = line.split("\t");
  if (cols.length < 3) continue;
  map[cols[2]] = cols[0].split(",");
}

const keys = Object.keys(map).sort();
const lines = [
  "// Generated from /usr/share/zoneinfo/zone1970.tab (IANA tz database).",
  "// Maps IANA timezone -> ISO 3166 alpha-2 country codes; the first code is",
  "// the primary country. Shared zones (e.g. Europe/Berlin) list all overlapping",
  "// countries so country search hits them too.",
  "//",
  "// Regenerate with: node scripts/gen-zone-countries.mjs",
  "",
  "export const ZONE_COUNTRIES: Record<string, readonly string[]> = {",
  ...keys.map(
    (k) =>
      `  ${JSON.stringify(k)}: [${map[k].map((c) => JSON.stringify(c)).join(", ")}],`,
  ),
  "};",
  "",
];

fs.writeFileSync(OUT, lines.join("\n"));
console.log(
  `Wrote ${keys.length} entries to ${path.relative(process.cwd(), OUT)}`,
);
