import { PartyPopper, ThumbsUp, Meh } from "lucide-react";

export const RATING_TYPES = ["loved", "liked", "meh"] as const;
export type RatingType = (typeof RATING_TYPES)[number];

export const RATING_CONFIG = {
  loved: {
    value: 3,
    label: "Loved it",
    icon: PartyPopper,
    buttonSelected: "bg-pink-600 hover:bg-pink-700",
    buttonUnselected:
      "border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white",
  },
  liked: {
    value: 2,
    label: "Liked it",
    icon: ThumbsUp,
    buttonSelected: "bg-teal-600 hover:bg-teal-700",
    buttonUnselected:
      "border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-white",
  },
  meh: {
    value: 1,
    label: "Meh",
    icon: Meh,
    buttonSelected: "bg-slate-600 hover:bg-slate-700",
    buttonUnselected:
      "border-slate-400 text-slate-400 hover:bg-slate-400 hover:text-white",
  },
} as const;

export type RatingConfig = (typeof RATING_CONFIG)[RatingType];

export function getRatingValue(ratingType: RatingType): 1 | 2 | 3 {
  return RATING_CONFIG[ratingType].value;
}
