/*
 * Dados DEMONSTRATIVOS.
 * Contatos e regiões abaixo são
 * fictícios e existem apenas para apresentar o conceito do projeto.
 */

const IMG = (id, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const SITE = {
  nome: "Lucas Almeida",
  cargo: "Corretor de Imóveis",
  creci: "CRECI-SP 123456-F",
  regiao: "Campinas e região",
  whatsapp: "5519999991234",
  whatsappLabel: "(19) 99999-1234",
  email: "contato@lucasalmeidaimoveis.com.br",
  instagram: "lucasalmeida.imoveis",
};

/*
 * Os imóveis agora ficam no banco Supabase (tabelas imoveis e imovel_fotos).
 * Os dados que estavam aqui foram migrados para supabase/seed.sql.
 * A leitura é feita por assets/js/api.js.
 */

const REGIOES = [
  { nome: "Campinas", img: "1449824913935-59a10b8d2000", texto: "Bairros consolidados, boa oferta de serviços e opções para todos os perfis." },
  { nome: "Valinhos", img: "1600585154340-be6161a56a0c", texto: "Condomínios horizontais e ritmo tranquilo, perto de tudo." },
  { nome: "Vinhedo", img: "1564013799919-ab600027ffc6", texto: "Terrenos e casas em um ambiente mais verde e reservado." },
  { nome: "Sumaré", img: "1570129477492-45c003edd2be", texto: "Opções acessíveis para a primeira compra ou investimento." },
  { nome: "Paulínia", img: "1580587771525-78b9dba3b914", texto: "Crescimento planejado e novos empreendimentos residenciais." },
];
