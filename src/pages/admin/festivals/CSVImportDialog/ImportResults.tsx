import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ImportResult } from "@/services/csv/types";

interface ImportResultsProps {
  results: ImportResult[];
}

export function ImportResults({ results }: ImportResultsProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      {results.map((result, index) => {
        const hasErrors = result.errors && result.errors.length > 0;
        return (
          <Card
            key={index}
            className={
              hasErrors
                ? "border-destructive"
                : result.success
                  ? "border-green-500"
                  : "border-yellow-500"
            }
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-2">
                {hasErrors || !result.success ? (
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <CardTitle className="text-base">
                    {result.success ? "Success" : "Failed"}
                  </CardTitle>
                  <CardDescription>{result.message}</CardDescription>
                </div>
              </div>
            </CardHeader>
            {hasErrors && (
              <CardContent className="pt-0">
                <div className="rounded-md bg-destructive/10 p-4">
                  <h4 className="text-sm font-semibold mb-2 text-destructive">
                    Errors ({result.errors!.length}):
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {result.errors!.map((error, errorIndex) => (
                      <li
                        key={errorIndex}
                        className="flex gap-2 text-muted-foreground"
                      >
                        <span className="text-destructive">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
