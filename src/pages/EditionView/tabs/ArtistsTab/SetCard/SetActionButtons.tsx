import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { SetVotingButtons } from "./SetVotingButtons";
import { SetRatingButtons } from "./SetRatingButtons";

interface SetActionButtonsProps {
  size?: "sm" | "default";
  layout?: "horizontal" | "vertical";
}

export function SetActionButtons(props: SetActionButtonsProps) {
  const { phase } = useFestivalPhase();

  if (phase === "post-festival") {
    return <SetRatingButtons {...props} />;
  }

  return <SetVotingButtons {...props} />;
}
