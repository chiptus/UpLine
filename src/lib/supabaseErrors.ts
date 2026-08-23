import type { PostgrestError } from "@supabase/supabase-js";

export class SupabaseNotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "SupabaseNotFoundError";
  }
}

export function isSupabaseNotFoundError(error: PostgrestError): boolean {
  return error.code === "PGRST116";
}
