import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { RevealLevel } from "@/lib/scheduleReveal";

const LEVEL_DESCRIPTION: Record<RevealLevel, string> = {
  draft: "draft (not visible to the public)",
  days: "days revealed",
  stages: "stages revealed",
  full: "full schedule revealed",
};

type Props = {
  level: RevealLevel;
  setsToCreate: number;
  setsToUpdate: number;
  setsToArchive: number;
};

export function LiveCommitWarning({
  level,
  setsToCreate,
  setsToUpdate,
  setsToArchive,
}: Props) {
  if (level === "draft") return null;
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Schedule is {LEVEL_DESCRIPTION[level]}.</AlertTitle>
      <AlertDescription>
        Committing will update what the public sees immediately: {setsToCreate}{" "}
        new · {setsToUpdate} updated · {setsToArchive} archived.
      </AlertDescription>
    </Alert>
  );
}
