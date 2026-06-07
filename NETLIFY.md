Netlify deploy steps

1. In Netlify site settings -> Build & deploy -> Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

2. Ensure Node version matches: Netlify will respect `.nvmrc` or `engines.node` in `package.json`.

3. If a deploy serves raw `/src/*.jsx`, trigger a fresh deploy with cache clear:
   - Deploys -> Trigger deploy -> Clear cache and deploy

Local verification:

```bash
npm install
npm run build
npm run preview
# or
npx serve dist
```
