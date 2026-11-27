import { describe, expect, it } from "vitest";
import { getSocialPlatformLogo } from "./SocialPlatformUtils";

describe("getSocialPlatformLogo", () => {
  it("recolors the SoundCloud logo to orange", () => {
    const info = getSocialPlatformLogo("https://soundcloud.com/some-artist");

    expect(info?.logoFilter).toContain("hue-rotate");
  });

  it("leaves the Spotify logo unfiltered", () => {
    const info = getSocialPlatformLogo("https://open.spotify.com/artist/1");

    expect(info?.logoFilter).toBeUndefined();
  });
});
