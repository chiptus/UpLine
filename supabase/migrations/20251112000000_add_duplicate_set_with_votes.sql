-- Function to duplicate a set with its votes
-- This is used during CSV import when multiple sets for the same artist need to be created
-- from a single existing set that has votes
CREATE OR REPLACE FUNCTION duplicate_set_with_votes(
  source_set_id uuid,
  new_time_start timestamp with time zone,
  new_time_end timestamp with time zone
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_set_id uuid;
  source_set record;
BEGIN
  -- Get the source set details
  SELECT * INTO source_set
  FROM sets
  WHERE id = source_set_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source set not found: %', source_set_id;
  END IF;

  -- Create the new set with updated times
  INSERT INTO sets (
    name,
    slug,
    stage_id,
    festival_edition_id,
    time_start,
    time_end,
    description,
    archived,
    created_by
  )
  VALUES (
    source_set.name,
    source_set.slug,
    source_set.stage_id,
    source_set.festival_edition_id,
    new_time_start,
    new_time_end,
    source_set.description,
    source_set.archived,
    source_set.created_by
  )
  RETURNING id INTO new_set_id;

  -- Copy set_artists links
  INSERT INTO set_artists (set_id, artist_id)
  SELECT new_set_id, artist_id
  FROM set_artists
  WHERE set_id = source_set_id;

  -- Duplicate all votes from the source set to the new set
  INSERT INTO votes (user_id, set_id, vote_type, group_id, created_at)
  SELECT user_id, new_set_id, vote_type, group_id, created_at
  FROM votes
  WHERE set_id = source_set_id;

  RETURN new_set_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION duplicate_set_with_votes(uuid, timestamp with time zone, timestamp with time zone) TO authenticated;
