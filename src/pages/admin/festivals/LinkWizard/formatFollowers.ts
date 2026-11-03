export function formatFollowers(followers: number): string {
  return followers < 1000
    ? followers.toString()
    : `${(followers / 1000).toFixed(1)}k`;
}
