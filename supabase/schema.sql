-- =========================================================
-- Lucas Almeida · Negócios Imobiliários — ETAPA 1
-- Estrutura do banco no Supabase.
--
-- Como usar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- Pode ser executado mais de uma vez (idempotente).
-- Depois rode supabase/seed.sql para inserir os imóveis de teste.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- Tabela: admins  (quem poderá gerenciar imóveis na ETAPA 2)
-- ---------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- Função auxiliar usada nas políticas RLS.
-- security definer: consegue ler "admins" mesmo com RLS ativo.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------
-- Tabela: imoveis
-- ---------------------------------------------------------
create table if not exists public.imoveis (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  codigo           text not null unique,
  titulo           text not null,
  tipo             text not null,
  finalidade       text not null default 'comprar',
  status           text not null default 'disponivel',
  destaque         boolean not null default false,
  destaque_rotulo  text,
  destaque_ordem   integer,
  publicado        boolean not null default false,
  preco            numeric(14,2) not null,
  condominio_valor numeric(12,2),
  iptu             numeric(12,2),
  cidade           text not null,
  bairro           text,
  quartos          integer not null default 0,
  suites           integer not null default 0,
  banheiros        integer not null default 0,
  vagas            integer not null default 0,
  area             numeric(10,2),
  lat              numeric(9,6),
  lng              numeric(9,6),
  resumo           text,
  descricao        text,
  caracteristicas  jsonb not null default '[]'::jsonb,
  itens_condominio jsonb not null default '[]'::jsonb,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),

  constraint imoveis_slug_formato   check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint imoveis_tipo_valido    check (tipo in ('Casa', 'Apartamento', 'Terreno', 'Comercial')),
  constraint imoveis_finalidade_ok  check (finalidade in ('comprar', 'alugar')),
  constraint imoveis_status_valido  check (status in ('disponivel', 'reservado', 'vendido', 'alugado')),
  constraint imoveis_preco_positivo check (preco >= 0),
  constraint imoveis_carac_array    check (jsonb_typeof(caracteristicas) = 'array'),
  constraint imoveis_cond_array     check (jsonb_typeof(itens_condominio) = 'array')
);

create index if not exists imoveis_publicado_idx on public.imoveis (publicado, status);
create index if not exists imoveis_destaque_idx  on public.imoveis (destaque, destaque_ordem) where destaque;
create index if not exists imoveis_cidade_idx    on public.imoveis (cidade);

-- Atualiza "atualizado_em" automaticamente
create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists imoveis_atualizado_em on public.imoveis;
create trigger imoveis_atualizado_em
  before update on public.imoveis
  for each row execute function public.set_atualizado_em();

-- ---------------------------------------------------------
-- Tabela: imovel_fotos
-- caminho = URL completa (http...)   → foto externa (ex.: Unsplash nos dados de teste)
--         = "<id-do-imovel>/<arquivo>" → arquivo no bucket "imoveis" do Storage
-- ---------------------------------------------------------
create table if not exists public.imovel_fotos (
  id        uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  caminho   text not null,
  ordem     integer not null default 0,
  legenda   text
);

create index if not exists imovel_fotos_imovel_idx on public.imovel_fotos (imovel_id, ordem);

-- ---------------------------------------------------------
-- RLS (Row Level Security)
-- Visitantes (anon): leem SOMENTE imóveis publicados e as fotos deles.
-- Admins (usuário logado presente em "admins"): acesso total — usado na ETAPA 2.
-- Ninguém escreve com a chave anon.
-- ---------------------------------------------------------
alter table public.imoveis      enable row level security;
alter table public.imovel_fotos enable row level security;
alter table public.admins       enable row level security;

drop policy if exists "imoveis: leitura publica dos publicados" on public.imoveis;
create policy "imoveis: leitura publica dos publicados"
  on public.imoveis for select
  to anon, authenticated
  using (publicado = true);

drop policy if exists "imoveis: admin total" on public.imoveis;
create policy "imoveis: admin total"
  on public.imoveis for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "fotos: leitura publica de imoveis publicados" on public.imovel_fotos;
create policy "fotos: leitura publica de imoveis publicados"
  on public.imovel_fotos for select
  to anon, authenticated
  using (exists (
    select 1 from public.imoveis i
    where i.id = imovel_fotos.imovel_id and i.publicado = true
  ));

drop policy if exists "fotos: admin total" on public.imovel_fotos;
create policy "fotos: admin total"
  on public.imovel_fotos for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Um usuário logado só consegue ver a própria linha em "admins".
-- Não há política de insert/update/delete: admins são cadastrados
-- manualmente no SQL Editor (que ignora RLS).
drop policy if exists "admins: ver a propria linha" on public.admins;
create policy "admins: ver a propria linha"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

-- Permissões de tabela (o RLS acima é quem filtra as linhas)
grant select on public.imoveis, public.imovel_fotos to anon, authenticated;
grant insert, update, delete on public.imoveis, public.imovel_fotos to authenticated;
grant select on public.admins to authenticated;
revoke insert, update, delete on public.imoveis, public.imovel_fotos, public.admins from anon;

-- ---------------------------------------------------------
-- Storage: bucket público "imoveis"
-- Estrutura de pastas: imoveis/<id-do-imovel>/<arquivo>
-- Leitura pública (as fotos aparecem no site); escrita só por admins.
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imoveis', 'imoveis', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "imoveis bucket: leitura publica" on storage.objects;
create policy "imoveis bucket: leitura publica"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'imoveis');

drop policy if exists "imoveis bucket: admin envia" on storage.objects;
create policy "imoveis bucket: admin envia"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'imoveis' and public.is_admin());

drop policy if exists "imoveis bucket: admin atualiza" on storage.objects;
create policy "imoveis bucket: admin atualiza"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'imoveis' and public.is_admin())
  with check (bucket_id = 'imoveis' and public.is_admin());

drop policy if exists "imoveis bucket: admin remove" on storage.objects;
create policy "imoveis bucket: admin remove"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'imoveis' and public.is_admin());
