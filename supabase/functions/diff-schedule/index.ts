import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAdminClient, requireAdmin, corsHeaders } from "../_shared/auth.ts";
import { computeDiff, type DbArtist, type DbSet, type DbStage } from "./diff.ts";

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
    const body = await req.json();
    const { festivalEditionId, timezone, rows } = body;

    if (!festivalEditionId || !timezone || !Array.isArray(rows)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: festivalEditionId, timezone, rows" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const db = getAdminClient();

    const [stagesRes, setsRes, artistsRes] = await Promise.all([
      db
        .from("stages")
        .select("id, name")
        .eq("festival_edition_id", festivalEditionId)
        .eq("archived", false),
      db
        .from("sets")
        .select("id, name, description, stage_id, time_start, time_end, set_artists(artist_id, artists(id, name, slug))")
        .eq("festival_edition_id", festivalEditionId)
        .eq("archived", false),
      db
        .from("artists")
        .select("id, name, slug")
        .eq("archived", false),
    ]);

    if (stagesRes.error) throw stagesRes.error;
    if (setsRes.error) throw setsRes.error;
    if (artistsRes.error) throw artistsRes.error;

    const result = computeDiff(
      rows,
      (stagesRes.data ?? []) as DbStage[],
      (setsRes.data ?? []) as DbSet[],
      (artistsRes.data ?? []) as DbArtist[],
      timezone,
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("diff-schedule error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
