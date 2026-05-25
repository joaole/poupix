# PouPix — Finanças Pessoais

Full-stack personal finance app built with Next.js 14, Supabase, and TanStack Query.

## Quick Start
Next steps to get the app fully working:
  1. Run npm run db:migrate to apply the SQL migrations to Supabase
  2. Create the receipts storage bucket in the Supabase dashboard (Storage → New bucket → name: receipts, private)
  3. Run npm run dev to start the dev server
```bash
# 1. Copy env file and fill in your Supabase credentials
cp .env.local.example .env.local

# 2. Install dependencies
npm install

# 3. Run database migrations
#    Option A — Supabase CLI (recommended):
#    supabase db push
#
#    Option B — paste each file from supabase/migrations/ into the Supabase SQL editor

# 4. Create the storage bucket in Supabase:
#    Dashboard → Storage → New bucket → name: "receipts", private

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router, TypeScript strict |
| Database / Auth / Storage | Supabase (PostgreSQL + RLS) |
| Server state | TanStack Query v5 |
| Grid/table | TanStack Table v8 |
| Styling | Tailwind CSS v3 + CSS variables |

## Architecture

```
src/
  domain/        # entities, interfaces, types (no dependencies)
  repositories/  # Supabase implementations of domain interfaces
  services/      # business logic — calls repositories, never Supabase directly
  hooks/         # TanStack Query hooks (client components only)
  app/           # Next.js routes + pages
  components/    # Pure UI components (no business logic)
  lib/           # Supabase clients, formatters, constants
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only, never exposed to client) |

## Features

- **Spreadsheet view** — all transactions in one table with inline editing, search, filters, quick-add row
- **Dashboard** — KPI cards, budget progress bar, category breakdown, donut chart, overdue list, history chart
- **Monthly evolution** — avg income/expense insights, line/area/bar charts, savings table
- **Baixa flow** — mark transactions as paid/received with optional amount override, notes, and receipt upload
- **Fixed transactions** — auto-populate each month from recurring templates
- **Dark mode** — full dark theme via CSS custom properties
- **Privacy mode** — blur all monetary values with one click
