import { Card, CardContent } from "@/components/ui/card";
import type { ScheduleSet } from "@/hooks/useScheduleData";
import { SetHeader } from "./SetHeader";
import { TimeDisplay } from "./TimeDisplay";
import { VoteButtons } from "../VoteButtons";

interface SetBlockProps {
  set: ScheduleSet;
  timezone: string;
}

export function SetBlock({ set, timezone }: SetBlockProps) {
  return (
    <Card className="bg-surface-raised backdrop-blur-md border-border hover:border-strong transition-colors">
      <CardContent className="p-3">
        <SetHeader set={set} />

        <div className="space-y-1 text-sm text-muted-foreground">
          {set.startTime && set.endTime && (
            <TimeDisplay
              startTime={set.startTime}
              endTime={set.endTime}
              timezone={timezone}
            />
          )}
        </div>

        <VoteButtons set={set} />
      </CardContent>
    </Card>
  );
}
