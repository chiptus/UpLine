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
      // The logo asset is black, so it needs SoundCloud's orange tile behind it
      // to be visible and on-brand.
      color: "bg-[#ff5500] hover:bg-[#ff7733]",
    };
  }
  return null;
}
