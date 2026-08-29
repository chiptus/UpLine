import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { FETCH_PAGE_SIZE, fetchAllRows } from "./fetchAllRows.ts";

function makeRows(count: number): { id: number }[] {
  return Array.from({ length: count }, (_, i) => ({ id: i }));
}

Deno.test("fetchAllRows returns a single short page as-is", async () => {
  const rows = makeRows(3);
  const calls: [number, number][] = [];
  const result = await fetchAllRows<{ id: number }>((from, to) => {
    calls.push([from, to]);
    return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
  });
  assertEquals(result, rows);
  assertEquals(calls, [[0, FETCH_PAGE_SIZE - 1]]);
});

Deno.test("fetchAllRows pages past the PostgREST row cap", async () => {
  const rows = makeRows(FETCH_PAGE_SIZE * 2 + 187);
  const calls: [number, number][] = [];
  const result = await fetchAllRows<{ id: number }>((from, to) => {
    calls.push([from, to]);
    return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
  });
  assertEquals(result.length, rows.length);
  assertEquals(result, rows);
  assertEquals(calls.length, 3);
});

Deno.test("fetchAllRows stops after an exact-multiple total", async () => {
  const rows = makeRows(FETCH_PAGE_SIZE);
  let calls = 0;
  const result = await fetchAllRows<{ id: number }>((from, to) => {
    calls++;
    return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
  });
  assertEquals(result.length, FETCH_PAGE_SIZE);
  assertEquals(calls, 2);
});

Deno.test("fetchAllRows throws the page error", async () => {
  await assertRejects(
    () =>
      fetchAllRows(() =>
        Promise.resolve({ data: null, error: new Error("boom") }),
      ),
    Error,
    "boom",
  );
});
