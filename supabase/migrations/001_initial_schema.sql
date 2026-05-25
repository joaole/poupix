-- PouPix initial schema
-- Run: npm run db:migrate

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Categories
-- ============================================================
create table if not exists categories (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users on delete cascade,
  name        text        not null,
  type        text        not null check (type in ('income','expense')),
  color       text        not null default '#888888',
  slug        text        not null,
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists categories_user_id_idx on categories (user_id);

-- ============================================================
-- Fixed transaction templates
-- ============================================================
create table if not exists fixed_templates (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users on delete cascade,
  type             text        not null check (type in ('income','expense')),
  description      text        not null,
  category_id      uuid        not null references categories on delete restrict,
  day_of_month     int         not null check (day_of_month between 1 and 31),
  predicted_amount numeric(12,2) not null default 0,
  is_dynamic       boolean     not null default false,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists fixed_templates_user_id_idx on fixed_templates (user_id);

-- ============================================================
-- Transactions
-- ============================================================
create table if not exists transactions (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users on delete cascade,
  type                text        not null check (type in ('income','expense')),
  description         text        not null,
  category_id         uuid        not null references categories on delete restrict,
  is_fixed            boolean     not null default false,
  fixed_template_id   uuid        references fixed_templates on delete set null,
  reference_month     text        not null,              -- YYYY-MM
  scheduled_date      date        not null,
  predicted_amount    numeric(12,2) not null default 0,
  paid_amount         numeric(12,2),
  paid_at             date,
  notes               text        not null default '',
  attachment_url      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists transactions_user_month_idx on transactions (user_id, reference_month);
create index if not exists transactions_user_id_idx    on transactions (user_id);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_updated_at
  before update on transactions
  for each row execute function set_updated_at();

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table categories       enable row level security;
alter table fixed_templates  enable row level security;
alter table transactions     enable row level security;

-- categories: users only see/modify their own
create policy "categories: select own"  on categories for select  using (auth.uid() = user_id);
create policy "categories: insert own"  on categories for insert  with check (auth.uid() = user_id);
create policy "categories: update own"  on categories for update  using (auth.uid() = user_id);
create policy "categories: delete own"  on categories for delete  using (auth.uid() = user_id);

-- fixed_templates: users only see/modify their own
create policy "templates: select own"   on fixed_templates for select  using (auth.uid() = user_id);
create policy "templates: insert own"   on fixed_templates for insert  with check (auth.uid() = user_id);
create policy "templates: update own"   on fixed_templates for update  using (auth.uid() = user_id);
create policy "templates: delete own"   on fixed_templates for delete  using (auth.uid() = user_id);

-- transactions: users only see/modify their own
create policy "transactions: select own" on transactions for select  using (auth.uid() = user_id);
create policy "transactions: insert own" on transactions for insert  with check (auth.uid() = user_id);
create policy "transactions: update own" on transactions for update  using (auth.uid() = user_id);
create policy "transactions: delete own" on transactions for delete  using (auth.uid() = user_id);
