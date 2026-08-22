import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useArtistSetsByEditionQuery } from "@/api/sets/useArtistSetsByEditionQuery";
import type { Artist } from "@/api/artists/types";

interface ArtistSetInfoPanelProps {
  artist: Artist;
  editionId: string;
}

export function ArtistSetInfoPanel({
  artist,
  editionId,
}: ArtistSetInfoPanelProps) {
  const setsQuery = useArtistSetsByEditionQuery(artist.id, editionId);

  if (setsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">
            Loading set information...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (setsQuery.isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-destructive">
            Failed to load set information
          </p>
        </CardContent>
      </Card>
    );
  }

  const sets = setsQuery.data ?? [];

  if (sets.length === 0) {
    return null;
  }

  return (
    <Card className="bg-slate-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {artist.name} - Festival Set{sets.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sets.map((set) => (
          <div key={set.id} className="border-l-2 border-primary pl-4 py-2">
            <div className="space-y-2">
              <div>
                <h4 className="font-semibold text-sm">{set.name}</h4>
                {set.stage_name && (
                  <p className="text-xs text-muted-foreground">
                    Stage: {set.stage_name}
                  </p>
                )}
              </div>

              {set.time_start && (
                <div className="text-xs text-muted-foreground">
                  <span>
                    {new Date(set.time_start).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {set.time_end && (
                    <>
                      <span> - </span>
                      <span>
                        {new Date(set.time_end).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </>
                  )}
                </div>
              )}

              {set.description && (
                <p className="text-xs text-muted-foreground">
                  {set.description}
                </p>
              )}

              {set.co_performers.length > 0 &&
                (() => {
                  const otherPerformers = set.co_performers.filter(
                    (cp) => cp.artist_id !== artist.id,
                  );

                  return (
                    <div className="pt-2">
                      <p className="text-xs font-medium mb-1">Co-performers:</p>
                      <div className="flex flex-wrap gap-1">
                        {otherPerformers.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            No other co-performers
                          </span>
                        ) : (
                          otherPerformers.map((coPerformer) => (
                            <Badge
                              key={coPerformer.artist_id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {coPerformer.artist_name}
                              {coPerformer.role && ` (${coPerformer.role})`}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
