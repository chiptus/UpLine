import { TEST_CONFIG } from "../config/test-env";

const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  apikey: TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY}`,
};

// Seeded via supabase/seed.sql: festival "test", edition "2025" ("Boom Festival 2025"),
// stage "Club Stage".
const SEEDED_USER_ID = "11111111-1111-1111-1111-111111111111";
const TEST_EDITION_ID = "e1111111-1111-1111-1111-111111111111";
const CLUB_STAGE_ID = "22222222-2222-2222-2222-22222222222b";

export interface LinkWizardTestArtist {
  artistId: string;
  setId: string;
  artistName: string;
  setDescription: string;
}

// Creates a dedicated artist + set fixture per call (rather than reusing a
// shared seeded row) so link-wizard e2e tests never race each other across
// parallel workers/browser projects. Missing spotify_url (with
// soundcloud_url set) makes the artist's link-wizard step render exactly
// one (Spotify) candidates panel, matching a single set_artists row keeps
// its co-performers section empty.
export async function createLinkWizardTestArtist(): Promise<LinkWizardTestArtist> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const artistName = `E2E Candidate ${suffix}`;
  const setDescription = "Rising star seeded for link-wizard e2e coverage";

  const artistResponse = await fetch(
    `${TEST_CONFIG.SUPABASE_URL}/rest/v1/artists`,
    {
      method: "POST",
      headers: { ...ADMIN_HEADERS, Prefer: "return=representation" },
      body: JSON.stringify({
        name: artistName,
        slug: `e2e-candidate-${suffix}`,
        description: setDescription,
        added_by: SEEDED_USER_ID,
        spotify_url: null,
        soundcloud_url: "https://soundcloud.com/e2e-candidate",
      }),
    },
  );
  if (!artistResponse.ok) {
    throw new Error(
      `Failed to create link-wizard test artist: ${artistResponse.status} ${await artistResponse.text()}`,
    );
  }
  const [artist] = (await artistResponse.json()) as { id: string }[];

  const setResponse = await fetch(`${TEST_CONFIG.SUPABASE_URL}/rest/v1/sets`, {
    method: "POST",
    headers: { ...ADMIN_HEADERS, Prefer: "return=representation" },
    body: JSON.stringify({
      // ArtistSetInfoPanel derives the "{name} - Festival Set" heading from
      // the artist's name, and ArtistSetCard renders this set.name as its
      // own heading — matching the seeded convention (set.name === artist
      // name) keeps both headings showing the same text.
      name: artistName,
      slug: `e2e-candidate-set-${suffix}`,
      festival_edition_id: TEST_EDITION_ID,
      stage_id: CLUB_STAGE_ID,
      time_start: "2025-07-12T23:30:00+00:00",
      time_end: "2025-07-13T01:00:00+00:00",
      description: setDescription,
      created_by: SEEDED_USER_ID,
    }),
  });
  if (!setResponse.ok) {
    throw new Error(
      `Failed to create link-wizard test set: ${setResponse.status} ${await setResponse.text()}`,
    );
  }
  const [set] = (await setResponse.json()) as { id: string }[];

  const setArtistResponse = await fetch(
    `${TEST_CONFIG.SUPABASE_URL}/rest/v1/set_artists`,
    {
      method: "POST",
      headers: { ...ADMIN_HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify({
        set_id: set.id,
        artist_id: artist.id,
        role: "performer",
      }),
    },
  );
  if (!setArtistResponse.ok) {
    throw new Error(
      `Failed to link test artist to set: ${setArtistResponse.status} ${await setArtistResponse.text()}`,
    );
  }

  return { artistId: artist.id, setId: set.id, artistName, setDescription };
}

// Deleting the artist cascades to set_artists but not to the set row itself
// (no FK from sets to artists), so both are deleted explicitly.
export async function deleteLinkWizardTestArtist(
  fixture: LinkWizardTestArtist,
): Promise<void> {
  const setResponse = await fetch(
    `${TEST_CONFIG.SUPABASE_URL}/rest/v1/sets?id=eq.${fixture.setId}`,
    { method: "DELETE", headers: ADMIN_HEADERS },
  );
  if (!setResponse.ok) {
    throw new Error(
      `Failed to delete link-wizard test set: ${setResponse.status} ${await setResponse.text()}`,
    );
  }

  const artistResponse = await fetch(
    `${TEST_CONFIG.SUPABASE_URL}/rest/v1/artists?id=eq.${fixture.artistId}`,
    { method: "DELETE", headers: ADMIN_HEADERS },
  );
  if (!artistResponse.ok) {
    throw new Error(
      `Failed to delete link-wizard test artist: ${artistResponse.status} ${await artistResponse.text()}`,
    );
  }
}
