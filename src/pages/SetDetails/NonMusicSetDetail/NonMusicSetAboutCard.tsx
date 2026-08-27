import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { FestivalSet } from "@/api/sets/types";
import { MarkdownText } from "@/components/ui/markdown-text";

interface NonMusicSetAboutCardProps {
  set: FestivalSet;
}

export function NonMusicSetAboutCard({ set }: NonMusicSetAboutCardProps) {
  if (!set.description && !set.external_url) {
    return null;
  }

  return (
    <Card className="bg-surface-raised backdrop-blur-md border">
      <CardHeader>
        <CardTitle className="text-lg">About</CardTitle>
        {set.description && (
          <CardDescription className="text-muted-foreground leading-relaxed">
            <MarkdownText
              content={set.description}
              className="prose-sm prose-invert"
            />
          </CardDescription>
        )}
      </CardHeader>
      {set.external_url && (
        <CardContent>
          <Button asChild variant="outline">
            <a
              href={set.external_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              More info
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
