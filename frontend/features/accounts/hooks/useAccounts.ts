import { useCallback, useEffect, useState } from "react";
import { fetchAccounts, disconnectAccount as apiDisconnect, updateAccountPlan } from "../api";
import type { Account } from "../types";

const REFRESH_INTERVAL_MS = 60_000;

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const data = await fetchAccounts();
    setAccounts(data);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
    // Windows like the tray popover stay mounted for the app's whole
    // lifetime (menubar hides rather than destroys them), so without this
    // an account connected elsewhere never shows up until a full restart.
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const disconnect = useCallback(
    async (id: string) => {
      await apiDisconnect(id);
      await refresh();
    },
    [refresh]
  );

  const setPlan = useCallback(
    async (id: string, plan: string | null) => {
      await updateAccountPlan(id, plan);
      await refresh();
    },
    [refresh]
  );

  return { accounts, loaded, refresh, disconnect, setPlan };
}
