import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VotingActions } from "./VotingActions";
import { VOTE_CONFIG } from "@/lib/voteConfig";

describe("VotingActions", () => {
  it("shows no button as pressed when there is no vote yet", () => {
    render(<VotingActions onVote={vi.fn()} onSkip={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: VOTE_CONFIG.mustGo.label }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: VOTE_CONFIG.interested.label }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: VOTE_CONFIG.wontGo.label }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("marks the Must Go button as pressed when currentVote matches it", () => {
    render(
      <VotingActions
        onVote={vi.fn()}
        onSkip={vi.fn()}
        currentVote={VOTE_CONFIG.mustGo.value}
      />,
    );

    expect(
      screen.getByRole("button", { name: VOTE_CONFIG.mustGo.label }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: VOTE_CONFIG.interested.label }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("marks the Interested button as pressed when currentVote matches it", () => {
    render(
      <VotingActions
        onVote={vi.fn()}
        onSkip={vi.fn()}
        currentVote={VOTE_CONFIG.interested.value}
      />,
    );

    expect(
      screen.getByRole("button", { name: VOTE_CONFIG.interested.label }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onVote with the corresponding vote value when a vote button is clicked", async () => {
    const user = userEvent.setup();
    const onVote = vi.fn();
    render(<VotingActions onVote={onVote} onSkip={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: VOTE_CONFIG.mustGo.label }),
    );

    expect(onVote).toHaveBeenCalledWith(VOTE_CONFIG.mustGo.value);
  });

  it("calls onSkip when the Skip button is clicked", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(<VotingActions onVote={vi.fn()} onSkip={onSkip} />);

    await user.click(screen.getByRole("button", { name: "Skip" }));

    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
