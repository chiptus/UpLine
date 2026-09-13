import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  message: string;
};

export function CommitFailedAlert({ message }: Props) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Import failed — no changes were saved.</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
