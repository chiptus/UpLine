import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SocialPlatformLink } from "./SocialPlatformLink";

describe("SocialPlatformLink", () => {
  it("recolors the SoundCloud logo to orange", () => {
    render(
      <SocialPlatformLink
        url="https://soundcloud.com/some-artist"
        artistName="Some Artist"
      />,
    );

    const logo = screen.getByAltText("SoundCloud logo");
    expect(logo.style.filter).toContain("hue-rotate");
  });

  it("leaves the Spotify logo unfiltered", () => {
    render(
      <SocialPlatformLink
        url="https://open.spotify.com/artist/1"
        artistName="Some Artist"
      />,
    );

    expect(screen.getByAltText("Spotify logo").style.filter).toBe("");
  });
});
