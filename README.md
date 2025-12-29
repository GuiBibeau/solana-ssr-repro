# @solana/client Next.js SSR Bug Reproduction

## Bug Description

When using `@solana/client` with Next.js App Router, importing and calling `createClient()` at module scope in a `"use client"` component causes a build/runtime error:

```
Module not found: Can't resolve 'ws'
```

## Root Cause

The `@solana/rpc-subscriptions-channel-websocket` package has incorrect export conditions:

```json
"exports": {
  "edge-light": { "import": "./dist/index.node.mjs" },  // ❌ should be browser
  "workerd": { "import": "./dist/index.node.mjs" },     // ❌ should be browser
  "browser": { "import": "./dist/index.browser.mjs" },  // ✓ correct
  "node": { "import": "./dist/index.node.mjs" }         // ✓ correct
}
```

The `edge-light` and `workerd` conditions incorrectly point to the Node.js build which imports `ws`.

Additionally, there's no `default` fallback export, so Next.js SSR may not match any condition.

## Steps to Reproduce

1. Clone this repo
2. `npm install`
3. `npm run dev`
4. Visit http://localhost:3000
5. Observe the error

## Expected Behavior

The page should load without errors.

## Actual Behavior

```
Module not found: Can't resolve 'ws'

Import trace:
  ./node_modules/@solana/rpc-subscriptions-channel-websocket/dist/index.node.mjs
  ./node_modules/@solana/rpc-subscriptions/dist/index.node.mjs
  ./node_modules/@solana/client/dist/index.node.mjs
  ./app/providers.tsx
```

## Suggested Fix (Library Side)

In `@solana/rpc-subscriptions-channel-websocket/package.json`:

```json
"exports": {
  "edge-light": { "import": "./dist/index.browser.mjs" },
  "workerd": { "import": "./dist/index.browser.mjs" },
  "browser": { "import": "./dist/index.browser.mjs" },
  "node": { "import": "./dist/index.node.mjs" },
  "default": { "import": "./dist/index.browser.mjs" }
}
```

## Workaround (User Side)

Use `SolanaProvider` with `config` prop instead of pre-creating the client:

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

- Next.js: latest
- @solana/client: latest
- @solana/react-hooks: latest
- Node.js: 20+
