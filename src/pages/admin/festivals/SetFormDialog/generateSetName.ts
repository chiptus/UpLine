export interface NamedArtist {
  id: string;
  name: string;
}

export function generateSetName(
  artists: NamedArtist[],
  artistIds: string[],
): string {
  const selectedArtists = artists.filter((artist) =>
    artistIds.includes(artist.id),
  );
  const artistNames = selectedArtists.map((artist) => artist.name);

  if (artistNames.length === 0) return "";
  if (artistNames.length === 1) return artistNames[0];
  if (artistNames.length === 2) return `${artistNames[0]} vs ${artistNames[1]}`;
  return `${artistNames[0]} + ${artistNames.length - 1} more`;
}
