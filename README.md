# FindMyFleet2

FindMyFleet2 is a fleet management frontend built with React + TypeScript and Vite, intended to work with a Supabase backend for authentication and data storage. The project includes UI pages for drivers, vehicles, maintenance, trips, and a dashboard.

This repository was cleaned and published as a single-root commit. Prior history was archived into local backup bundles before the history reset.

## Technologies

- Frontend: React 18 + TypeScript (.tsx)
- Build tool: Vite
- Styling: Tailwind CSS
- UI primitives: Radix UI
- State / data: @tanstack/react-query
- Forms: react-hook-form + zod
- Charts: Recharts
- Auth / backend client: Supabase (via `@supabase/supabase-js`)

## Getting started (development)

1. Install dependencies:

```powershell
npm install
```

2. Create a local `.env` file by copying the example and filling in your Supabase values:

```powershell
copy .env.example .env
# then edit .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

3. Run the dev server (bind to localhost if you want IPv4 only):

```powershell
npm run dev -- --host 127.0.0.1 --port 8080
```

Open the printed Local URL in your browser.

## Build & preview

Build for production:

```powershell
npm run build
```

Preview the production build locally:

```powershell
npm run preview -- --host 127.0.0.1 --port 8080
```

## Environment variables

Required (local `.env`):

- VITE_SUPABASE_URL - your Supabase project URL (example: `https://xyz.supabase.co`)
- VITE_SUPABASE_ANON_KEY - anon/public API key for Supabase

Optional demo credentials (used by the login page if present):

- VITE_DEMO_EMAIL
- VITE_DEMO_PASSWORD

Do not commit `.env` or any secret keys. `.env.example` is provided as a template.

## Deployment

Recommended hosts for static deployment: Vercel, Netlify, Cloudflare Pages. Set the same VITE_* environment variables in the host's dashboard (do not commit them to git).

## Repository notes

- Tag `v1.0.0` was created and pushed.
- Previous repository history was saved to local bundle(s) before the history rewrite.

## Contributing

If you collaborate with others, note that the repository history was rewritten — collaborators should re-clone the repository to avoid issues.

## License & credits

See the project root for license and attribution. This repository contains code built with various open-source libraries; please refer to their licenses in package.json and node_modules.

---

If you want, I can also:
- Create a `release-notes.md` with the v1.0.0 changelog
- Add a short `FRONTEND.md` listing the main entry points and dev notes
- Wire a Vercel or Netlify deploy config (draft) in the repo

Tell me which of these extras you want and I will add them.
