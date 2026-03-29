# Wackastor -- Project Conventions

## Language
- UI text: French (hardcoded in Svelte components)
- Code, comments, variable names: English
- UEXcorp item/commodity/equipment names: never translated (kept as-is from API)
- All user input: case-insensitive

## Tech Stack
- SvelteKit (full-stack TypeScript)
- Drizzle ORM (SQLite dev / Turso prod)
- Lucia Auth v3 (Discord OAuth)
- Vanilla CSS with design tokens (no Tailwind)
- Vercel deployment

## Design
- Star Citizen Refinery Deck terminal aesthetic
- Dark background, monospace fonts, // SECTION headers
- Orange/amber borders, teal/cyan accents, red warnings
- NO rounded corners, NO shadows, NO massive yellow backgrounds

## Database
- Dev: SQLite local file (file:local.db)
- Prod: Turso (libsql://)
- ORM: Drizzle with feature-grouped schema files in src/lib/server/db/schema/

## Commands
- `pnpm dev` -- Start dev server
- `pnpm build` -- Build for production
- `pnpm drizzle-kit push` -- Push schema to dev DB
- `pnpm drizzle-kit generate` -- Generate migration files
