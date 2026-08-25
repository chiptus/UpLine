import { Star, Heart, X } from "lucide-react";

export const VOTES_TYPES = ["mustGo", "interested", "wontGo"] as const;
export type VoteType = (typeof VOTES_TYPES)[number];

export const VOTE_CONFIG = {
  mustGo: {
    value: 2,
    label: "Must Go",
    icon: Star,
    bgColor: "bg-vote-must-soft",
    iconColor: "text-vote-must",
    textColor: "text-vote-must-foreground",
    descColor: "text-vote-must-foreground",
    circleColor: "bg-vote-must",
    buttonSelected: "bg-vote-must text-background hover:bg-vote-must/90",
    buttonUnselected:
      "border-vote-must-foreground text-vote-must-foreground hover:bg-vote-must-foreground hover:text-background",
    spinnerColor: "border-vote-must-foreground",
    description: "Artists you absolutely can't miss (+2 points)",
  },
  interested: {
    value: 1,
    label: "Interested",
    icon: Heart,
    bgColor: "bg-vote-interested-soft",
    iconColor: "text-vote-interested",
    textColor: "text-vote-interested-foreground",
    descColor: "text-vote-interested-foreground",
    circleColor: "bg-vote-interested",
    buttonSelected:
      "bg-vote-interested text-background hover:bg-vote-interested/90",
    buttonUnselected:
      "border-vote-interested-foreground text-vote-interested-foreground hover:bg-vote-interested-foreground hover:text-background",
    spinnerColor: "border-vote-interested-foreground",
    description: "Artists you'd like to see if there's time (+1 point)",
  },
  wontGo: {
    value: -1,
    label: "Won't Go",
    icon: X,
    bgColor: "bg-vote-skip-soft",
    iconColor: "text-vote-skip",
    textColor: "text-vote-skip-foreground",
    descColor: "text-vote-skip-foreground",
    circleColor: "bg-vote-skip",
    buttonSelected: "bg-vote-skip text-background hover:bg-vote-skip/90",
    buttonUnselected:
      "border-vote-skip-foreground text-vote-skip-foreground hover:bg-vote-skip-foreground hover:text-background",
    spinnerColor: "border-vote-skip-foreground",
    description: "Artists you'd prefer to skip (-1 point)",
  },
} as const;

export type VoteConfig = {
  value: -1 | 1 | 2;
  label: string;
  icon: typeof Star;
  bgColor: string;
  iconColor: string;
  textColor: string;
  descColor: string;
  circleColor: string;
  buttonSelected: string;
  buttonUnselected: string;
  spinnerColor: string;
  description: string;
};

export function getVoteConfig(voteValue: number): VoteType | undefined {
  return (
    VOTES_TYPES.find((key) => VOTE_CONFIG[key].value === voteValue) || undefined
  );
}

export function getVoteValue(voteType: VoteType): -1 | 1 | 2 {
  return VOTE_CONFIG[voteType].value;
}
