import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { LinkWizardStep } from "./LinkWizardStep";
import type { ArtistWithSets } from "@/api/artists/useArtistsMissingLinksByEdition";
import {
  registerCleanup,
  renderWithQueryClient,
  testSupabase,
} from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { createArtist } from "@/test/integration/fixtures/artists";
import { SEEDED_USER_ID } from "@/test/integration/fixtures/constants";

// The Link Wizard's candidate search hits a search-links Edge Function that
// the integration test stack doesn't serve. This test isolates the save
// path it's targeting by stubbing search results instead.
vi.mock("@/api/artistSearch/useSearchArtistLinksQuery", () => ({
  useSearchArtistLinksQuery: (artistNames: string[]) => ({
    data: artistNames.length
      ? {
          results: artistNames.map((artistName) => ({
            artistName,
            provider: "spotify" as const,
            candidates: [
              {
                name: "Candidate Artist",
                url: "https://open.spotify.com/artist/candidate",
                imageUrl: null,
                description: null,
                followers: null,
                genres: [],
              },
            ],
          })),
        }
      : undefined,
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

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
  it("persists a candidate-selected provider URL on Save & Next", async () => {
    // Regression test for a bug where selecting a link from the search
    // candidates (via form.setValue(..., { shouldDirty: true })) never
    // flipped react-hook-form's isDirty flag, so LinkWizardStep's
    // `if (!form.formState.isDirty)` guard treated the submit as a no-op
    // and just advanced to the next artist without saving anything.
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);

    const artistId = await createArtist({
      spotify_url: null,
      soundcloud_url: "https://soundcloud.com/existing",
    });
    const artist = await loadArtistWithSets(artistId);

    const onNext = vi.fn();

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

    const selectUrlButton = await screen.findByRole("button", {
      name: "URL",
    });
    fireEvent.click(selectUrlButton);

    fireEvent.click(screen.getByRole("button", { name: /save & next/i }));

    await waitFor(() => expect(onNext).toHaveBeenCalled());

    const { data, error } = await testSupabase
      .from("artists")
      .select("spotify_url")
      .eq("id", artistId)
      .single();

    expect(error).toBeNull();
    expect(data?.spotify_url).toBe("https://open.spotify.com/artist/candidate");
  });

  it("fetches artist metadata from pasted Spotify URL", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);

    const artistId = await createArtist({
      spotify_url: null,
      soundcloud_url: null,
    });
    const artist = await loadArtistWithSets(artistId);

    vi.mock("@/api/artistSearch/useFetchArtistByUrlMutation", () => ({
      useFetchArtistByUrlMutation: () => ({
        mutate: (
          params: { provider: string; artistId?: string },
          callbacks: { onSuccess: (data: unknown) => void },
        ) => {
          if (params.provider === "spotify" && params.artistId) {
            callbacks.onSuccess({
              results: [
                {
                  artistName: "",
                  provider: "spotify",
                  candidates: [
                    {
                      name: "Fetched Artist",
                      url: "https://open.spotify.com/artist/fetched123",
                      imageUrl: "https://example.com/image.jpg",
                      description: "A fetched artist description",
                      followers: 1000,
                      genres: ["Electronic"],
                    },
                  ],
                },
              ],
            });
          }
        },
        isPending: false,
      }),
    }));

    const onNext = vi.fn();

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

    const spotifyUrlInput = screen.getByDisplayValue("");
    fireEvent.change(spotifyUrlInput, {
      target: { value: "https://open.spotify.com/artist/fetched123" },
    });

    const downloadButtons = screen.getAllByRole("button", { name: "" });
    const fetchButton = downloadButtons.find(
      (btn) => btn.querySelector("svg") && btn.innerHTML.includes("Download"),
    );
    if (fetchButton) fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("https://example.com/image.jpg"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save & next/i }));

    await waitFor(() => expect(onNext).toHaveBeenCalled());
  });

  it("shows error when pasted Spotify URL is invalid", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);

    const artistId = await createArtist({
      spotify_url: null,
      soundcloud_url: null,
    });
    const artist = await loadArtistWithSets(artistId);

    const onNext = vi.fn();

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

    const spotifyUrlInput = screen.getByDisplayValue("");
    fireEvent.change(spotifyUrlInput, {
      target: { value: "https://spotify.com/artist/invalid" },
    });

    const downloadButtons = screen.getAllByRole("button", { name: "" });
    const fetchButton = downloadButtons.find(
      (btn) => btn.querySelector("svg") && btn.innerHTML.includes("Download"),
    );

    expect(fetchButton).toBeDisabled();
  });
});
