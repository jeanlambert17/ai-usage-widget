import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAccounts } from "@features/accounts/hooks/useAccounts";
import { useUsagePolling } from "@features/usage/hooks/useUsagePolling";
import { UsageMetric } from "@features/usage/components/UsageMetric";
import { formatRelative } from "@features/usage/lib/format";

function openDashboard() {
  if (window.electronAPI?.openDashboard) {
    window.electronAPI.openDashboard();
  } else {
    window.open(window.location.origin + "/", "_blank");
  }
}

export function TrayView() {
  const { accounts, loaded, refresh: refreshAccounts } = useAccounts();
  const { usageById, lastUpdated, refresh: refreshUsage } = useUsagePolling();
  // The popover window is never destroyed between opens (see main.cjs), so a
  // plain mount-triggered CSS animation would only ever play once. Bumping
  // this on every "tray-shown" forces the animated wrapper to remount, so
  // the pop-in effect replays each time the icon is clicked.
  const [openKey, setOpenKey] = useState(0);

  useEffect(() => {
    return window.electronAPI?.onTrayShown(() => {
      refreshAccounts();
      refreshUsage();
      setOpenKey((k) => k + 1);
    });
  }, [refreshAccounts, refreshUsage]);

  return (
    <div
      key={openKey}
      className="flex max-h-[560px] w-[340px] origin-top flex-col bg-background text-foreground animate-in fade-in zoom-in-95 duration-150 ease-out"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium">Your usage limits</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            title="Refresh"
            onClick={() => {
              refreshAccounts();
              refreshUsage();
            }}
          >
            <RefreshCw />
          </Button>
          <Button variant="ghost" size="icon-xs" title="Open dashboard" onClick={openDashboard}>
            <ExternalLink />
          </Button>
        </div>
      </div>

      {loaded && accounts.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <p className="text-xs text-muted-foreground">No accounts connected yet.</p>
          <Button size="sm" onClick={openDashboard}>
            Open dashboard to connect
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {accounts.map((account) => {
          const result = usageById[account.id];
          return (
            <div key={account.id} className="space-y-3 border-t border-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">{account.label}</p>
                {account.workspaceName && (
                  <p className="truncate text-[11px] text-muted-foreground">{account.workspaceName}</p>
                )}
              </div>

              {!result && <p className="text-xs text-muted-foreground">Loading…</p>}

              {result && !result.ok && (
                <div className="border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
                  {result.authError
                    ? "Session expired — reconnect in dashboard"
                    : result.error || "Failed to load usage"}
                </div>
              )}

              {result?.ok && result.usage && (
                <>
                  <UsageMetric bucket={result.usage.buckets.fiveHour} kind="session" />
                  <UsageMetric bucket={result.usage.buckets.sevenDay} kind="weekly" />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border px-4 py-2.5 text-right">
        <span className="text-xs text-muted-foreground">
          {lastUpdated ? `Updated ${formatRelative(lastUpdated)}` : "—"}
        </span>
      </div>
    </div>
  );
}
