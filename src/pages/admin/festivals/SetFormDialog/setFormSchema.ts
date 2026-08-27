import { z } from "zod";
import { SET_TYPES } from "@/api/sets/types";

// type is required for new sets only — editing a legacy untyped set doesn't
// force a choice
export function makeSetFormSchema(requireType: boolean) {
  return z.object({
    set_type: z
      .enum(SET_TYPES)
      .nullable()
      .refine((value) => !requireType || value !== null, {
        message: "Type is required",
      }),
    name: z.string().min(1, "Set name is required"),
    description: z.string().optional(),
    external_url: z
      .string()
      .url("Enter a valid URL")
      .or(z.literal(""))
      .optional(),
    stage_id: z.string().optional(),
    time_start: z.string().optional(),
    time_end: z.string().optional(),
    estimated_date: z.string().optional(),
    artist_ids: z.array(z.string()).optional(),
  });
}

export type SetFormData = z.infer<ReturnType<typeof makeSetFormSchema>>;

export const setFormDefaultValues: SetFormData = {
  set_type: null,
  name: "",
  description: "",
  external_url: "",
  stage_id: "none",
  time_start: "",
  time_end: "",
  estimated_date: "",
  artist_ids: [],
};
