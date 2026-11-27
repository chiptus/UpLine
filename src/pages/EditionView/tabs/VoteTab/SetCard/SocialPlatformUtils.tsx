import socialPlatformLogos from "./social-platform-logos.json";

/**
 * The logo asset is a black cross-origin SVG: text color can't recolor it and
 * a CSS mask would need CORS headers, so a filter chain approximates #ff5500.
 */
const SOUNDCLOUD_ORANGE_FILTER =
  "brightness(0) saturate(100%) invert(36%) sepia(99%) saturate(3300%) hue-rotate(2deg) brightness(103%)";

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
      logoFilter: SOUNDCLOUD_ORANGE_FILTER,
    };
  }
  return null;
}
