# @solana/kit Next.js SSR Reproduction

Minimal reproduction for [anza-xyz/kit#1158](https://github.com/anza-xyz/kit/issues/1158).

## Issue

All `@solana/kit` packages are missing a `default` export condition, causing Next.js to resolve to Node.js builds during SSR of client components.

## Reproduce

```bash
npm install
npm run build
```

**Error:**
```
Module not found: Can't resolve 'ws'
./node_modules/@solana/rpc-subscriptions-channel-websocket/dist/index.node.mjs
```

## Why this happens

1. Client components with `"use client"` are pre-rendered on the server before hydration
2. During SSR, Turbopack's `browser` condition only matches client-side code, not SSR
3. Without a `default` fallback, resolution falls back to `main`/`module` which point to Node.js builds
4. Node.js builds import `ws`, which isn't installed (and is intentionally optional)

## Fix

Add `default` pointing to browser builds:

```json
"exports": {
  "browser": { "import": "./dist/index.browser.mjs" },
  "node": { "import": "./dist/index.node.mjs" },
  "default": { "import": "./dist/index.browser.mjs" }
}
```

## Environment

- Next.js 16.1.1
- @solana/kit 5.1.0
