import socialPlatformLogos from "./social-platform-logos.json";

const SOUNDCLOUD_ORANGE = "#ff5500";

export function getSocialPlatformLogo(url: string) {
  if (url.includes("spotify.com")) {
    return {
      logo: socialPlatformLogos.spotify.logo,
      platform: "Spotify",
      color: "text-green-400 hover:text-green-300",
    };
  }
  if (url.includes("soundcloud.com")) {
    return {
      logo: socialPlatformLogos.soundcloud.logo,
      platform: "SoundCloud",
      color: "text-orange-400 hover:text-orange-300",
      // The logo asset is a black SVG, which text color can't recolor
      tint: SOUNDCLOUD_ORANGE,
    };
  }
  return null;
}
