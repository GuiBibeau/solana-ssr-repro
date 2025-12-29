"use client";

// ❌ BROKEN: Direct import of websocket channel causes SSR error
import { createWebSocketChannel } from "@solana/rpc-subscriptions-channel-websocket";

export function Providers({ children }: { children: React.ReactNode }) {
  // This will fail during SSR because the import pulls in Node.js 'ws' module
  return <>{children}</>;
}
