import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAdminClient, requireAdmin, corsHeaders } from "../_shared/auth.ts";

type SetPayload = {
  name: string;
  description?: string;
  stageName?: string;
  timeStart?: string;
  timeEnd?: string;
  artistSlugs: string[];
};

type CommitRequest = {
  festivalEditionId: string;
  artistsToCreate: { name: string; slug: string }[];
  stagesToCreate: { name: string }[];
  setsToCreate: SetPayload[];
  setsToUpdate: ({ id: string } & SetPayload)[];
  setIdsToArchive: string[];
};

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
    const body: CommitRequest = await req.json();
    const {
      festivalEditionId,
      artistsToCreate,
      stagesToCreate,
      setsToCreate,
      setsToUpdate,
      setIdsToArchive,
    } = body;

    if (!festivalEditionId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: festivalEditionId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const db = getAdminClient();

    const { data, error } = await db.rpc("commit_schedule", {
      p_festival_edition_id: festivalEditionId,
      p_user_id: auth.userId,
      p_artists_to_create: artistsToCreate ?? [],
      p_stages_to_create: stagesToCreate ?? [],
      p_sets_to_create: setsToCreate ?? [],
      p_sets_to_update: setsToUpdate ?? [],
      p_set_ids_to_archive: setIdsToArchive ?? [],
    });

    if (error) {
      console.error("commit_schedule RPC error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("commit-schedule error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
