-- The admin artists table doesn't need server-side sort-by-genre-count
-- after all, so the plain PostgREST query builder (search/paginate/sort
-- by column) covers everything and this RPC is no longer needed.
DROP FUNCTION IF EXISTS public.get_artists_page(INT, INT, TEXT, TEXT, TEXT);
