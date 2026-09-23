import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api";
import { fetchProviders } from "@features/providers/api";
import type { Provider } from "@features/providers/types";

import { connectAccount } from "../api";

type Step = "menu" | string; // string = a provider id once one is picked

export function ConnectAccountDialog({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}) {
  const [step, setStep] = useState<Step>("menu");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [label, setLabel] = useState("");
  const [sessionKey, setSessionKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasElectronLogin = typeof window !== "undefined" && Boolean(window.electronAPI?.claudeLogin);

  useEffect(() => {
    if (!open) return;
    setStep("menu");
    setLabel("");
    setSessionKey("");
    setError(null);
    fetchProviders()
      .then(setProviders)
      .catch(() => setProviders([]));
  }, [open]);

  async function finishConnect(providerId: string, sessionKeyValue: string) {
    setBusy(true);
    setError(null);
    try {
      await connectAccount({ providerId, label, sessionKey: sessionKeyValue });
      toast.success("Account connected");
      onOpenChange(false);
      onConnected();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleElectronLogin() {
    setBusy(true);
    setError(null);
    try {
      const { sessionKey: capturedKey } = await window.electronAPI!.claudeLogin();
      await finishConnect("claude", capturedKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed or was cancelled");
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {step === "menu" && (
          <>
            <DialogHeader>
              <DialogTitle>Connect an account</DialogTitle>
              <DialogDescription>Choose which AI provider to connect.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  disabled={provider.status !== "available"}
                  onClick={() => setStep(provider.id)}
                  className="flex items-center justify-between border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <span>
                    <span className="font-medium">{provider.name}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">{provider.vendor}</span>
                  </span>
                  {provider.status === "coming_soon" && <Badge variant="secondary">Coming soon</Badge>}
                </button>
              ))}
            </div>
          </>
        )}

        {step === "claude" && (
          <>
            <DialogHeader>
              <DialogTitle>Connect Claude</DialogTitle>
              <DialogDescription>
                {hasElectronLogin
                  ? "Log in to claude.ai in the window that opens. We'll pick up your session automatically once you're in — your password never touches this app."
                  : "Paste the sessionKey cookie from a browser where you're already logged into claude.ai."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="account-label">Label</Label>
                <Input
                  id="account-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Personal, Work"
                />
              </div>

              {!hasElectronLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="session-key">Session key</Label>
                  <Input
                    id="session-key"
                    type="password"
                    autoComplete="off"
                    value={sessionKey}
                    onChange={(e) => setSessionKey(e.target.value)}
                    placeholder="sk-ant-sid01-..."
                  />
                  <details className="border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                    <summary className="cursor-pointer text-foreground">Where do I find this?</summary>
                    <ol className="ml-4 list-decimal space-y-1 pt-2">
                      <li>Open claude.ai in your browser, logged in.</li>
                      <li>
                        DevTools → Application/Storage → Cookies → <code>https://claude.ai</code>.
                      </li>
                      <li>
                        Copy the <code>sessionKey</code> value (starts with <code>sk-ant-sid01-</code>).
                      </li>
                    </ol>
                  </details>
                </div>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("menu")} disabled={busy}>
                Back
              </Button>
              {hasElectronLogin ? (
                <Button onClick={handleElectronLogin} disabled={busy}>
                  {busy ? "Waiting for login…" : "Log in with Claude"}
                </Button>
              ) : (
                <Button
                  onClick={() => finishConnect("claude", sessionKey)}
                  disabled={busy || !sessionKey.trim()}
                >
                  {busy ? "Connecting…" : "Connect"}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
