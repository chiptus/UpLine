import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LinkWizardStep } from "./LinkWizardStep";
import type { ArtistWithSets } from "@/api/artists/useArtistsMissingLinksByEdition";
import {
  renderWithQueryClient,
  testSupabase,
} from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { createArtist } from "@/test/integration/fixtures/artists";
import { grantAdminRole } from "@/test/integration/fixtures/adminRoles";

// The Link Wizard's Edge Functions aren't served by the integration test
// stack, so their responses are stubbed at the fetch boundary. Hoisted so it
// is in place before the app's Supabase client captures `fetch`. Requests
// to anything else still reach the real local Supabase.
vi.hoisted(() => {
  const realFetch = globalThis.fetch;
  const candidate = {
    name: "Candidate Artist",
    url: "https://open.spotify.com/artist/candidate",
    imageUrl: null,
    description: null,
    followers: null,
    genres: [],
  };
  const fetchedCandidate = {
    name: "Fetched Artist",
    url: "https://open.spotify.com/artist/fetched123",
    imageUrl: "https://example.com/image.jpg",
    description: "A fetched artist description",
    followers: 1000,
    genres: ["Electronic"],
  };

  globalThis.fetch = async function stubbedFetch(input, init) {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};

    if (url.includes("/functions/v1/search-artist-links")) {
      // Results are matched to the wizard's artist by name, so echo the
      // requested names back.
      const artistNames: string[] = body.artistNames ?? [];
      return jsonResponse({
        results: artistNames.map((artistName) => ({
          artistName,
          provider: "spotify",
          candidates: [candidate],
        })),
      });
    }
    if (url.includes("/functions/v1/fetch-artist-by-url")) {
      return jsonResponse({ candidate: fetchedCandidate });
    }
    return realFetch(input, init);
  };

  function jsonResponse(payload: unknown) {
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});

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

  it("stages the fetched candidate for the user to select fields from", async () => {
    const user = userEvent.setup();
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

    const spotifyUrlInput = screen.getByRole("textbox", {
      name: /spotify url/i,
    });
    await user.type(
      spotifyUrlInput,
      "https://open.spotify.com/artist/fetched123",
    );

    const fetchButton = screen.getByRole("button", {
      name: /fetch spotify artist metadata from url/i,
    });
    await user.click(fetchButton);

    const fetchedCandidateCard = await screen.findByRole("listitem", {
      name: "Fetched Artist",
    });

    // Fetching only stages the candidate; nothing should be applied yet.
    expect(
      screen.queryByRole("img", { name: "Staged artist image" }),
    ).not.toBeInTheDocument();

    await user.click(
      within(fetchedCandidateCard).getByRole("button", {
        name: /select all/i,
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: "Staged artist image" }),
      ).toHaveAttribute("src", "https://example.com/image.jpg");
    });

    await user.click(screen.getByRole("button", { name: /save & next/i }));

    await waitFor(() => expect(onNext).toHaveBeenCalled());

    const { data, error } = await testSupabase
      .from("artists")
      .select("spotify_url")
      .eq("id", artistId)
      .single();

    expect(error).toBeNull();
    expect(data?.spotify_url).toBe(
      "https://open.spotify.com/artist/fetched123",
    );
  });

  it("shows error when pasted Spotify URL is invalid", async () => {
    const user = userEvent.setup();
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

    const spotifyUrlInput = screen.getByRole("textbox", {
      name: /spotify url/i,
    });
    await user.type(spotifyUrlInput, "https://spotify.com/artist/invalid");

    const fetchButton = screen.getByRole("button", {
      name: /fetch spotify artist metadata from url/i,
    });

    await waitFor(() => expect(fetchButton).toBeDisabled());
  });
});
