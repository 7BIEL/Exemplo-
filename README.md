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

## Onde editar
- Imóveis, regiões e contatos: `assets/js/data.js`
- Estilos e cores (tokens em `:root`): `assets/css/style.css`
- Comportamentos: `assets/js/main.js`

Favoritos ficam salvos no navegador (localStorage). O formulário de contato não envia dados a um servidor: ele organiza a mensagem e abre o WhatsApp.
Imagens carregadas do Unsplash; se alguma não carregar, um espaço neutro “Imagem demonstrativa” é exibido.
