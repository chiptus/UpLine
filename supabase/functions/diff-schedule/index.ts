import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getAdminClient, requireAdmin, corsHeaders } from "../_shared/auth.ts";
import { computeDiff } from "./computeDiff.ts";

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Drop case-insensitive duplicates, keeping the first occurrence's casing.
// Mirrors parseCsv's dedupeArtists so a direct (non-wizard) caller can't skew
// the diff's roster key or send duplicate slugs downstream.
function dedupeArtists(names: string[]): string[] {
  const seen = new Set<string>();
  return names.filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const csvRowSchema = z.object({
  artists: z.array(z.string().trim().min(1)).min(1).transform(dedupeArtists),
  setName: z.string().optional(),
  stage: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
    .optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "startTime must be HH:MM")
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "endTime must be HH:MM")
    .optional(),
  description: z.string().optional(),
});

const diffRequestSchema = z.object({
  festivalEditionId: z.string().uuid(),
  timezone: z.string().min(1).refine(isValidTimezone, "Invalid IANA timezone"),
  rows: z.array(csvRowSchema),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const auth = await requireAdmin(req);
  if (auth.errorResponse) {
    return new Response(auth.errorResponse.body, {
      status: auth.errorResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const parsed = diffRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          issues: parsed.error.issues,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { festivalEditionId, timezone, rows } = parsed.data;

    const db = getAdminClient();

    const [stagesRes, setsRes, artistsRes] = await Promise.all([
      db
        .from("stages")
        .select("id, name")
        .eq("festival_edition_id", festivalEditionId)
        .eq("archived", false),
      db
        .from("sets")
        .select(
          "id, name, description, stage_id, time_start, time_end, set_artists(artist_id, artists(id, name, slug))",
        )
        .eq("festival_edition_id", festivalEditionId)
        .eq("archived", false)
        .order("time_start", { nullsFirst: false })
        .order("id"),
      db.from("artists").select("id, name, slug").eq("archived", false),
    ]);

    if (stagesRes.error) throw stagesRes.error;
    if (setsRes.error) throw setsRes.error;
    if (artistsRes.error) throw artistsRes.error;

    const result = computeDiff(
      rows,
      stagesRes.data ?? [],
      setsRes.data ?? [],
      artistsRes.data ?? [],
      timezone,
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("diff-schedule error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
