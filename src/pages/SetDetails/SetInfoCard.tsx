import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, Music, Play } from "lucide-react";
import { SetVotingButtons } from "./SetVotingButtons";
import { FestivalSet } from "@/hooks/queries/sets/useSets";
import { formatTimeRange } from "@/lib/timeUtils";
import { GenreBadge } from "@/components/GenreBadge";
import { StagePin } from "@/components/StagePin";
import { MarkdownText } from "@/components/ui/markdown-text";

interface SetInfoCardProps {
  set: FestivalSet;
  netVoteScore: number;
  use24Hour?: boolean;
}

export function SetInfoCard({
  set,
  netVoteScore,
  use24Hour = false,
}: SetInfoCardProps) {
  const artist = set.artists[0];
  return (
    <div className="lg:col-span-2">
      <Card className="bg-white/10 backdrop-blur-md border-purple-400/30 h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-white mb-2">
                {set.name}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mb-4">
                {artist.artist_music_genres?.map((genre) => (
                  <GenreBadge
                    key={genre.music_genre_id}
                    genreId={genre.music_genre_id}
                  />
                ))}
                {netVoteScore !== 0 && (
                  <Badge
                    variant="outline"
                    className={`${
                      netVoteScore > 0
                        ? "border-green-400 text-green-400"
                        : "border-red-400 text-red-400"
                    }`}
                  >
                    Score: {netVoteScore > 0 ? "+" : ""}
                    {netVoteScore}
                  </Badge>
                )}
              </div>

              {/* Performance Information */}
              <div className="flex flex-wrap gap-4 mb-4 text-purple-200">
                <StagePin stageId={set.stage_id} />
                {formatTimeRange(set.time_start, set.time_end, use24Hour) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {formatTimeRange(set.time_start, set.time_end, use24Hour)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {(set.description || artist.description) && (
            <CardDescription className="text-purple-200 text-lg leading-relaxed">
              <MarkdownText
                content={set.description || artist.description || ""}
                className="prose-sm prose-invert"
              />
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <SetVotingButtons set={set} />

          {/* External Links */}
          {(artist.spotify_url || artist.soundcloud_url) && (
            <div className="flex flex-wrap gap-4">
              {artist.spotify_url && (
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <a
                    href={artist.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Open in Spotify
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
              {artist.soundcloud_url && (
                <Button asChild className="bg-orange-600 hover:bg-orange-700">
                  <a
                    href={artist.soundcloud_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Open in SoundCloud
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
