import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { LinkWizardStep } from "./LinkWizardStep";
import type { ArtistWithSets } from "@/api/artists/useArtistsMissingLinksByEdition";
import { registerCleanup, testSupabase } from "@/test/integration/harness";
import { renderWithQueryClient } from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { createArtist } from "@/test/integration/fixtures/artists";
import { SEEDED_USER_ID } from "@/test/integration/fixtures/constants";

async function grantAdminRole(userId: string): Promise<void> {
  const { error } = await testSupabase.from("admin_roles").insert({
    user_id: userId,
    role: "admin",
    created_by: SEEDED_USER_ID,
  });
  if (error) throw error;

  registerCleanup(async () => {
    const { error: deleteError } = await testSupabase
      .from("admin_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");
    if (deleteError) throw deleteError;
  });
}

async function loadArtistWithSets(artistId: string): Promise<ArtistWithSets> {
  const { data, error } = await testSupabase
    .from("artists")
    .select("*")
    .eq("id", artistId)
    .single();
  if (error) throw error;

  return { ...data, artist_music_genres: [], sets: [] };
}

describe("LinkWizardStep save flow", () => {
  it("persists an edited provider URL to Supabase on Save & Next", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);

    const artistId = await createArtist({
      spotify_url: "https://open.spotify.com/artist/old",
      soundcloud_url: "https://soundcloud.com/old",
    });
    const artist = await loadArtistWithSets(artistId);

    const onNext = vi.fn();
    const newSpotifyUrl = "https://open.spotify.com/artist/updated";

    renderWithQueryClient(
      <LinkWizardStep
        artist={artist}
        position={1}
        total={1}
        artists={[artist]}
        onPrev={vi.fn()}
        onNext={onNext}
      />,
    );

    const spotifyInput = await screen.findByLabelText("Spotify URL");
    fireEvent.change(spotifyInput, { target: { value: newSpotifyUrl } });

    fireEvent.click(screen.getByRole("button", { name: /save & next/i }));

    await waitFor(() => expect(onNext).toHaveBeenCalled());

    const { data, error } = await testSupabase
      .from("artists")
      .select("spotify_url")
      .eq("id", artistId)
      .single();

    expect(error).toBeNull();
    expect(data?.spotify_url).toBe(newSpotifyUrl);
  });
});
