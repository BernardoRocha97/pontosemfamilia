-- Pontos de Família — schema Supabase (Postgres)
-- Corre isto no SQL Editor do teu projeto Supabase.

create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pin_hash text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '⭐',
  points integer not null,
  frequency text not null default 'ilimitada'
    check (frequency in ('ilimitada', 'diaria', 'semanal', 'mensal')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete set null,
  profile_id uuid not null references profiles(id) on delete cascade,
  points integer not null,
  reason text,
  created_at timestamptz not null default now()
);

create index entries_created_at_idx on entries (created_at desc);
create index entries_profile_id_idx on entries (profile_id);

-- Desafios: bónus automático quando uma tarefa é cumprida N dias/semanas seguidos.
create table challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '🏅',
  task_id uuid not null references tasks(id) on delete cascade,
  unit text not null check (unit in ('dia', 'semana')),
  target integer not null check (target > 0),
  bonus_points integer not null check (bonus_points > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Regista quando um desafio já foi premiado, para não dar o bónus duas vezes
-- pela mesma sequência (streak_key identifica o início dessa sequência).
create table challenge_awards (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  streak_key text not null,
  awarded_at timestamptz not null default now(),
  unique (challenge_id, profile_id, streak_key)
);

-- RLS: app privada de 2 pessoas. Leitura livre com a anon key (dados não sensíveis
-- fora dos PINs), escrita de entries/tasks livre, mas login (perfis) só via RPC
-- para nunca expor pin_hash ao cliente.

alter table profiles enable row level security;
alter table tasks enable row level security;
alter table entries enable row level security;
alter table challenges enable row level security;
alter table challenge_awards enable row level security;

create policy "profiles: leitura pública (sem pin_hash, ver view)" on profiles
  for select using (false); -- ninguém lê a tabela profiles diretamente

create view public_profiles as
  select id, name, color from profiles;

grant select on public_profiles to anon, authenticated;

create policy "tasks: leitura pública" on tasks for select using (true);
create policy "tasks: escrita pública" on tasks for insert with check (true);
create policy "tasks: update público" on tasks for update using (true);
create policy "tasks: delete público" on tasks for delete using (true);

create policy "entries: leitura pública" on entries for select using (true);
create policy "entries: escrita pública" on entries for insert with check (true);
create policy "entries: delete público" on entries for delete using (true);

create policy "challenges: leitura pública" on challenges for select using (true);
create policy "challenges: escrita pública" on challenges for insert with check (true);
create policy "challenges: update público" on challenges for update using (true);
create policy "challenges: delete público" on challenges for delete using (true);

create policy "challenge_awards: leitura pública" on challenge_awards for select using (true);
create policy "challenge_awards: escrita pública" on challenge_awards for insert with check (true);

-- RPC: valida PIN sem expor o hash. Devolve o perfil se o PIN estiver certo.
create or replace function verify_pin(profile_id uuid, pin text)
returns table (id uuid, name text, color text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
    select p.id, p.name, p.color
    from profiles p
    where p.id = verify_pin.profile_id
      and p.pin_hash = crypt(verify_pin.pin, p.pin_hash);
end;
$$;

grant execute on function verify_pin(uuid, text) to anon, authenticated;

-- RPC: define/atualiza o PIN de um perfil (usado nas Definições).
create or replace function set_pin(profile_id uuid, new_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update profiles
  set pin_hash = crypt(new_pin, gen_salt('bf'))
  where id = set_pin.profile_id;
end;
$$;

grant execute on function set_pin(uuid, text) to anon, authenticated;

-- Seed inicial: os dois perfis (PIN inicial "0000" — mudem nas Definições).
insert into profiles (name, pin_hash, color) values
  ('Bernardo', crypt('0000', gen_salt('bf')), '#3b82f6'),
  ('Beatriz', crypt('0000', gen_salt('bf')), '#ec4899');

-- Seed de tarefas de exemplo (podem editar/apagar tudo depois nas Definições).
insert into tasks (name, icon, points, frequency) values
  ('Lavar a loiça', '🍽️', 15, 'ilimitada'),
  ('Aspirar a casa', '🧹', 20, 'semanal'),
  ('Tirar o lixo', '🗑️', 10, 'ilimitada'),
  ('Cozinhar o jantar', '🍳', 20, 'ilimitada'),
  ('Tratar da roupa', '🧺', 15, 'semanal'),
  ('Limpar a casa de banho', '🚽', 20, 'semanal'),
  ('Fazer as compras', '🛒', 15, 'ilimitada'),
  ('Arrumar a sala', '🛋️', 10, 'diaria'),
  ('Limpar o frigorífico', '🧊', 25, 'mensal'),
  ('Deixou loiça suja', '💢', -15, 'ilimitada'),
  ('Esqueceu uma tarefa combinada', '😤', -10, 'ilimitada');

-- Enable realtime nas tabelas relevantes (também podes fazer isto na UI do Supabase
-- em Database > Replication).
alter publication supabase_realtime add table entries;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table challenges;
