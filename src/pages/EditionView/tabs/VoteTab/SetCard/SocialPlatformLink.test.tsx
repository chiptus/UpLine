import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SocialPlatformLink } from "./SocialPlatformLink";

describe("SocialPlatformLink", () => {
  it("tints the SoundCloud logo with SoundCloud orange", () => {
    render(
      <SocialPlatformLink
        url="https://soundcloud.com/some-artist"
        artistName="Some Artist"
      />,
    );

    const logo = screen.getByTestId("tinted-platform-logo");
    expect(logo.style.backgroundColor).toBe("rgb(255, 85, 0)");
    expect(screen.getByLabelText("SoundCloud logo")).toBe(logo);
  });

  it("renders the Spotify logo as a plain image", () => {
    render(
      <SocialPlatformLink
        url="https://open.spotify.com/artist/1"
        artistName="Some Artist"
      />,
    );

    expect(screen.getByAltText("Spotify logo")).toBeTruthy();
    expect(screen.queryByTestId("tinted-platform-logo")).toBeNull();
  });
});
