# KKND Frontend

Next.js 16 (App Router) frontend for the KKND IT Inventory Management System.
See `../docs/HANDOFF.md` and `../docs/ROADMAP.md` for full project context.

## Stack

- Next.js 16 + TypeScript + App Router
- Tailwind CSS v4
- Design tokens in `src/app/globals.css` — see `../docs/design/03-design-system.md`
- Fonts self-hosted via `@fontsource-variable/*` (NFR-15: no runtime CDN dependency)
- UI text is **English only** (NFR-10) — Thai stays in code comments and docs

## Getting started

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to the running backend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page calls the
backend's `/health/db` endpoint to confirm end-to-end connectivity — replace
it once real pages exist.

## Conventions

- Never hardcode a raw color (e.g. `slate-200`) in a component — use the
  semantic tokens (`bg-bg-surface`, `text-text-primary`, etc.) defined in
  `globals.css`, or Dark Mode breaks silently.
- Base font size is 14px, not the Tailwind default 16px — see Design System
  §1 principle 4 (data density is a feature for this audience, not a defect).
- `src/components/ui/` follows the shadcn/ui pattern (`cva` + `cn()` from
  `src/lib/utils.ts`) but was hand-written here since `ui.shadcn.com` isn't
  reachable from this environment's network policy — new components should
  match the same structure.
