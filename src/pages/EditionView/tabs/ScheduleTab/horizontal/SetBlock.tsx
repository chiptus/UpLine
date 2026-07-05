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
    <Card className="bg-white/10 backdrop-blur-md border-purple-400/30 hover:border-purple-400/50 transition-colors">
      <CardContent className="p-3">
        <SetHeader set={set} />

        <div className="space-y-1 text-sm text-purple-200">
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
