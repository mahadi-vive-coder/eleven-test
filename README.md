# Eleven Nation Shop - Production & Vercel Deployment

Bangladesh's premier football jersey destination. Official Player Editions, Fan Kits, Retro Classics, and Custom Names & Numbers.

Live domain: `https://www.elevennation.shop`

---

## Architecture & Hosting

This project is configured for seamless full-stack hosting on **Vercel**:
- **Frontend**: Vite SPA built to `dist/` and served statically via Vercel's Edge CDN.
- **Backend**: Express server running as a Vercel Serverless Function via `api/index.ts` (mapped via `vercel.json`).
- **Dynamic SEO**: Per-route crawler SEO tag injection (`<title>`, `<meta name="description">`, `<link rel="canonical">`, OpenGraph, Twitter, and Product JSON-LD structured data) handled by `renderHtml` in `server.ts`.
- **Dynamic Sitemap**: `/sitemap.xml` dynamically generated with active products and canonical www URLs.
- **Static Assets**: `/assets/*`, favicons, robots.txt, og-image.png served directly as static files.

---

## Required Environment Variables

To deploy to Vercel or run production builds with live database persistence, set the following environment variables in your Vercel Project Settings (**Settings** > **Environment Variables**):

| Variable Name | Required | Target | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | **Yes** (Prod) | Production, Preview, Dev | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | **Yes** (Prod) | Production, Preview, Dev | Supabase public anonymous API key for client queries |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** (Prod) | Production, Preview | Supabase service role secret for secure server-side order processing and atomic inventory management |

### Data Safety in Production
- When running on Vercel or in production mode (`NODE_ENV=production` or `VERCEL=1`), `POST /api/orders` **strictly requires** Supabase database configuration.
- If Supabase credentials are missing or the database is unreachable, the endpoint returns `HTTP 503 Service Unavailable` with a descriptive error message to prevent unpersisted or lost orders in ephemeral serverless instances.
- In local development mode (`npm run dev`), the server automatically provides an in-memory fallback catalog and order store so developers can preview and test without live credentials.
- `SUPABASE_SERVICE_ROLE_KEY` is strictly server-side and is never exposed to the client bundle or response payloads.

---

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment (optional for local dev):**
   ```bash
   cp .env.example .env
   ```

3. **Start local dev server:**
   ```bash
   npm run dev
   ```
   The dev server runs at `http://localhost:3000` with hot-module reloading and Vite middleware.

4. **Build verification:**
   ```bash
   npm run build
   ```
