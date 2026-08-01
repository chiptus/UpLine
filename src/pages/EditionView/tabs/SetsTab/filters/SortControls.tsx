import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SortAsc,
  HelpCircle,
  ArrowUpAZ,
  ArrowDownAZ,
  Star,
  TrendingUp,
  Calendar,
} from "lucide-react";
import type { SortOption } from "@/hooks/useUrlState";
import { SORT_OPTIONS } from "./constants";

interface SortControlsProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

// Map sort options to their icons
const SORT_ICONS = {
  "name-asc": ArrowUpAZ,
  "name-desc": ArrowDownAZ,
  "rating-desc": Star,
  "popularity-desc": TrendingUp,
  "date-asc": Calendar,
} as const;

export function SortControls({ sort, onSortChange }: SortControlsProps) {
  const CurrentSortIcon = SORT_ICONS[sort];

  return (
    <div className="flex items-center gap-2">
      <SortAsc className="h-4 w-4 text-purple-300 hidden sm:block" />
      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-10 sm:w-44 bg-white/10 border-purple-400/30 text-purple-100">
          <div className="hidden sm:block">
            <SelectValue />
          </div>
          <div className="block sm:hidden">
            <CurrentSortIcon className="h-4 w-4 text-purple-300" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-purple-400/30">
          {SORT_OPTIONS.map((option) => {
            const Icon = SORT_ICONS[option.value as keyof typeof SORT_ICONS];
            return (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-purple-100"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="p-1 hover:bg-white/10 rounded transition-colors hidden sm:block"
            title="Click for sorting help"
          >
            <HelpCircle className="h-4 w-4 text-purple-300 hover:text-purple-200" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="bg-gray-800 border-purple-400/30 text-purple-100 w-80">
          <div className="space-y-3">
            <h3 className="font-semibold text-purple-200 mb-2">
              Sort Options Explained
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <ArrowUpAZ className="h-4 w-4 text-purple-300" />
                <div>
                  <strong className="text-purple-300">Name (A-Z):</strong>
                  <p className="text-purple-100/80">
                    Sort artists alphabetically from A to Z
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ArrowDownAZ className="h-4 w-4 text-purple-300" />
                <div>
                  <strong className="text-purple-300">Name (Z-A):</strong>
                  <p className="text-purple-100/80">
                    Sort artists alphabetically from Z to A
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-300" />
                <div>
                  <strong className="text-purple-300">Highest Rated:</strong>
                  <p className="text-purple-100/80">
                    Sort by weighted average rating based on votes (Must go = 2
                    points, Interested = 1 point, Won't go = -1 point)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-300" />
                <div>
                  <strong className="text-purple-300">Most Popular:</strong>
                  <p className="text-purple-100/80">
                    Sort by weighted popularity score (Must go = 2 points,
                    Interested = 1 point)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-300" />
                <div>
                  <strong className="text-purple-300">By Date:</strong>
                  <p className="text-purple-100/80">
                    Sort by estimated performance date (earliest performances
                    first)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
