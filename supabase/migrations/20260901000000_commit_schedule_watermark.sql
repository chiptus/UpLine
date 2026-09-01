-- #42: commit_schedule applied a stale diff snapshot with no re-validation
-- at commit time. diff-schedule (Analyse) and commit_schedule (Commit) can
-- be minutes apart with no lock in between, so a concurrent edit made after
-- Analyse was silently overridden by the earlier plan -- most visibly,
-- setIdsToArchive being built from an orphan list that's gone stale.
--
-- Fix: abort-on-change. diff-schedule computes a watermark over the
-- edition's sets and returns it with the plan; the client threads it
-- through unchanged to commit-schedule; commit_schedule recomputes the same
-- watermark as its first step, inside the transaction, and aborts the whole
-- commit if it doesn't match. No advisory lock needed -- the in-txn re-check
-- makes concurrent commits safe (the second one aborts). The plan is either
-- applied verbatim or rejected whole; setIdsToArchive is never silently
-- recomputed.

-- Watermark = row count + latest updated_at across ALL of the edition's
-- sets (archived included -- an archive is exactly the kind of change this
-- must catch, and commit_schedule__archive_sets bumps updated_at on
-- archive same as create/update do via the update_sets_updated_at trigger
-- and the sets.updated_at DEFAULT now()). Shared between diff-schedule and
-- commit_schedule so the two sides can never drift out of format.
CREATE OR REPLACE FUNCTION public.commit_schedule__compute_watermark(
  p_festival_edition_id UUID
)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*) || ':' || COALESCE(MAX(updated_at)::TEXT, 'none')
  FROM sets
  WHERE festival_edition_id = p_festival_edition_id;
$$;

-- Signature is changing (new p_watermark param) -- drop the old overload
-- rather than leaving it reachable without the re-validation.
DROP FUNCTION IF EXISTS public.commit_schedule(
  UUID, UUID, JSONB, JSONB, JSONB, JSONB, UUID[]
);

CREATE OR REPLACE FUNCTION public.commit_schedule(
  p_festival_edition_id  UUID,
  p_user_id              UUID,
  p_watermark            TEXT,   -- from diff-schedule's Analyse response, unchanged
  p_artists_to_create    JSONB,   -- [{ name, slug }]
  p_stages_to_create     JSONB,   -- [{ name }]
  p_sets_to_create       JSONB,   -- [{ name, description, stageName, timeStart, timeEnd, artistSlugs }]
  p_sets_to_update       JSONB,   -- [{ id, name, description, stageName, timeStart, timeEnd, artistSlugs }]
  p_set_ids_to_archive   UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_sets_created    INT;
  v_sets_updated    INT;
  v_sets_archived   INT;
  v_current_watermark TEXT;
BEGIN
  v_current_watermark := commit_schedule__compute_watermark(p_festival_edition_id);

  IF v_current_watermark IS DISTINCT FROM p_watermark THEN
    RAISE EXCEPTION
      'The schedule changed since this review was generated. Start over to re-run Analyse against the latest data -- nothing from this review was applied.';
  END IF;

  PERFORM commit_schedule__upsert_artists(p_artists_to_create, p_user_id);
  PERFORM commit_schedule__upsert_stages(p_festival_edition_id, p_stages_to_create);

  v_sets_updated  := commit_schedule__update_sets(
    p_festival_edition_id, p_sets_to_update
  );
  v_sets_created  := commit_schedule__create_sets(
    p_festival_edition_id, p_user_id, p_sets_to_create
  );
  v_sets_archived := commit_schedule__archive_sets(
    p_festival_edition_id, p_set_ids_to_archive
  );

  RETURN jsonb_build_object(
    'setsCreated', v_sets_created,
    'setsUpdated', v_sets_updated,
    'setsArchived', v_sets_archived
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.commit_schedule__compute_watermark(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.commit_schedule(UUID, UUID, TEXT, JSONB, JSONB, JSONB, JSONB, UUID[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.commit_schedule__compute_watermark(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_schedule(UUID, UUID, TEXT, JSONB, JSONB, JSONB, JSONB, UUID[]) TO service_role;
