type Provider = "spotify" | "soundcloud";

function validateSpotifyUrl(trimmedUrl: string): boolean {
  try {
    const parsed = new URL(trimmedUrl);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "open.spotify.com"
    ) {
      return false;
    }
    return /^\/artist\/[^/]+\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

function validateSoundcloudUrl(trimmedUrl: string): boolean {
  try {
    const parsed = new URL(trimmedUrl);
    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname.endsWith("soundcloud.com")
    ) {
      return false;
    }
    return /^\/[^/]+$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

const providerUrlValidators: Record<Provider, (trimmedUrl: string) => boolean> =
  {
    spotify: validateSpotifyUrl,
    soundcloud: validateSoundcloudUrl,
  };

export function validateProviderUrl(provider: Provider, url: string): boolean {
  if (!url || !url.trim()) {
    return false;
  }

  return providerUrlValidators[provider](url.trim());
}
