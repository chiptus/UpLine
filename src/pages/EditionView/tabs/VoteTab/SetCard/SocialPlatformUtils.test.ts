import { describe, expect, it } from "vitest";
import { getSocialPlatformLogo } from "./SocialPlatformUtils";

describe("getSocialPlatformLogo", () => {
  it("puts the SoundCloud logo on SoundCloud's orange", () => {
    const info = getSocialPlatformLogo("https://soundcloud.com/some-artist");

    expect(info?.color).toContain("bg-[#ff5500]");
  });

  it("keeps the Spotify button on the neutral background", () => {
    const info = getSocialPlatformLogo("https://open.spotify.com/artist/1");

    expect(info?.color).not.toContain("bg-");
  });
});
