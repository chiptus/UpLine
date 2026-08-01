import socialPlatformLogos from "./social-platform-logos.json";

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
    };
  }
  return null;
}
