import { describe, expect, it } from "vitest";
import { infoTabEnabled } from "./infoTabEnabled";
import { CustomLink } from "@/api/custom-links/types";

function makeLink(overrides: Partial<CustomLink> = {}): CustomLink {
  return {
    id: "1",
    festival_id: "f1",
    title: "Link",
    url: "https://example.com",
    display_order: 0,
    link_type: "custom",
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe("infoTabEnabled", () => {
  it("is enabled when info_text is present", () => {
    expect(
      infoTabEnabled({ festivalInfo: { info_text: "hello" } as never }),
    ).toBe(true);
  });

  it("is enabled when a tickets link exists", () => {
    expect(
      infoTabEnabled({
        customLinks: [makeLink({ link_type: "tickets" })],
      }),
    ).toBe(true);
  });

  it("is enabled when a website link exists", () => {
    expect(
      infoTabEnabled({
        customLinks: [makeLink({ link_type: "website" })],
      }),
    ).toBe(true);
  });

  it("is disabled for a custom link that is not tickets or website", () => {
    expect(
      infoTabEnabled({
        customLinks: [makeLink({ link_type: "custom" })],
      }),
    ).toBe(false);
  });

  it("is disabled when there is no info text, no social links, and no custom links", () => {
    expect(infoTabEnabled({})).toBe(false);
  });
});
