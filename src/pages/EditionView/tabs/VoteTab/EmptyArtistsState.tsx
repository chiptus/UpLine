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
      <Card className="bg-white/10 backdrop-blur-md border-purple-400/30 max-w-md mx-auto text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Music className="h-16 w-16 text-purple-400" />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-white text-2xl">No Artists Yet</CardTitle>
          <CardDescription className="text-purple-200">
            Be the first to add artists to the Boom Festival voting list!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-purple-200">
              <Users className="h-4 w-4 text-purple-400" />
              <span>Connect with fellow festival-goers</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-purple-200">
              <Music className="h-4 w-4 text-purple-400" />
              <span>Discover new electronic artists</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-purple-200">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Vote for your favorites</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
