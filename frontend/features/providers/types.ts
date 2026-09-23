export type ProviderStatus = "available" | "coming_soon";

export interface Provider {
  id: string;
  name: string;
  vendor: string;
  status: ProviderStatus;
}
