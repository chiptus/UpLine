export const FETCH_PAGE_SIZE = 1000;

// PostgREST caps a single select at max_rows (1000 by default), so a plain
// .select() silently truncates large tables — the diff then re-proposes
// existing artists as new. Page with .range() until a short page comes back.
export async function fetchAllRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < FETCH_PAGE_SIZE) return rows;
  }
}
