import { useCallback, useEffect, useState } from "react";
import { fetchUsage } from "../api";
import type { UsageResult } from "../types";

const REFRESH_INTERVAL_MS = 60_000;

export function useUsagePolling() {
  const [usageById, setUsageById] = useState<Record<string, UsageResult>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    const results = await fetchUsage();
    setUsageById(Object.fromEntries(results.map((r) => [r.id, r])));
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return { usageById, lastUpdated, refresh };
}
