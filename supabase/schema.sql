-- SafetyAI — Schema multi-tenant su Supabase (Postgres)
-- Fondazione per l'autenticazione reale: sostituisce lo storage locale (localStorage)
-- con dati persistenti e ISOLATI PER ACCOUNT tramite Row Level Security (RLS).
--
-- Modello: ogni utente autenticato (auth.users) è "owner" e vede SOLO i propri dati.
-- Gerarchia: aziende -> appalti -> appaltatori (subappaltatori = self-reference) -> lavoratori -> attestati.
-- Applicare nel SQL editor di Supabase (o via migrazione MCP).

-- ─── AZIENDE ────────────────────────────────────────────────────────────────
create table if not exists public.aziende (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome         text not null default '',
  piva         text default '',
  sede         text default '',
  ateco        text default '',
  settore      text default '',
  dipendenti   int,
  figure       jsonb not null default '{}'::jsonb,
  rischi       jsonb not null default '[]'::jsonb,
  creato_il    timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);

-- ─── APPALTI ────────────────────────────────────────────────────────────────
create table if not exists public.appalti (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  azienda_id   uuid not null references public.aziende(id) on delete cascade,
  titolo       text default '',
  area         text default '',
  data_inizio  date,
  data_fine    date,
  stato        text default 'attivo',
  cse_nome     text default '',
  creato_il    timestamptz not null default now()
);

-- ─── APPALTATORI (subappaltatore = parent_id valorizzato) ─────────────────────
create table if not exists public.appaltatori (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  appalto_id   uuid not null references public.appalti(id) on delete cascade,
  parent_id    uuid references public.appaltatori(id) on delete cascade,
  nome         text default '',
  piva         text default '',
  referente    text default '',
  email        text default '',
  telefono     text default '',
  creato_il    timestamptz not null default now()
);

-- ─── LAVORATORI ───────────────────────────────────────────────────────────────
create table if not exists public.lavoratori (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  appaltatore_id uuid not null references public.appaltatori(id) on delete cascade,
  nome           text not null default '',
  cf             text default '',
  mansione       text default '',
  creato_il      timestamptz not null default now()
);

-- ─── ATTESTATI (dato sanitario possibile: idoneità → RLS stretta) ─────────────
create table if not exists public.attestati (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lavoratore_id        uuid not null references public.lavoratori(id) on delete cascade,
  tipo                 text default '',
  rilascio             date,
  scadenza             date,
  ore                  int,
  ente                 text default '',
  normativa            text default '',
  conforme             boolean,
  problema_conformita  text default '',
  decisione_operatore  text,           -- 'approvato' | 'scartato' | null
  confidenza           int,
  note                 text default '',
  creato_il            timestamptz not null default now()
);

-- ─── INDICI ───────────────────────────────────────────────────────────────────
create index if not exists idx_aziende_owner       on public.aziende(owner_id);
create index if not exists idx_appalti_azienda      on public.appalti(azienda_id);
create index if not exists idx_appaltatori_appalto  on public.appaltatori(appalto_id);
create index if not exists idx_lavoratori_appalt    on public.lavoratori(appaltatore_id);
create index if not exists idx_attestati_lavoratore on public.attestati(lavoratore_id);
create index if not exists idx_attestati_scadenza   on public.attestati(scadenza);

-- ─── ROW LEVEL SECURITY: ogni account vede SOLO i propri dati ─────────────────
alter table public.aziende      enable row level security;
alter table public.appalti      enable row level security;
alter table public.appaltatori  enable row level security;
alter table public.lavoratori   enable row level security;
alter table public.attestati    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['aziende','appalti','appaltatori','lavoratori','attestati']
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t || '_owner_isolation', t);
  end loop;
end $$;

-- NOTE:
-- • Isolamento per singolo account (consulente/azienda). La condivisione a team/organizzazione
--   si aggiunge in seguito con una tabella membership + policy basate sull'appartenenza.
-- • Con l'auth di Supabase, owner_id si popola da auth.uid() automaticamente all'insert.
-- • Consigliata la region UE del progetto Supabase per i dati (anche sanitari).
