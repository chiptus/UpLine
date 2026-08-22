import { Music, Users, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmptyArtistsState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="bg-surface-raised backdrop-blur-md border max-w-md mx-auto text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Music className="h-16 w-16 text-accent" />
              <Sparkles className="h-6 w-6 text-notice absolute -top-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-foreground text-2xl">
            No Artists Yet
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Be the first to add artists to the Boom Festival voting list!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-accent" />
              <span>Connect with fellow festival-goers</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Music className="h-4 w-4 text-accent" />
              <span>Discover new electronic artists</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Vote for your favorites</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
