# @solana/rpc-subscriptions-channel-websocket Next.js SSR Bug

## Bug Summary

**Package**: `@solana/rpc-subscriptions-channel-websocket@5.1.0`  
**Issue**: Incorrect package.json export conditions cause Next.js to load Node.js build during SSR, resulting in `Module not found: Can't resolve 'ws'` error.

## Root Cause

The `package.json` exports configuration has incorrect mappings:

```json
"exports": {
  "edge-light": { "import": "./dist/index.node.mjs" },  // ❌ WRONG
  "workerd": { "import": "./dist/index.node.mjs" },     // ❌ WRONG
  "browser": { "import": "./dist/index.browser.mjs" },  // ✓ correct
  "node": { "import": "./dist/index.node.mjs" }         // ✓ correct
}
```

Problems:
1. `edge-light` and `workerd` incorrectly point to Node.js build (`index.node.mjs`)
2. Missing `default` fallback export
3. No `react-server` condition for RSC/SSR environments

When Next.js processes client components during SSR, it doesn't match the `browser` condition and falls back to the Node.js build which imports the `ws` module.

## Reproduction

This repo demonstrates the issue with a minimal Next.js app:

```bash
npm install
npm run build  # ❌ Fails with "Module not found: Can't resolve 'ws'"
```

The error occurs simply by importing from the package:

```tsx
import { createWebSocketChannel } from "@solana/rpc-subscriptions-channel-websocket";
```

## Expected Behavior

Next.js should load the browser build (`index.browser.mjs`) during SSR for client components, which uses `globalThis.WebSocket` instead of the `ws` module.

## Suggested Fix

Update `@solana/rpc-subscriptions-channel-websocket/package.json`:

```json
"exports": {
  "edge-light": { "import": "./dist/index.browser.mjs" },
  "workerd": { "import": "./dist/index.browser.mjs" },
  "react-server": { "import": "./dist/index.browser.mjs" },
  "browser": { "import": "./dist/index.browser.mjs" },
  "node": { "import": "./dist/index.node.mjs" },
  "default": { "import": "./dist/index.browser.mjs" }
}
```

## Workaround (User Side)

Use `SolanaProvider` with lazy client creation via `config` prop instead of pre-creating the client:

```tsx
"use client";

import { SolanaProvider } from "@solana/react-hooks";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SolanaProvider
      config={{
        rpc: "https://api.devnet.solana.com",
        walletConnectors: "default",
      }}
    >
      {children}
    </SolanaProvider>
  );
}
```

## Environment

- **Next.js**: 16.1.1
- **@solana/rpc-subscriptions-channel-websocket**: 5.1.0
- **@solana/client**: 1.2.0
- **Node.js**: 20+

## Related Packages

This issue affects any package that depends on `@solana/rpc-subscriptions-channel-websocket`:
- `@solana/client`
- `@solana/rpc-subscriptions`
- `@solana/react-hooks`
