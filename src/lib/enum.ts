// Narrows a raw DB string column to one of a known set of literal values,
// falling back to null for anything else (a value predating the enum, or
// data written outside its CHECK constraint).
export function asEnumValue<T extends string>(
  values: readonly T[],
  value: string | null,
): T | null {
  return value !== null && (values as readonly string[]).includes(value)
    ? (value as T)
    : null;
}
