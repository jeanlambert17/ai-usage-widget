import { useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAccounts } from "@features/accounts/hooks/useAccounts";
import { useUsagePolling } from "@features/usage/hooks/useUsagePolling";
import { formatRelative } from "@features/usage/lib/format";
import { AccountCard } from "@features/accounts/components/AccountCard";
import { ConnectAccountDialog } from "@features/accounts/components/ConnectAccountDialog";

export function Dashboard() {
  const { accounts, loaded, refresh: refreshAccounts, disconnect } = useAccounts();
  const { usageById, lastUpdated, refresh: refreshUsage } = useUsagePolling();
  const [connectOpen, setConnectOpen] = useState(false);

  async function handleConnected() {
    await refreshAccounts();
    await refreshUsage();
  }

  async function refreshAll() {
    await refreshAccounts();
    await refreshUsage();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          <span>AI Usage</span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {formatRelative(lastUpdated)}
            </span>
          )}
          <Button variant="ghost" size="icon-sm" title="Refresh all" onClick={refreshAll}>
            <RefreshCw />
          </Button>
          <Button onClick={() => setConnectOpen(true)}>+ Connect account</Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loaded && accounts.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <h2 className="font-heading text-lg font-medium">No accounts connected yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Connect an AI account to see its usage here.
            </p>
            <Button onClick={() => setConnectOpen(true)}>+ Connect account</Button>
          </div>
        )}

        {accounts.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                result={usageById[account.id]}
                onDisconnect={disconnect}
              />
            ))}
          </div>
        )}
      </main>

      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} onConnected={handleConnected} />
    </div>
  );
}
