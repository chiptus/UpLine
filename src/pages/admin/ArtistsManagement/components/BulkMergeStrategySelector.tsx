import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Star, Clock, Hash, Zap } from "lucide-react";

type MergeStrategy = "smart" | "first" | "newest" | "oldest";

interface BulkMergeStrategySelectorProps {
  strategy: MergeStrategy;
  onStrategyChange: (strategy: MergeStrategy) => void;
}

export function BulkMergeStrategySelector({
  strategy,
  onStrategyChange,
}: BulkMergeStrategySelectorProps) {
  function getStrategyIcon(strategyType: MergeStrategy) {
    switch (strategyType) {
      case "smart":
        return <Star className="h-4 w-4" />;
      case "newest":
        return <Clock className="h-4 w-4" />;
      case "oldest":
        return <Hash className="h-4 w-4" />;
      case "first":
        return <Zap className="h-4 w-4" />;
    }
  }

  function getStrategyDescription(strategyType: MergeStrategy) {
    switch (strategyType) {
      case "smart":
        return "Chooses the artist with the most complete data as primary, then merges missing data (description, links) from other duplicates into it";
      case "newest":
        return "Uses the most recently created artist as primary, then fills in any missing data from older duplicates";
      case "oldest":
        return "Uses the oldest created artist as primary, then fills in any missing data from newer duplicates";
      case "first":
        return "Uses the first artist in each group as primary, then fills in any missing data from other duplicates";
    }
  }

  return (
    <div>
      <Label className="text-base font-medium mb-3 block">
        Choose Merge Strategy
      </Label>
      <RadioGroup
        value={strategy}
        onValueChange={(value) => onStrategyChange(value as MergeStrategy)}
        className="space-y-2"
      >
        {(["smart", "newest", "oldest", "first"] as MergeStrategy[]).map(
          (strategyType) => (
            <div
              key={strategyType}
              className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted"
            >
              <RadioGroupItem
                value={strategyType}
                id={strategyType}
                className="mt-1 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={strategyType}
                  className="flex items-center gap-2 font-medium cursor-pointer text-sm"
                >
                  {getStrategyIcon(strategyType)}
                  {strategyType.charAt(0).toUpperCase() +
                    strategyType.slice(1)}{" "}
                  Strategy
                </Label>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {getStrategyDescription(strategyType)}
                </p>
              </div>
            </div>
          ),
        )}
      </RadioGroup>
    </div>
  );
}
