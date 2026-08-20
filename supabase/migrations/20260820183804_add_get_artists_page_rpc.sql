-- Server-side pagination + search + sort for the admin artists table.
-- The previous client-side approach fetched artists unbounded, silently
-- truncated at Supabase's default 1000-row cap, so artists beyond that
-- cap were unreachable through admin search. Genre count is a derived
-- value (join + count), so it can't be a plain `.order()` column --
-- this RPC computes it and allows sorting by it like any other column.
CREATE OR REPLACE FUNCTION public.get_artists_page(
  p_page INT,
  p_page_size INT,
  p_search TEXT DEFAULT NULL,
  p_sort_key TEXT DEFAULT 'created_at',
  p_sort_dir TEXT DEFAULT 'desc'
)
RETURNS TABLE(artist JSONB, genre_ids JSONB, total_count BIGINT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_sort_key NOT IN (
    'name', 'description', 'image_url', 'spotify_url', 'soundcloud_url',
    'created_at', 'genres'
  ) THEN
    RAISE EXCEPTION 'invalid sort key: %', p_sort_key;
  END IF;

  IF p_sort_dir NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'invalid sort direction: %', p_sort_dir;
  END IF;

  RETURN QUERY EXECUTE format(
    $q$
    SELECT to_jsonb(a.*) AS artist,
           COALESCE(g.genre_ids, '[]'::jsonb) AS genre_ids,
           COUNT(*) OVER ()::BIGINT AS total_count
    FROM public.artists a
    LEFT JOIN (
      SELECT artist_id,
             jsonb_agg(music_genre_id) AS genre_ids,
             COUNT(*) AS genre_count
      FROM public.artist_music_genres
      GROUP BY artist_id
    ) g ON g.artist_id = a.id
    WHERE a.archived = false
      AND ($1 IS NULL OR a.name ILIKE '%%' || $1 || '%%')
    ORDER BY %s %s NULLS LAST
    LIMIT $2 OFFSET $3
    $q$,
    -- p_sort_key is whitelisted above, so building the column reference
    -- this way (rather than %I, which can't quote a schema-qualified
    -- "table.column" as one identifier) is safe.
    CASE WHEN p_sort_key = 'genres' THEN 'COALESCE(g.genre_count, 0)' ELSE 'a.' || quote_ident(p_sort_key) END,
    CASE WHEN p_sort_dir = 'asc' THEN 'ASC' ELSE 'DESC' END
  )
  USING p_search, p_page_size, p_page * p_page_size;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_artists_page(INT, INT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_artists_page(INT, INT, TEXT, TEXT, TEXT) TO authenticated;
