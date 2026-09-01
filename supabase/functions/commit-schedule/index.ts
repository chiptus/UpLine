import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { SET_TYPES } from "../_shared/setTypes.ts";

// timeStart/timeEnd arrive as ISO strings or null. Coerce "" (and undefined)
// to null so the RPC's ::timestamptz cast doesn't choke on an empty string.
const nullableTimestamp = z
  .string()
  .nullish()
  .transform((v) => v || null);

// An explicit empty artistSlugs array is a valid roster: artist-less sets
// (workshops, performances) carry no artists by design.
const setPayloadSchema = z.object({
  name: z.string().min(1),
  setType: z
    .enum(SET_TYPES)
    .nullish()
    .transform((v) => v ?? null),
  description: z.string().nullish(),
  stageName: z.string().nullish(),
  timeStart: nullableTimestamp,
  timeEnd: nullableTimestamp,
  artistSlugs: z.array(z.string().min(1)),
});

const commitRequestSchema = z.object({
  festivalEditionId: z.string().uuid(),
  // #42: the watermark diff-schedule returned at Analyse time, round-tripped
  // unchanged. commit_schedule re-validates it against the edition's current
  // state and aborts if they diverge.
  watermark: z.string().min(1),
  artistsToCreate: z
    .array(z.object({ name: z.string().min(1), slug: z.string().min(1) }))
    .default([]),
  stagesToCreate: z.array(z.object({ name: z.string().min(1) })).default([]),
  setsToCreate: z.array(setPayloadSchema).default([]),
  setsToUpdate: z
    .array(setPayloadSchema.extend({ id: z.string().uuid() }))
    .default([]),
  setIdsToArchive: z.array(z.string().uuid()).default([]),
});

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

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
    const parsed = commitRequestSchema.safeParse(await req.json());
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

    const {
      festivalEditionId,
      watermark,
      artistsToCreate,
      stagesToCreate,
      setsToCreate,
      setsToUpdate,
      setIdsToArchive,
    } = parsed.data;

    const db = auth.adminClient;

    const { data, error } = await db.rpc("commit_schedule", {
      p_festival_edition_id: festivalEditionId,
      p_user_id: auth.userId,
      p_watermark: watermark,
      p_artists_to_create: artistsToCreate,
      p_stages_to_create: stagesToCreate,
      p_sets_to_create: setsToCreate,
      p_sets_to_update: setsToUpdate,
      p_set_ids_to_archive: setIdsToArchive,
    });

    if (error) {
      console.error("commit_schedule RPC error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("commit-schedule error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
