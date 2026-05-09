import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getAdminClient, requireAdmin, corsHeaders } from "../_shared/auth.ts";

const setPayloadSchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
  stageName: z.string().nullish(),
  timeStart: z.string().nullish(),
  timeEnd: z.string().nullish(),
  artistSlugs: z.array(z.string()),
});

const commitRequestSchema = z.object({
  festivalEditionId: z.string().uuid(),
  artistsToCreate: z
    .array(z.object({ name: z.string(), slug: z.string() }))
    .default([]),
  stagesToCreate: z.array(z.object({ name: z.string() })).default([]),
  setsToCreate: z.array(setPayloadSchema).default([]),
  setsToUpdate: z
    .array(setPayloadSchema.extend({ id: z.string().uuid() }))
    .default([]),
  setIdsToArchive: z.array(z.string().uuid()).default([]),
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
      artistsToCreate,
      stagesToCreate,
      setsToCreate,
      setsToUpdate,
      setIdsToArchive,
    } = parsed.data;

    const db = getAdminClient();

    const { data, error } = await db.rpc("commit_schedule", {
      p_festival_edition_id: festivalEditionId,
      p_user_id: auth.userId,
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
