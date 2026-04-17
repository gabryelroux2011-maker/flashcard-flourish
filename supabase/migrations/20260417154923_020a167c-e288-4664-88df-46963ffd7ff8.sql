-- Graspr-style study tool schema (single-user MVP, no auth yet)
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#CE93D8',
  created_at timestamptz not null default now()
);

create table public.decks (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.folders(id) on delete set null,
  title text not null,
  description text,
  source_text text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  title text not null,
  summary text not null,
  key_points jsonb not null default '[]'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  title text not null,
  questions jsonb not null default '[]'::jsonb,
  attempts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.mindmaps (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  title text not null,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.folders enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.quizzes enable row level security;
alter table public.mindmaps enable row level security;

create policy "open all" on public.folders for all using (true) with check (true);
create policy "open all" on public.decks for all using (true) with check (true);
create policy "open all" on public.cards for all using (true) with check (true);
create policy "open all" on public.quizzes for all using (true) with check (true);
create policy "open all" on public.mindmaps for all using (true) with check (true);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger decks_touch before update on public.decks
for each row execute function public.touch_updated_at();

insert into storage.buckets (id, name, public)
values ('study-sources', 'study-sources', true)
on conflict (id) do nothing;

create policy "public read sources" on storage.objects
for select using (bucket_id = 'study-sources');

create policy "public write sources" on storage.objects
for insert with check (bucket_id = 'study-sources');

create policy "public update sources" on storage.objects
for update using (bucket_id = 'study-sources');

create policy "public delete sources" on storage.objects
for delete using (bucket_id = 'study-sources');