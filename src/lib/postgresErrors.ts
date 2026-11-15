const UNIQUE_VIOLATION_CODE = "23505";

/** Matches on the constraint name Postgres puts in the error message, since a table can have several unique constraints. */
export function isSlugUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === UNIQUE_VIOLATION_CODE &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.includes("slug")
  );
}
