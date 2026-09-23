export interface UsageBucket {
  label: string;
  utilization: number | null;
  resetsAt: string | null;
  present: boolean;
}

export interface UsageBuckets {
  fiveHour: UsageBucket;
  sevenDay: UsageBucket;
  sevenDayOpus: UsageBucket;
  sevenDaySonnet: UsageBucket;
}

export interface ExtraUsage {
  currentSpend: number | null;
  budget: number | null;
}

export interface UsageData {
  buckets: UsageBuckets;
  extraUsage: ExtraUsage | null;
  fetchedAt: string;
}

export interface UsageResult {
  id: string;
  ok: boolean;
  usage?: UsageData;
  error?: string;
  authError?: boolean;
}
