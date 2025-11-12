-- Update duplicate_set_with_votes function to accept optional stage_id and description
CREATE OR REPLACE FUNCTION duplicate_set_with_votes(
  source_set_id uuid,
  new_time_start timestamp with time zone,
  new_time_end timestamp with time zone,
  new_stage_id uuid DEFAULT NULL,
  new_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_set_id uuid;
  source_set record;
  final_stage_id uuid;
  final_description text;
BEGIN
  -- Get the source set details
  SELECT * INTO source_set
  FROM sets
  WHERE id = source_set_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source set not found: %', source_set_id;
  END IF;

  -- Use provided stage_id if given, otherwise use source set's stage_id
  final_stage_id := COALESCE(new_stage_id, source_set.stage_id);

  -- Use provided description if given, otherwise use source set's description
  final_description := COALESCE(new_description, source_set.description);

  -- Create the new set with updated times and optionally updated stage/description
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
    final_stage_id,
    source_set.festival_edition_id,
    new_time_start,
    new_time_end,
    final_description,
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
  INSERT INTO votes (user_id, set_id, vote_type, created_at)
  SELECT user_id, new_set_id, vote_type, created_at
  FROM votes
  WHERE set_id = source_set_id;

  RETURN new_set_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION duplicate_set_with_votes(uuid, timestamp with time zone, timestamp with time zone, uuid, text) TO authenticated;
