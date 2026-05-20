import { CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type CommitResult } from "@/services/scheduleImport/types";

type Props = {
  result: CommitResult;
  onReset: () => void;
};

export function CommitResultCard({ result, onReset }: Props) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3 text-green-600">
          <CheckCircle2 className="h-6 w-6" />
          <span className="font-medium">Schedule imported successfully</span>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            {result.setsCreated} set{result.setsCreated !== 1 ? "s" : ""}{" "}
            created
          </li>
          <li>
            {result.setsUpdated} set{result.setsUpdated !== 1 ? "s" : ""}{" "}
            updated
          </li>
          {result.setsArchived > 0 && (
            <li>
              {result.setsArchived} set{result.setsArchived !== 1 ? "s" : ""}{" "}
              archived
            </li>
          )}
        </ul>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Import another file
        </Button>
      </CardContent>
    </Card>
  );
}
