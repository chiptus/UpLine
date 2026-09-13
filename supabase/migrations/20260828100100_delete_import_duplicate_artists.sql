-- Re-imports duplicated existing artists: the diff missed them (1000-row
-- fetch cap), the commit re-inserted them, and artists_dedupe_slug renamed
-- the collisions to "<slug>-2", "<slug>-3", ... Set rosters resolve by the
-- base slug, so the duplicates were never referenced by anything. Delete a
-- suffixed artist only when an artist with the base slug and the exact same
-- name exists AND nothing references the duplicate.
DELETE FROM public.artists dup
WHERE dup.slug ~ '-[0-9]+$'
  AND EXISTS (
    SELECT 1 FROM public.artists base
    WHERE base.slug = regexp_replace(dup.slug, '-[0-9]+$', '')
      AND base.name = dup.name
      AND base.id <> dup.id
  )
  AND NOT EXISTS (SELECT 1 FROM public.set_artists sa WHERE sa.artist_id = dup.id)
  AND NOT EXISTS (SELECT 1 FROM public.artist_notes n WHERE n.artist_id = dup.id)
  AND NOT EXISTS (SELECT 1 FROM public.artist_knowledge k WHERE k.artist_id = dup.id)
  AND NOT EXISTS (SELECT 1 FROM public.artist_music_genres g WHERE g.artist_id = dup.id)
  AND NOT EXISTS (SELECT 1 FROM public.soundcloud sc WHERE sc.artist_id = dup.id);
