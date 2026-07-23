import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TooltipButton({
  children,
  tooltip,
  isMobile,
  ...props
}: {
  children: React.ReactNode;
  tooltip: string;
  isMobile: boolean;
  [key: string]: unknown;
}) {
  if (!isMobile) {
    return <Button {...props}>{children}</Button>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
