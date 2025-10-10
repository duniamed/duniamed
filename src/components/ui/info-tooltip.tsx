import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/**
 * Reusable info tooltip for explaining features to non-technical users
 * Appears as a small info icon that shows helpful text on hover
 */
export function InfoTooltip({ children, side = "top", className }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-full hover:bg-accent transition-colors p-1 ${className}`}
          >
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
