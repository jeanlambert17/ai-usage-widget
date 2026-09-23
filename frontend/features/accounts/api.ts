import { apiRequest } from "@/lib/api";
import type { Account } from "./types";

export function fetchAccounts() {
  return apiRequest<Account[]>("/api/accounts");
}

export function connectAccount(input: { providerId: string; label?: string; sessionKey: string }) {
  return apiRequest<Account[]>("/api/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function disconnectAccount(id: string) {
  return apiRequest<{ removed: boolean }>(`/api/accounts/${id}`, { method: "DELETE" });
}

export function updateAccountPlan(id: string, plan: string | null) {
  return apiRequest<Account>(`/api/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ plan }),
  });
}
