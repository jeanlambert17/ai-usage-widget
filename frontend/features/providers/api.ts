import { apiRequest } from "@/lib/api";
import type { Provider } from "./types";

export function fetchProviders() {
  return apiRequest<Provider[]>("/api/providers");
}
