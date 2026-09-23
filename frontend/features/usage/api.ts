import { apiRequest } from "@/lib/api";
import type { UsageResult } from "./types";

export function fetchUsage() {
  return apiRequest<UsageResult[]>("/api/usage");
}
