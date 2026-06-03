# Deployment Notes

## Local verification

```bash
npm install
npm run build
npm run dev
```

## Environment

No required production env vars for the current private-beta build. All tracking/favorites/history are local-device based. Admin analytics and beta feedback are in-memory session utilities and will reset when the server restarts unless you connect a database later.

## Production checklist

- Run QA Center.
- Run Admin > Store Check.
- Run Beta > Real-World Test Sheet.
- Confirm Lookup Unavailable is not displayed as Sold Out.
- Confirm product images or fallback image load.
- Export search logs after testing.
- Disable stores with repeated Lookup Unavailable until their adapter is reviewed.

## Recommended host

- Vercel for easiest Next.js deployment.
- Railway is acceptable if you prefer the existing workflow.

## Known production limitation

Exact push notifications need a persistent notification backend. The current build supports local/in-app notification behavior and notification permission prompts only.
