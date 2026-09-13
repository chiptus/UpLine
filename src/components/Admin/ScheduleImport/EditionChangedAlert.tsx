import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function EditionChangedAlert() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>The schedule changed since this review</AlertTitle>
      <AlertDescription>
        Someone changed this edition's schedule after Analyse ran. Nothing was
        applied — click Start over to re-run Analyse against the latest data.
      </AlertDescription>
    </Alert>
  );
}
