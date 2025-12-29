"use client";

import { createClient, autoDiscover } from "@solana/client";

// ❌ BROKEN: This runs during SSR and causes "ws" module error
const client = createClient({
  endpoint: "https://api.devnet.solana.com",
  walletConnectors: autoDiscover()
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
