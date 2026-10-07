/* ==========================================================================
   NOSSO QUINTAL — CONTEÚDO EDITÁVEL
   Tudo que o site mostra e que depende de confirmação do restaurante está aqui.
   Valor null = ainda não confirmado: o site mostra um espaço preparado,
   nunca um dado inventado.
   ========================================================================== */
window.NQ = {
  /* --- Contatos e links oficiais --- */
  instagram: "https://www.instagram.com/nossoquintallimeira/",
  whatsapp: null,            // só dígitos com DDI+DDD, ex.: "5519999999999"
  whatsappMensagem: "Olá, Nosso Quintal! Quero reservar uma mesa.",
  ifood: null,               // link oficial da página do Nosso Quintal no iFood
  spotify: null,             // link oficial da playlist
  cardapioUrl: null,         // link do cardápio oficial completo (PDF, site ou iFood)
  telefone: null,            // aparece no schema/rodapé só se preenchido

  /* --- Endereço (informado pelo restaurante) --- */
  endereco: { rua: "Av. Piracicaba, 294", bairro: "Vila São João", cidade: "Limeira", uf: "SP" },

  /* --- Horários: valor inicial das fontes públicas. Edite à vontade. ---
     Use "16h às 00h" ou null para fechado. */
  horariosConfirmados: false,
  horarios: [
    { dia: "Segunda",  texto: null },
    { dia: "Terça",    texto: "16h às 00h" },
    { dia: "Quarta",   texto: "16h às 00h" },
    { dia: "Quinta",   texto: "16h às 00h" },
    { dia: "Sexta",    texto: "16h às 00h" },
    { dia: "Sábado",   texto: "16h às 00h" },
    { dia: "Domingo",  texto: null }
  ],

  /* --- Destaques do cardápio ---
     Troque para true SOMENTE se o restaurante confirmar quais são os carros-chefes
     (o título passa a "Carros-chefes"). Itens: { nome, descricao, preco, imagem }.
     preco como texto, ex.: "R$ 00,00". Deixe null o que não for confirmado. */
  destaquesOficiais: false,
  destaques: [],

  /* --- Cardápio (somente itens e categorias reais) ---
     [{ nome: "Categoria", itens: [{ nome, descricao, preco, imagem, vegetariano:true, destaque:true }] }] */
  cardapio: [],

  /* --- Avaliações reais (3 a 5). { texto, autor, fonte } ---
     Só copie avaliações públicas reais ou autorizadas, com o nome como aparece na plataforma. */
  avaliacoes: [],

  /* --- Nossa história: preencha o que o proprietário contar. Texto ou null. --- */
  historia: {
    comoNasceu: null,
    quemIdealizou: null,
    porQueONome: null,
    evolucao: null,
    filosofia: null,
    momentos: null
  }
};
