import { Progress } from "@/components/ui/progress";

interface ExplorationProgressProps {
  current: number;
  total: number;
}

export function ExplorationProgress({
  current,
  total,
}: ExplorationProgressProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-white/80">
        {current} of {total}
      </span>
      <div className="w-20">
        <Progress value={percentage} className="h-2 bg-white/20" />
      </div>
    </div>
  );
}
