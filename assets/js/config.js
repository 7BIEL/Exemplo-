/*
 * Configuração do Supabase (somente valores PÚBLICOS).
 *
 * Onde encontrar: Supabase → Project Settings → API (ou "API Keys").
 *   SUPABASE_URL      → "Project URL", ex.: https://abcdefghijkl.supabase.co
 *   SUPABASE_ANON_KEY → a chave pública: "anon public" (começa com eyJ...)
 *                       ou "publishable" (começa com sb_publishable_...)
 *
 * NUNCA coloque aqui a chave "service_role" nem a "secret" (sb_secret_...).
 * Este arquivo é público: qualquer visitante consegue lê-lo. A chave anon
 * é feita para isso — quem protege os dados são as políticas RLS do banco.
 */
window.APP_CONFIG = Object.freeze({
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  STORAGE_BUCKET: "imoveis",
});
