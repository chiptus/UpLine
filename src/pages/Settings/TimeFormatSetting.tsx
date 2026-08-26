import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProfileFieldMutation } from "@/api/groups/useProfileFieldMutation";

export function TimeFormatSetting({
  userId,
  use24Hour,
}: {
  userId: string;
  use24Hour: boolean;
}) {
  const mutation = useProfileFieldMutation();

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">Time format</h2>
      <p className="mb-3 text-xs text-subtle-foreground">
        How set times are displayed on the Explore page.
      </p>
      <div className="flex items-center gap-2">
        <Label
          htmlFor="use-24-hour"
          className={
            use24Hour
              ? "text-sm text-subtle-foreground"
              : "text-sm font-medium text-foreground"
          }
        >
          12-hour
        </Label>
        <Switch
          id="use-24-hour"
          checked={use24Hour}
          onCheckedChange={setUse24Hour}
        />
        <Label
          htmlFor="use-24-hour"
          className={
            use24Hour
              ? "text-sm font-medium text-foreground"
              : "text-sm text-subtle-foreground"
          }
        >
          24-hour
        </Label>
      </div>
    </div>
  );

  function setUse24Hour(value: boolean) {
    mutation.mutate({
      userId,
      column: "use_24_hour",
      value,
      errorMessage: "Failed to update time format",
    });
  }
}
