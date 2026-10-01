-- =========================================================
-- Correção dos avisos do verificador de segurança do Supabase
-- (aplicada depois do schema.sql; pode ser executada mais de uma vez)
--
-- 1. set_atualizado_em: search_path fixo (vazio).
-- 2. is_admin() sai do schema "public" (exposto pela API em /rest/v1/rpc)
--    e vai para o schema "private", que a API não expõe.
--    Só usuários logados podem executá-la — é o que as políticas RLS
--    do painel precisam. As políticas passam a usar private.is_admin().
-- =========================================================

-- 1) Trigger com search_path fixo (now() vem de pg_catalog, sempre disponível)
alter function public.set_atualizado_em() set search_path = '';

-- 2) Schema privado, fora da API
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.is_admin() from anon;
grant execute on function private.is_admin() to authenticated;

-- Políticas que usavam public.is_admin() passam a usar private.is_admin()
drop policy if exists "imoveis: admin total" on public.imoveis;
create policy "imoveis: admin total"
  on public.imoveis for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "fotos: admin total" on public.imovel_fotos;
create policy "fotos: admin total"
  on public.imovel_fotos for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "imoveis bucket: admin envia" on storage.objects;
create policy "imoveis bucket: admin envia"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'imoveis' and private.is_admin());

drop policy if exists "imoveis bucket: admin atualiza" on storage.objects;
create policy "imoveis bucket: admin atualiza"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'imoveis' and private.is_admin())
  with check (bucket_id = 'imoveis' and private.is_admin());

drop policy if exists "imoveis bucket: admin remove" on storage.objects;
create policy "imoveis bucket: admin remove"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'imoveis' and private.is_admin());

-- A versão antiga, exposta pela API, deixa de existir
drop function if exists public.is_admin();
