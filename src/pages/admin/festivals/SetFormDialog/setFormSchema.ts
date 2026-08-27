import { z } from "zod";

export const setFormSchema = z.object({
  name: z.string().min(1, "Set name is required"),
  description: z.string().optional(),
  stage_id: z.string().optional(),
  time_start: z.string().optional(),
  time_end: z.string().optional(),
  estimated_date: z.string().optional(),
  artist_ids: z.array(z.string()).optional(),
});

export type SetFormData = z.infer<typeof setFormSchema>;
