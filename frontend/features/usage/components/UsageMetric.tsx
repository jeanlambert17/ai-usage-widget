import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { resetText } from "../lib/format";
import type { UsageBucket } from "../types";

export function UsageMetric({
  bucket,
  kind,
}: {
  bucket: UsageBucket;
  kind: "session" | "weekly";
}) {
  const pct = bucket.utilization;
  const tone =
    pct !== null && pct >= 90
      ? "bg-destructive"
      : pct !== null && pct >= 70
        ? "bg-amber-500"
        : undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-medium leading-none">{bucket.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{resetText(bucket.resetsAt, kind)}</p>
        </div>
        <span className={cn("shrink-0 text-xs text-muted-foreground")}>
          {pct === null ? "—" : `${pct}% used`}
        </span>
      </div>
      <Progress value={pct ?? 0} indicatorClassName={tone} />
    </div>
  );
}
