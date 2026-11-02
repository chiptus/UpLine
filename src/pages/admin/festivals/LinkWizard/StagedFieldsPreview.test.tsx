import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { withTestQuery } from "@/test/withTestQuery";
import { withSuspense } from "@/test/withSuspense";
import { StagedFieldsPreview } from "./StagedFieldsPreview";
import type { LinkStepData } from "./LinkWizardStep";

const SOUNDCLOUD_URL = "https://soundcloud.com/artist";

describe("StagedFieldsPreview", () => {
  it("shows the staged SoundCloud follower count", () => {
    renderPreview({
      providerUrl: { soundcloud: SOUNDCLOUD_URL },
      soundcloud_followers: { url: SOUNDCLOUD_URL, count: 4200 },
    });

    expect(screen.getByText("SoundCloud followers: 4.2k")).toBeInTheDocument();
  });

  it("hides the count once the SoundCloud URL no longer matches", () => {
    renderPreview({
      providerUrl: { soundcloud: "https://soundcloud.com/other" },
      soundcloud_followers: { url: SOUNDCLOUD_URL, count: 4200 },
    });

    expect(screen.queryByText(/SoundCloud followers/)).not.toBeInTheDocument();
  });

  it("hides the count when none is staged", () => {
    renderPreview({ providerUrl: { soundcloud: SOUNDCLOUD_URL } });

    expect(screen.queryByText(/SoundCloud followers/)).not.toBeInTheDocument();
  });
});

function renderPreview(values: Partial<LinkStepData>) {
  function Harness() {
    const form = useForm<LinkStepData>({
      defaultValues: { providerUrl: {}, ...values },
    });
    return (
      <Form {...form}>
        <StagedFieldsPreview form={form} onSelectCandidate={vi.fn()} />
      </Form>
    );
  }
  const TestHarness = withSuspense(withTestQuery(Harness));
  render(<TestHarness />);
}
