export {};

declare global {
  interface Window {
    // Present only when running inside the Electron shell (electron/preload.cjs).
    // Absent in a plain browser tab (e.g. the Docker-served dashboard) —
    // features must check for it before use and fall back gracefully.
    electronAPI?: {
      claudeLogin: () => Promise<{ sessionKey: string }>;
      openDashboard: () => Promise<void>;
    };
  }
}
