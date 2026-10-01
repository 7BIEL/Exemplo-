# Lucas Almeida · Negócios Imobiliários — projeto demonstrativo

Site estático (HTML, CSS e JavaScript, sem build) para um corretor de imóveis autônomo.

> **Todos os dados são fictícios** — nome, CRECI, contatos, imóveis, valores, regiões, depoimentos e imagens servem apenas para demonstrar o conceito.

## Páginas
- `index.html` — início, busca, destaques, sobre, serviços, vender, regiões, depoimentos, CTA e contato
- `imoveis.html` — listagem com filtros (URL compartilhável), ordenação e favoritos
- `imovel.html?id=…` — galeria com lightbox, detalhes, mapa aproximado, “Tenho interesse” (WhatsApp pré-preenchido) e “Agendar visita”

## Rodar localmente
```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Banco de dados (Supabase) — ETAPA 1
Os imóveis vêm do Supabase (tabelas `imoveis` e `imovel_fotos`).
1. Crie um projeto em supabase.com.
2. SQL Editor → rode `supabase/schema.sql` (tabelas, RLS e bucket `imoveis`).
3. SQL Editor → rode `supabase/seed.sql` (os 6 imóveis de teste).
4. Preencha `assets/js/config.js` com a Project URL e a chave **anon/publishable** (nunca a service_role).

Fotos: `imovel_fotos.caminho` aceita uma URL completa ou um caminho no bucket `imoveis` no formato `<id-do-imovel>/<arquivo>`.

## Onde editar
- Imóveis: pelo painel em `/admin/` (ETAPA 2)
- Regiões e contatos: `assets/js/data.js`
- Conexão com o banco: `assets/js/config.js` · consultas: `assets/js/api.js`
- Estilos e cores (tokens em `:root`): `assets/css/style.css`
- Comportamentos: `assets/js/main.js`

Favoritos ficam salvos no navegador (localStorage). O formulário de contato não envia dados a um servidor: ele organiza a mensagem e abre o WhatsApp.
Imagens carregadas do Unsplash; se alguma não carregar, um espaço neutro “Imagem demonstrativa” é exibido.

## Painel administrativo — ETAPA 2
Endereço: `/admin/` (ex.: `http://localhost:8000/admin/`).

- **Login** com e-mail e senha do Supabase Auth. Só entra quem está na tabela `admins`.
- **Visão geral**: totais, situação dos imóveis e pendências (publicado sem foto, destaque em rascunho…).
- **Imóveis**: busca, filtros, troca de situação, publicar/rascunho e destaque direto na lista, excluir.
- **Cadastro e edição**: todos os campos de `imoveis`, fotos com upload múltiplo (otimizadas para WebP até 1920 px antes do envio), ordem, capa e exclusão.

Arquivos: `admin/*.html`, `assets/js/admin.js`, `assets/css/admin.css`.
A biblioteca `@supabase/supabase-js` 2.117.2 (MIT) está em `assets/vendor/` — não depende de CDN.

### Configuração no Supabase
1. **Authentication → Sign In / Providers**: desative “Allow new users to sign up” (os admins são criados manualmente).
2. **Authentication → URL Configuration**: em *Site URL* e *Redirect URLs*, inclua o endereço do site e `…/admin/index.html` (necessário para o link de “Esqueci minha senha”).
3. Novo admin: crie o usuário em *Authentication → Users* e rode no SQL Editor:
   `insert into public.admins (user_id) select id from auth.users where email = 'email@exemplo.com';`

Segurança: o painel usa apenas a chave pública. Quem impede alterações por terceiros são as políticas RLS de `supabase/schema.sql`.
