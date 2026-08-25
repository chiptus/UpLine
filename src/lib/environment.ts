export function isStagingEnv(): boolean {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") return false;

  return !hostname.includes("getupline.com");
}
