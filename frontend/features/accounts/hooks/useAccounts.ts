import { useCallback, useEffect, useState } from "react";
import { fetchAccounts, disconnectAccount as apiDisconnect } from "../api";
import type { Account } from "../types";

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
  }, [refresh]);

  const disconnect = useCallback(
    async (id: string) => {
      await apiDisconnect(id);
      await refresh();
    },
    [refresh]
  );

  return { accounts, loaded, refresh, disconnect };
}
