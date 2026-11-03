import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/ui/form";
import { ScheduleRevealLevelField } from "../ScheduleRevealLevelField";
import type { EditionFormData } from "./editionFormSchema";

export function EditionRevealLevelField() {
  const form = useFormContext<EditionFormData>();
  const published = form.watch("published");

  return (
    <FormField
      control={form.control}
      name="schedule_reveal_level"
      render={({ field }) => (
        <ScheduleRevealLevelField
          value={field.value}
          onChange={field.onChange}
          editionPublished={published}
        />
      )}
    />
  );
}
