import { useState } from "react";
import { X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UsageMetric } from "@features/usage/components/UsageMetric";
import { formatRelative } from "@features/usage/lib/format";
import type { UsageResult } from "@features/usage/types";
import type { Account } from "../types";

export function AccountCard({
  account,
  result,
  onDisconnect,
  onUpdatePlan,
}: {
  account: Account;
  result: UsageResult | undefined;
  onDisconnect: (id: string) => void;
  onUpdatePlan: (id: string, plan: string | null) => void | Promise<void>;
}) {
  const [editingPlan, setEditingPlan] = useState(false);
  const [planInput, setPlanInput] = useState(account.plan ?? "");
  const [savingPlan, setSavingPlan] = useState(false);

  function startEditPlan() {
    setPlanInput(account.plan ?? "");
    setEditingPlan(true);
  }

  async function savePlan() {
    setSavingPlan(true);
    try {
      await onUpdatePlan(account.id, planInput.trim() || null);
      setEditingPlan(false);
    } finally {
      setSavingPlan(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span title={account.label} className="min-w-0 truncate font-heading text-sm font-medium">
              {account.label}
            </span>
            {editingPlan ? (
              <div className="flex shrink-0 items-center gap-1">
                <Input
                  autoFocus
                  value={planInput}
                  onChange={(e) => setPlanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") savePlan();
                    if (e.key === "Escape") setEditingPlan(false);
                  }}
                  placeholder="e.g. Pro, Max, Team"
                  className="h-6 w-28 px-1.5 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  title="Save plan"
                  disabled={savingPlan}
                  onClick={savePlan}
                >
                  <Check />
                </Button>
              </div>
            ) : account.plan ? (
              <button type="button" onClick={startEditPlan} title="Click to edit plan" className="shrink-0">
                <Badge variant="secondary" className="cursor-pointer capitalize">
                  {account.plan}
                </Badge>
              </button>
            ) : (
              <button
                type="button"
                onClick={startEditPlan}
                title="Set this account's plan"
                className="shrink-0 text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                + Add plan
              </button>
            )}
          </div>
          {account.workspaceName && (
            <p title={account.workspaceName} className="truncate text-xs text-muted-foreground">
              {account.workspaceName}
            </p>
          )}
        </div>
        <CardAction>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="icon-sm" title="Disconnect" />}
            >
              <X />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect {account.label}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This deletes its stored session key from this machine. You'll need to log in
                  again to reconnect it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => onDisconnect(account.id)}
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!result && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {result && !result.ok && (
          <div className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {result.authError
              ? "Session expired — reconnect this account."
              : result.error || "Failed to load usage."}
          </div>
        )}

        {result?.ok && result.usage && (
          <>
            <UsageMetric bucket={result.usage.buckets.fiveHour} kind="session" />
            <div className="space-y-3">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Weekly limits
              </p>
              {[result.usage.buckets.sevenDay, result.usage.buckets.sevenDayOpus, result.usage.buckets.sevenDaySonnet]
                .filter((bucket) => bucket.present)
                .map((bucket) => (
                  <UsageMetric key={bucket.label} bucket={bucket} kind="weekly" />
                ))}
            </div>
            {result.usage.extraUsage &&
              (result.usage.extraUsage.currentSpend !== null || result.usage.extraUsage.budget !== null) && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Extra usage</span>
                  <span>
                    ${(result.usage.extraUsage.currentSpend ?? 0).toFixed(2)} / $
                    {(result.usage.extraUsage.budget ?? 0).toFixed(2)}
                  </span>
                </div>
              )}
          </>
        )}
      </CardContent>

      {result?.ok && result.usage && (
        <CardFooter>
          <span className="text-xs text-muted-foreground">
            Last updated: {formatRelative(new Date(result.usage.fetchedAt))}
          </span>
        </CardFooter>
      )}
    </Card>
  );
}
