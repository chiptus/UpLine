/**
 * Validates a raw string against a known set of literal values, for
 * narrowing an untyped DB column (e.g. a `text` + `CHECK` column) to its
 * proper union type. Returns null if the value isn't one of `values`.
 */
export function asEnumValue<T extends string>(
  values: readonly T[],
  value: string | null,
): T | null {
  return value !== null && (values as readonly string[]).includes(value)
    ? (value as T)
    : null;
}
