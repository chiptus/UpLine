import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface ConflictingSet {
  id: string;
  name: string;
  slug: string;
  time_start: string | null;
  time_end: string | null;
}

interface ConflictsWarningProps {
  conflictingSets: ConflictingSet[];
  currentSetName: string;
}

export function ConflictsWarning({
  conflictingSets,
  currentSetName,
}: ConflictsWarningProps) {
  if (conflictingSets.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Schedule Conflict Detected</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          {currentSetName} overlaps with{" "}
          {conflictingSets.length === 1
            ? "this set"
            : `${conflictingSets.length} other sets`}
          :
        </p>
        <ul className="list-disc list-inside space-y-1">
          {conflictingSets.map((set) => (
            <li key={set.id}>
              <Link
                to={`/sets/${set.slug}`}
                className="underline hover:text-white"
              >
                {set.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm">
          You may need to choose between overlapping sets.
        </p>
      </AlertDescription>
    </Alert>
  );
}
