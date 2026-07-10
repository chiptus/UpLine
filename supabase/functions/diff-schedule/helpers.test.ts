import { assertEquals } from "jsr:@std/assert@1";
import { advanceDateByOne, artistKey, localToUtc, toSlug } from "./helpers.ts";

Deno.test("toSlug converts name to lowercase hyphenated slug", () => {
  assertEquals(toSlug("Carl Cox"), "carl-cox");
  assertEquals(toSlug("DJ Tennis"), "dj-tennis");
  assertEquals(toSlug("  Peggy Gou  "), "peggy-gou");
  assertEquals(toSlug("Aphex Twin"), "aphex-twin");
  assertEquals(toSlug("deadmau5"), "deadmau5");
  assertEquals(toSlug("Four Tet"), "four-tet");
});

Deno.test("artistKey sorts slugs and joins with pipe", () => {
  assertEquals(artistKey(["carl-cox"]), "carl-cox");
  assertEquals(artistKey(["carl-cox", "peggy-gou"]), "carl-cox|peggy-gou");
  assertEquals(artistKey(["peggy-gou", "carl-cox"]), "carl-cox|peggy-gou");
  assertEquals(artistKey(["c", "b", "a"]), "a|b|c");
});

Deno.test("advanceDateByOne advances date by one day", () => {
  assertEquals(advanceDateByOne("2026-07-11"), "2026-07-12");
  assertEquals(advanceDateByOne("2026-07-31"), "2026-08-01");
  assertEquals(advanceDateByOne("2026-12-31"), "2027-01-01");
});

Deno.test("localToUtc converts Lisbon summer time (UTC+1) to UTC", () => {
  const result = localToUtc("2026-07-11", "23:00", "Europe/Lisbon");
  assertEquals(result, "2026-07-11T22:00:00.000Z");
});

Deno.test("localToUtc converts Lisbon winter time (UTC+0) to UTC", () => {
  const result = localToUtc("2026-01-15", "22:00", "Europe/Lisbon");
  assertEquals(result, "2026-01-15T22:00:00.000Z");
});

Deno.test("localToUtc converts midnight correctly", () => {
  const result = localToUtc("2026-07-11", "00:00", "Europe/Lisbon");
  assertEquals(result, "2026-07-10T23:00:00.000Z");
});

Deno.test("localToUtc resolves a spring-forward wall time inside the skipped hour", () => {
  // Lisbon clocks jump from 01:00 to 02:00 local at 2026-03-29T01:00:00Z, so
  // "01:30" never occurs. @date-fns/tz's TZDate resolves a wall time inside
  // the skipped hour using the pre-transition (+00:00) offset, i.e. as if
  // DST had not yet started.
  const result = localToUtc("2026-03-29", "01:30", "Europe/Lisbon");
  assertEquals(result, "2026-03-29T01:30:00.000Z");
});

Deno.test("localToUtc resolves a fall-back wall time inside the repeated hour", () => {
  // Lisbon clocks fall back from 02:00 to 01:00 local at 2026-10-25T01:00:00Z,
  // so "01:30" occurs twice. Resolve to the later (post-transition) instant.
  const result = localToUtc("2026-10-25", "01:30", "Europe/Lisbon");
  assertEquals(result, "2026-10-25T01:30:00.000Z");
});
