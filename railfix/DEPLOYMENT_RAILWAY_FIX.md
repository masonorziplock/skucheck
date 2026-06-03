# Railway Deployment Fix

This package pins Railway to Node 20 and forces install/build to include the dependencies Next.js needs during build.

## Files added/updated

- `.nvmrc` -> Node 20
- `.npmrc` -> include dev dependencies, disable audit/fund noise, legacy peer deps
- `nixpacks.toml` -> Railway install/build/start commands
- `railway.json` -> explicit Railway build/start commands
- `package.json` -> pinned package versions, Railway-safe start script
- `package-lock.json` -> regenerated lockfile matching package.json

## Railway settings

If Railway still fails, set these in Railway service settings:

Build Command:

```bash
npm install --include=dev --legacy-peer-deps && npm run build
```

Start Command:

```bash
npm start
```

Remove these variables if present:

```text
NPM_CONFIG_PRODUCTION=true
NODE_ENV=production
```

If you need NODE_ENV at runtime, Railway will still run the app as production after build through `next start`.
