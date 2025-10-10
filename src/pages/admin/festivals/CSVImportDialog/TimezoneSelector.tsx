import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimezoneSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function TimezoneSelector({
  value,
  onValueChange,
}: TimezoneSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="timezone-select">Timezone</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="UTC">UTC</SelectItem>
          <SelectItem value="Europe/Lisbon">Lisbon</SelectItem>
          <SelectItem value="Europe/Madrid">Madrid</SelectItem>
          <SelectItem value="Europe/London">London</SelectItem>
          <SelectItem value="Asia/Jerusalem">Jerusalem</SelectItem>
          <SelectItem value="America/New_York">New York</SelectItem>
          <SelectItem value="America/Los_Angeles">Los Angeles</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Select the timezone that the CSV times are in
      </p>
    </div>
  );
}
