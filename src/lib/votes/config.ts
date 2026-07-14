import { Star, Heart, X } from "lucide-react";

export const VOTES_TYPES = ["mustGo", "interested", "wontGo"] as const;
export type VoteType = (typeof VOTES_TYPES)[number];

export const VOTE_CONFIG = {
  mustGo: {
    value: 2,
    label: "Must Go",
    icon: Star,
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    iconColor: "text-orange-600",
    textColor: "text-orange-900 dark:text-orange-100",
    descColor: "text-orange-600 dark:text-orange-300",
    circleColor: "bg-orange-600",
    buttonSelected: "bg-orange-600 hover:bg-orange-700",
    buttonUnselected:
      "border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white",
    spinnerColor: "border-orange-400",
    description: "Artists you absolutely can't miss (+2 points)",
  },
  interested: {
    value: 1,
    label: "Interested",
    icon: Heart,
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600",
    textColor: "text-blue-900 dark:text-blue-100",
    descColor: "text-blue-600 dark:text-blue-300",
    circleColor: "bg-blue-600",
    buttonSelected: "bg-blue-600 hover:bg-blue-700",
    buttonUnselected:
      "border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white",
    spinnerColor: "border-blue-400",
    description: "Artists you'd like to see if there's time (+1 point)",
  },
  wontGo: {
    value: -1,
    label: "Won't Go",
    icon: X,
    bgColor: "bg-gray-50 dark:bg-gray-900/20",
    iconColor: "text-gray-600",
    textColor: "text-gray-900 dark:text-gray-100",
    descColor: "text-gray-600 dark:text-gray-300",
    circleColor: "bg-gray-600",
    buttonSelected: "bg-gray-600 hover:bg-gray-700",
    buttonUnselected:
      "border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-white",
    spinnerColor: "border-gray-400",
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
