import { describe, expect, it } from "vitest";
import { buildSetFormSchema } from "./SetFormDialog";

const baseData = {
  set_type: null,
  name: "Morning Yoga",
  description: "",
  external_url: "",
  stage_id: "none",
  time_start: "",
  time_end: "",
  estimated_date: "",
  artist_ids: [],
};

describe("buildSetFormSchema", () => {
  it("rejects a new set without a type", () => {
    const result = buildSetFormSchema(true).safeParse(baseData);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Type is required");
  });

  it("accepts a new set with a type", () => {
    const result = buildSetFormSchema(true).safeParse({
      ...baseData,
      set_type: "workshop",
    });
    expect(result.success).toBe(true);
  });

  it("accepts editing a legacy untyped set", () => {
    const result = buildSetFormSchema(false).safeParse(baseData);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid external URL", () => {
    const result = buildSetFormSchema(false).safeParse({
      ...baseData,
      external_url: "not a url",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Enter a valid URL");
  });

  it("accepts an empty or valid external URL", () => {
    expect(buildSetFormSchema(false).safeParse(baseData).success).toBe(true);
    expect(
      buildSetFormSchema(false).safeParse({
        ...baseData,
        external_url: "https://example.com/signup",
      }).success,
    ).toBe(true);
  });
});
