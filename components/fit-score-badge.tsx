import { cn } from "@/lib/utils";

const RECOMMENDATION_LABEL: Record<string, string> = {
  strong_apply: "Strong Apply",
  apply: "Apply",
  consider: "Consider",
  low_priority: "Low Priority",
  skip: "Skip",
};

const RECOMMENDATION_COLOR: Record<string, string> = {
  strong_apply: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  apply: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  consider: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  low_priority: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  skip: "bg-destructive/15 text-destructive",
};

export function FitScoreBadge({
  fitScore,
  recommendation,
}: {
  fitScore: number | null;
  recommendation: string | null;
}) {
  if (fitScore === null || recommendation === null) {
    return <span className="text-sm text-muted-foreground">Not reviewed yet</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium",
          RECOMMENDATION_COLOR[recommendation] ?? "bg-muted text-foreground"
        )}
      >
        {fitScore}% · {RECOMMENDATION_LABEL[recommendation] ?? recommendation}
      </span>
    </div>
  );
}
