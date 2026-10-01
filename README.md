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
- Imóveis: no Supabase (Table Editor) — o painel próprio chega na ETAPA 2
- Regiões e contatos: `assets/js/data.js`
- Conexão com o banco: `assets/js/config.js` · consultas: `assets/js/api.js`
- Estilos e cores (tokens em `:root`): `assets/css/style.css`
- Comportamentos: `assets/js/main.js`

Favoritos ficam salvos no navegador (localStorage). O formulário de contato não envia dados a um servidor: ele organiza a mensagem e abre o WhatsApp.
Imagens carregadas do Unsplash; se alguma não carregar, um espaço neutro “Imagem demonstrativa” é exibido.
